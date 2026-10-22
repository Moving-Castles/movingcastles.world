import {error} from '@sveltejs/kit'
import {loadSite, loadPage} from '#lib/server/sanity.js'
import {SITE_SLUG} from '#lib/site.js'
import type {EntryGenerator} from './$types'

// Every published page of the site, the front page included: it stays at its
// own address once another page takes the root. `entries` lists them so each
// is prerendered whether or not another page links to it.
export const entries: EntryGenerator = async () => {
  const site = await loadSite(SITE_SLUG)
  return (site?.pages ?? []).map((slug) => ({slug}))
}

export async function load({params}) {
  const [site, page] = await Promise.all([loadSite(SITE_SLUG), loadPage(SITE_SLUG, params.slug)])
  if (!page) error(404, 'Page not found')
  return {page, isFront: site?.frontPage === params.slug}
}
