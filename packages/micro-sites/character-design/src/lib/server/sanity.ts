// Server-only Sanity access. The pages are prerendered, so this runs at build
// time only; nothing in the browser ever queries Sanity.

import {createClient} from '@sanity/client'
import {SANITY_ID, SANITY_DATASET} from '#lib/site.js'
import type {Page, PageLink, Site} from '#lib/types.js'

const client = createClient({
  projectId: SANITY_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2026-01-01',
  // A publish triggers the build (Sanity webhook → Netlify build hook), and the
  // API CDN can lag a publish by a few seconds: exactly the window in which the
  // build starts.
  useCdn: false,
})

// The site: which of its pages is the front page, and the slugs of all of
// them, for prerendering /[slug].
const siteQuery = `
	*[_type == "microSite" && slug.current == $site][0] {
		title,
		"frontPage": frontPage->slug.current,
		"pages": *[_type == "microSitePage" && site._ref == ^._id].slug.current
	}
`

// A page of the site. The image asset is expanded for its url (the share
// image) and dimensions (the <img> width/height, so the layout doesn't shift
// as it loads). The previous events are dereferenced for their link; an
// unpublished one comes back null and is dropped.
const pageQuery = `
	*[_type == "microSitePage" && site->slug.current == $site && slug.current == $slug][0] {
		title,
		subtitle,
		"slug": slug.current,
		metaDescription,
		metadata,
		image {
			...,
			asset-> {
				_id,
				url,
				metadata {dimensions}
			}
		},
		content,
		"previousEvents": previousEvents[]-> {title, subtitle, "slug": slug.current}
	}
`

type PageResult = Omit<Page, 'previousEvents'> & {previousEvents?: (PageLink | null)[] | null}

export const loadSite = (site: string) => client.fetch<Site | null>(siteQuery, {site})

export const loadPage = async (site: string, slug: string): Promise<Page | null> => {
  const page = await client.fetch<PageResult | null>(pageQuery, {site, slug})
  if (!page) return null
  return {
    ...page,
    previousEvents: (page.previousEvents ?? []).filter((event): event is PageLink => !!event),
  }
}
