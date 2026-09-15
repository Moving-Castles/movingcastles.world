// Server-only Sanity access: the client and the query helper the load
// functions use. Lives under $lib/server so SvelteKit refuses to bundle it for
// the browser — nothing client-side ever queries Sanity, and the client alone
// is ~32 KB gzipped. The pure Portable Text helpers (rendering, plain text,
// headings) are in $lib/portable-text, which both sides import.

import {createClient} from '@sanity/client'
import {SANITY_ID, SANITY_DATASET} from '$lib/constants'

export const client = createClient({
  projectId: SANITY_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2026-01-01',
  // Queries run at build time (the site is prerendered — see the root
  // +layout.server.ts), so they must see the latest published content: the API
  // CDN can lag a publish by a few seconds, which is exactly the window in
  // which the publish webhook triggers the build.
  useCdn: false,
})

export const loadData = async <T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T> => {
  try {
    const res = await client.fetch(query, params)
    if (res === null) {
      return Promise.reject(new Error('404'))
    }
    return res
  } catch (err) {
    return Promise.reject(new Error('404'))
  }
}
