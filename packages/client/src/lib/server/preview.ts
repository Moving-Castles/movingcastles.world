// Whether this build shows drafts: set PREVIEW=1 in the environment of a
// separate, password-protected deploy. Unset, the site is the public one,
// prerendered from published content. Read from process.env, so it holds both
// while building and in the render function.
export const PREVIEW = process.env.PREVIEW === '1'
