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

// A row of the post index. The project code and categories are selected by
// `postIndexQuery` only — the frontpage listing does not ask for them, so they
// stay off `PostListItem` rather than being optionals that are always absent
// there.
export interface PostIndexItem extends PostListItem {
  projectCode?: string
  categories?: string[]
}

// Shape returned by `postIndexQuery` — the Post index singleton, its post
// references resolved to listing items. `title` is optional here even though
// the cms marks it required: the query falls back to an empty index when the
// singleton does not exist yet.
export interface PostIndex {
  title?: string
  posts: PostIndexItem[]
}

// A bibliography entry on a post; the text cites it via `cite` annotations
// that anchor-link to #ref-{id} in the rendered end notes.
export type BibReference = NonNullable<PostDocument['references']>[number]

// A related resource on a post (a model card, a repository), rendered as a
// row of links under the abstract.
export type ExternalLink = NonNullable<PostDocument['externalLinks']>[number]

// A manual table-of-contents entry. When a post carries these, the ToC
// renders them (index shown verbatim) instead of deriving entries from the
// H2 headings.
export interface TocEntry {
  _key: string
  index?: string
  label: string
  anchor: string
}

// Shape returned by `postBySlugQuery` (single).
export interface Post extends PostListItem {
  content?: ContentEditor
  references?: BibReference[]
  // Project designation (e.g. "MC000"), shown beside the publication date.
  projectCode?: string
  // Related resources, rendered as a link row under the abstract.
  externalLinks?: ExternalLink[]
  // Optional editor-authored meta/social description; falls back to truncated
  // body text in Metadata.svelte when empty.
  metaDescription?: string
  // Opt-in: show the fixed table of contents beside the text on wide screens.
  showToc?: boolean
  // Optional manual ToC entries; when present they replace the derived H2 list.
  toc?: TocEntry[]
}

// Shape returned by `siteSettingsQuery`: the header's and the footer's link
// rows, each curated and ordered separately in the cms.
export interface SiteLinks {
  headerLinks: NavLink[]
  footerLinks: NavLink[]
}

// A single header/footer link, as projected by `siteSettingsQuery`: an external
// link (its `url`), an internal link to a post (its resolved `slug`, rendered
// as `/posts/{slug}`), or a link to the post index at `/index` (label only).
// Discriminated by `_type`.
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

export interface IndexNavLink extends NavLinkBase {
  _type: 'navIndexLink'
}

export type NavLink = ExternalNavLink | PostNavLink | IndexNavLink
