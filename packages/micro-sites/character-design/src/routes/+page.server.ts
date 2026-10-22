import {loadSite, loadPage} from '#lib/server/sanity.js'
import {SITE_SLUG} from '#lib/site.js'

// The site's front page, the one its document names. Each failure throws a
// plain Error, which fails the prerender and with it the build, so a missing
// or unpublished document never replaces the live site: Netlify keeps serving
// the last successful deploy. (A 404 would be reported by its status alone;
// the message says why in the build log.)
export async function load() {
  const site = await loadSite(SITE_SLUG)
  if (!site) {
    throw new Error(`No published microSite document with the slug "${SITE_SLUG}" in Sanity`)
  }
  if (!site.frontPage) {
    throw new Error(`The microSite "${SITE_SLUG}" has no published front page set in Sanity`)
  }
  const page = await loadPage(SITE_SLUG, site.frontPage)
  if (!page) {
    throw new Error(
      `The front page "${site.frontPage}" of "${SITE_SLUG}" is not published in Sanity`,
    )
  }
  return {page, isFront: true}
}
