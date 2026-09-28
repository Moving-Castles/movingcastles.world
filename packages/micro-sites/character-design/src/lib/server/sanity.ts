// Server-only Sanity access. The page is prerendered, so this runs once, at
// build time; nothing in the browser ever queries Sanity.

import {createClient} from '@sanity/client'
import {SANITY_ID, SANITY_DATASET} from '$lib/site'
import type {MicroSite} from '$lib/types'

const client = createClient({
  projectId: SANITY_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2026-01-01',
  // A publish triggers the build (Sanity webhook → Netlify build hook), and the
  // API CDN can lag a publish by a few seconds: exactly the window in which the
  // build starts.
  useCdn: false,
})

// The image asset is expanded for its url (the share image) and dimensions
// (the <img> width/height, so the layout doesn't shift as it loads).
const microSiteQuery = `
	*[_type == "microSite" && slug.current == $slug][0] {
		title,
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
		link,
		metaDescription
	}
`

export const loadMicroSite = (slug: string) =>
  client.fetch<MicroSite | null>(microSiteQuery, {slug})
