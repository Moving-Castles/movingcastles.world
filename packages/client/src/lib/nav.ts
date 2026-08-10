import type {NavLink} from '$lib/types'

// Resolves a header/footer NavLink to the href and whether it leaves the site.
// External links (incl. mailto:) open in a new tab; internal links — a post, or
// the post index — use same-tab, client-side navigation.
export const resolveNavLink = (link: NavLink): {href: string; external: boolean} => {
  switch (link._type) {
    case 'navPostLink':
      return {href: `/posts/${link.slug}`, external: false}
    case 'navIndexLink':
      return {href: '/index', external: false}
    default:
      return {href: link.url, external: true}
  }
}
