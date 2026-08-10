import {loadData} from '$lib/modules/sanity'
import {postIndexQuery} from '$lib/groq'
import type {PostIndex} from '$lib/types'

// The listing is curated in the cms via the Post index singleton, the same way
// the front page curates its posts through the Frontpage singleton. The query
// coalesces to an empty index, so this renders (empty) rather than 404ing
// before the document exists.
export async function load() {
  const index = await loadData<PostIndex>(postIndexQuery)
  return {index}
}
