import {loadData} from '$lib/modules/sanity'
import {siteSettingsQuery} from '$lib/groq'
import type {NavLink} from '$lib/types'

// Header/footer links, loaded once at the root so every route inherits them —
// including unmatched-route 404s, which only ever reach the root +error.svelte.
// The query coalesces to an empty array, so a missing siteSettings singleton
// resolves to [] (no 404) and can't fault the load for every page.
export async function load() {
  const links = await loadData<NavLink[]>(siteSettingsQuery)
  return {links}
}
