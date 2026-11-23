import {loadData} from '#lib/server/sanity.js'
import {siteSettingsQuery} from '#lib/groq/index.js'
import type {SiteLinks} from '#lib/types/index.js'
import {PREVIEW} from '#lib/server/preview.js'

// The whole site is prerendered at build time: every route is static content
// curated in Sanity, so pages are served from the CDN as files rather than by
// a function that queries Sanity on every request. Content changes reach the
// site through a rebuild — a Sanity webhook calls a Netlify build hook on
// publish (see the README). The post route opts into `'auto'` so a post
// published between builds still renders on demand until the next one.
// A preview renders every page on request instead, so a draft shows on reload.
export const prerender = !PREVIEW

// Header and footer links, loaded once at the root so every route inherits them
// — including unmatched-route 404s, which only ever reach the root
// +error.svelte. The query coalesces both rows to empty arrays, so a missing
// siteSettings singleton resolves cleanly (no 404) and can't fault the load for
// every page.
export async function load() {
  const {headerLinks, footerLinks} = await loadData<SiteLinks>(siteSettingsQuery)
  // `preview` tells the page it is the preview build: working notes show.
  return {headerLinks, footerLinks, preview: PREVIEW}
}
