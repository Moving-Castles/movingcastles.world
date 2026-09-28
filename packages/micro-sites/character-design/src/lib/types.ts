import type {
  MicroSite as MicroSiteDocument,
  SanityImageAsset,
  SanityImageDimensions,
} from '@sanity-types'

// The image field with its asset reference dereferenced by GROQ `asset->`.
export interface ExpandedImage extends Omit<NonNullable<MicroSiteDocument['image']>, 'asset'> {
  asset?: Pick<SanityImageAsset, '_id' | 'url'> & {
    metadata?: {dimensions?: SanityImageDimensions}
  }
}

// Shape returned by `microSiteQuery`.
export interface MicroSite extends Pick<
  MicroSiteDocument,
  'title' | 'metadata' | 'content' | 'link' | 'metaDescription'
> {
  image?: ExpandedImage
}
