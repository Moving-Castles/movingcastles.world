import {createImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'
import {SANITY_ID, SANITY_DATASET} from '$lib/site'

const builder = createImageUrlBuilder({projectId: SANITY_ID, dataset: SANITY_DATASET})

// Passed the whole image field (not just its asset), the builder applies the
// editor's crop and, for fixed-ratio crops, centres on the hotspot.
export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}
