// One page, rendered at build time and served as a static file. It has no
// interactive parts, so no JavaScript is shipped to hydrate it. Content
// changes reach the page through a rebuild: the Sanity webhook calls the
// Netlify build hook on publish (see the README).
export const prerender = true
export const csr = false
