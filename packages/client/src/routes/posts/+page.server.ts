import {redirect} from '@sveltejs/kit'

// The bare /posts route has no listing — send visitors to the front page,
// which surfaces the curated posts from the Frontpage singleton.
export function load() {
  redirect(307, '/')
}
