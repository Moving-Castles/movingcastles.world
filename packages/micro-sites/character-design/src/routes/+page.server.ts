import {loadMicroSite} from '$lib/server/sanity'
import {SITE_SLUG} from '$lib/site'

export async function load() {
  const site = await loadMicroSite(SITE_SLUG)
  // Fails the prerender and with it the build, so a missing or unpublished
  // document never replaces the live page: Netlify keeps serving the last
  // successful deploy. A plain Error rather than a 404 so the build log says
  // why (the prerenderer reports an http error by its status alone).
  if (!site) {
    throw new Error(`No published microSite document with the slug "${SITE_SLUG}" in Sanity`)
  }
  return {site}
}
