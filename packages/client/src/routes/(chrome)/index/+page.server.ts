import {loadData} from '$lib/server/sanity'
import {postIndexQuery} from '$lib/groq'
import type {PostIndex} from '$lib/types'

// The one route that is not prerendered. Prerendering writes each page to
// `<path>.html`, and the front page to `index.html` — so `/index` would land
// on the same file as `/`, and SvelteKit silently drops the second. (Netlify
// would resolve `/index` to that file too; the `_redirects` rule beside
// package.json forces it to the render function instead.) So this page is
// rendered on demand and held in Netlify's durable cache, which every deploy
// purges: with content changes arriving as deploys (see the README), the cache
// is exactly as fresh as the prerendered pages around it.
export const prerender = false

// The listing is curated in the cms via the Post index singleton, the same way
// the front page curates its posts through the Frontpage singleton. The query
// coalesces to an empty index, so this renders (empty) rather than 404ing
// before the document exists.
export async function load({setHeaders}) {
  const index = await loadData<PostIndex>(postIndexQuery)
  setHeaders({
    // Browsers revalidate on every visit, and the CDN answers those with the
    // cached copy until the next deploy replaces it.
    'cache-control': 'public, max-age=0, must-revalidate',
    'netlify-cdn-cache-control': 'public, durable, s-maxage=31536000',
  })
  return {index}
}
