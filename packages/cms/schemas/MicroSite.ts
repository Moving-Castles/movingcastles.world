import {MdPublic} from 'react-icons/md'

// A site served from its own subdomain, e.g. character-design.movingcastles.world.
// Each package in packages/micro-sites/ renders the document whose `slug`
// matches its name, and the `microSitePage` documents that reference it
// (MicroSitePage.ts): the front page at the site's root, every page at
// /<slug>. A new micro-site needs a new document rather than a new type. The
// scaffold script (packages/scripts/create-micro-site.mjs) creates it as a
// draft, with the id `microSite-<name>` that the site's webhook filter and
// its pages' references rely on, and sets its title and slug; both are locked
// here, and the Studio offers no "create" for this type (sanity.config.ts).
export default {
  name: 'microSite',
  title: 'Micro-site',
  icon: MdPublic,
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Set by the scaffold script.',
      readOnly: true,
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Site',
      type: 'slug',
      description:
        'The package in packages/micro-sites/ that serves this site, e.g. "character-design". Set by the scaffold script; the site’s build and webhook depend on it.',
      readOnly: true,
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'frontPage',
      title: 'Front page',
      type: 'reference',
      to: [{type: 'microSitePage'}],
      description:
        'The page served at the root of the site. Every page is also served at /<slug>. Without a published front page the site does not build (the last deploy stays live).',
      options: {
        disableNew: true,
        // This site's pages: they reference its published id.
        filter: ({document}: {document: {_id: string}}) => ({
          filter: 'site._ref == $site',
          params: {site: document._id.replace(/^drafts\./, '')},
        }),
      },
    },
  ],
  preview: {
    select: {title: 'title', subtitle: 'slug.current'},
  },
}
