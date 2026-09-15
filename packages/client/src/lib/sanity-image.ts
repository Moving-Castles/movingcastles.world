// Sanity image URL builder. Needs only the project details, not the client, so
// it stays importable from components (which also run in the browser).

import {createImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'
import {SANITY_ID, SANITY_DATASET} from '$lib/constants'

const builder = createImageUrlBuilder({projectId: SANITY_ID, dataset: SANITY_DATASET})

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}
