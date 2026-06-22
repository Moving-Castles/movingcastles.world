import {loadData} from '$lib/modules/sanity'
import {siteSettingsQuery} from '$lib/groq'
import type {NavLink} from '$lib/types'

// Loads the header/footer links for content pages. The query coalesces to an
// empty array, so a missing siteSettings singleton resolves to [] (no 404).
export async function load() {
  const links = await loadData<NavLink[]>(siteSettingsQuery)
  return {links}
}
