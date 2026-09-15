import {error} from '@sveltejs/kit'
import {loadData} from '$lib/server/sanity'
import {postBySlugQuery, postSlugsQuery} from '$lib/groq'
import type {Post} from '$lib/types'
import type {EntryGenerator} from './$types'

// Every published post is prerendered — `entries` lists them all, so posts
// not linked from the front page or the index (which the prerenderer would
// find by crawling) are built too. `'auto'` rather than `true` keeps the
// route in the server so a slug the last build didn't know (a post published
// since) is rendered on demand instead of 404ing until the next build.
export const prerender = 'auto'

export const entries: EntryGenerator = async () => {
  const slugs = await loadData<string[]>(postSlugsQuery)
  return slugs.map((slug) => ({slug}))
}

export async function load({params}) {
  // loadData rejects when the query resolves to null (no matching post),
  // so a missing slug surfaces as a proper 404 rather than a 500.
  try {
    const post = await loadData<Post>(postBySlugQuery, {slug: params.slug})
    return {post}
  } catch {
    throw error(404, 'Post not found')
  }
}
