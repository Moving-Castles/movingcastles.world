import {loadData} from '$lib/modules/sanity'
import {siteSettingsQuery} from '$lib/groq'
import type {SiteLinks} from '$lib/types'

// Header and footer links, loaded once at the root so every route inherits them
// — including unmatched-route 404s, which only ever reach the root
// +error.svelte. The query coalesces both rows to empty arrays, so a missing
// siteSettings singleton resolves cleanly (no 404) and can't fault the load for
// every page.
export async function load() {
  const {headerLinks, footerLinks} = await loadData<SiteLinks>(siteSettingsQuery)
  return {headerLinks, footerLinks}
}
