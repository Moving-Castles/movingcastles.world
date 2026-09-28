// The identity of this micro-site. The scaffold script
// (packages/scripts/create-micro-site.mjs) copies an existing micro-site and
// rewrites its name and domain, here and in package.json and netlify.toml.

// The `microSite` document this site renders: its slug in Sanity, which is
// also the name of this package.
export const SITE_SLUG = 'character-design'

// Public origin, for the canonical link and og:url.
export const SITE_URL = 'https://character-design.movingcastles.world'

export const SANITY_ID = '610gfr7y'
export const SANITY_DATASET = 'production'
