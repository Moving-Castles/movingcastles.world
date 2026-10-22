// Every page is rendered at build time and served as a static file: the
// site's front page at /, each page at /<slug>. They have no interactive
// parts, so no JavaScript is shipped to hydrate them. Content changes reach
// the site through a rebuild: the Sanity webhook calls the Netlify build hook
// on publish (see the README).
export const prerender = true
export const csr = false
