import {error} from '@sveltejs/kit'
import {loadData} from '$lib/modules/sanity'
import {postBySlugQuery} from '$lib/groq'
import type {Post} from '$lib/types'

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
