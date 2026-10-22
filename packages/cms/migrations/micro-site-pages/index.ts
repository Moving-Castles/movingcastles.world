import {at, create, createIfNotExists, defineMigration, patch, set} from 'sanity/migrate'

// A micro-site used to be one `microSite` document that was the page itself.
// It is now the site (title, slug, front page) plus one `microSitePage`
// document per page, referencing it (schemas/MicroSite.ts).
//
// This moves the page fields of every published `microSite` document into a
// new page and points the site's front page at it. Both land as DRAFTS, to
// review and publish from the Studio: the page first, then the site. The
// page fields stay on the site document for now — the micro-site code on
// `main` still renders from them until the code that renders pages is live —
// and `micro-site-cleanup` removes them afterwards.
//
//   pnpm --filter cms exec sanity migrations run micro-site-pages              # dry run
//   pnpm --filter cms exec sanity migrations run micro-site-pages --no-dry-run

const PAGE_FIELDS = ['title', 'subtitle', 'metaDescription', 'metadata', 'image', 'content']

// Fields the API sets itself, which a create mutation must not carry.
const SYSTEM_FIELDS = ['_rev', '_createdAt', '_updatedAt']

const without = (doc: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(Object.entries(doc).filter(([key]) => !keys.includes(key)))

export default defineMigration({
  title: 'Move each micro-site’s page into a microSitePage draft and make it the front page',
  documentTypes: ['microSite'],
  migrate: {
    async document(doc, context) {
      // Published documents only: a site's draft is created or updated below
      // from its published version.
      if (doc._id.startsWith('drafts.')) return []
      // Nothing to move: a site created after the change, or already cleaned.
      if (!PAGE_FIELDS.some((field) => field in doc && field !== 'title')) return []

      const slug = (doc.slug as {current?: string} | undefined)?.current
      if (!slug) throw new Error(`${doc._id} has no slug`)

      // One page per site, named after it. The slug doubles as the page's
      // first address (/<slug>); rename it in the Studio before publishing.
      const pageId = `microSitePage-${slug}`
      const existing = await context.client.fetch<string[]>('*[_id in $ids]._id', {
        ids: [pageId, `drafts.${pageId}`],
      })
      if (existing.length) return []

      const page = {
        _id: `drafts.${pageId}`,
        _type: 'microSitePage',
        site: {_type: 'reference', _ref: doc._id},
        slug: {_type: 'slug', current: slug},
        ...Object.fromEntries(PAGE_FIELDS.filter((field) => field in doc).map((f) => [f, doc[f]])),
      }

      // The page exists only as a draft at this point, which a strong reference
      // may not point to. Weak until the site is published, when the Studio
      // strengthens it: the same way the Studio itself references a draft.
      const frontPage = {
        _type: 'reference',
        _ref: pageId,
        _weak: true,
        _strengthenOnPublish: {type: 'microSitePage'},
      }
      const siteDraftId = `drafts.${doc._id}`
      return [
        create(page),
        createIfNotExists({...without(doc, SYSTEM_FIELDS), _id: siteDraftId, _type: doc._type}),
        patch(siteDraftId, at('frontPage', set(frontPage))),
      ]
    },
  },
})
