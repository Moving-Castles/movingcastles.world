import {loadData} from '#lib/server/sanity.js'
import {frontpageQuery} from '#lib/groq/index.js'
import type {PostListItem} from '#lib/types/index.js'

export async function load() {
  const posts = await loadData<PostListItem[]>(frontpageQuery)
  return {posts}
}
