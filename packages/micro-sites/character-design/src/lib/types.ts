import type {
  MicroSitePage as PageDocument,
  SanityImageAsset,
  SanityImageDimensions,
} from '@sanity-types'

// The image field with its asset reference dereferenced by GROQ `asset->`.
export interface ExpandedImage extends Omit<NonNullable<PageDocument['image']>, 'asset'> {
  asset?: Pick<SanityImageAsset, '_id' | 'url'> & {
    metadata?: {dimensions?: SanityImageDimensions}
  }
}

// A page linked from another one: the previous events under the content.
export interface PageLink {
  title: string
  subtitle?: string
  slug: string
}

// Shape returned by `pageQuery`.
export interface Page extends Pick<
  PageDocument,
  'title' | 'subtitle' | 'metadata' | 'content' | 'metaDescription'
> {
  slug: string
  image?: ExpandedImage
  previousEvents: PageLink[]
}

// Shape returned by `siteQuery`.
export interface Site {
  title: string
  // Slug of the page served at /, or null while none is set.
  frontPage: string | null
  // Slugs of every published page, each prerendered at /<slug>.
  pages: string[]
}
