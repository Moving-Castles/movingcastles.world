import {loadData} from '$lib/modules/sanity'
import {frontpageQuery} from '$lib/groq'
import type {PostListItem} from '$lib/types'

export async function load() {
  const posts = await loadData<PostListItem[]>(frontpageQuery)
  return {posts}
}
