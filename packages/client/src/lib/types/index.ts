import type {Post as PostDocument, ContentEditor, SanityImageAsset} from '@sanity-types'

// Re-export generated types that are consumed as-is.
export type {ContentEditor}

// An image field whose asset reference has been dereferenced via GROQ `asset->`.
export interface ExpandedImage extends Omit<NonNullable<PostDocument['featuredImage']>, 'asset'> {
  asset?: Pick<SanityImageAsset, '_id' | 'url'>
}

// Shape returned by `postsQuery` / `frontpageQuery` (listing).
// `slug` is projected to a plain string via `"slug": slug.current`.
export interface PostListItem extends Pick<PostDocument, '_id' | 'title' | 'date' | 'authors'> {
  slug: string
  featuredImage?: ExpandedImage
}

// A bibliography entry on a post; the text cites it via `cite` annotations
// that anchor-link to #ref-{id} in the rendered end notes.
export type BibReference = NonNullable<PostDocument['references']>[number]

// Shape returned by `postBySlugQuery` (single).
export interface Post extends PostListItem {
  content?: ContentEditor
  references?: BibReference[]
  // Optional editor-authored meta/social description; falls back to truncated
  // body text in Metadata.svelte when empty.
  metaDescription?: string
  // Opt-in: show the fixed table of contents beside the text on wide screens.
  showToc?: boolean
}

// A single header/footer link, as projected by `siteSettingsQuery`. Either an
// external link (its `url`) or an internal link to a post (its resolved `slug`,
// rendered as `/posts/{slug}`). Discriminated by `_type`.
interface NavLinkBase {
  _key: string
  label: string
}

export interface ExternalNavLink extends NavLinkBase {
  _type: 'navLink'
  url: string
}

export interface PostNavLink extends NavLinkBase {
  _type: 'navPostLink'
  slug: string
}

export type NavLink = ExternalNavLink | PostNavLink
