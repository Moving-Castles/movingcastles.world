import type {NavLink} from '$lib/types'

// Resolves a header/footer NavLink to the href and whether it leaves the site.
// External links (incl. mailto:) open in a new tab; internal post links use
// same-tab, client-side navigation.
export const resolveNavLink = (link: NavLink): {href: string; external: boolean} =>
  link._type === 'navPostLink'
    ? {href: `/posts/${link.slug}`, external: false}
    : {href: link.url, external: true}
