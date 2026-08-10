import {redirect} from '@sveltejs/kit'

// Posts live under /posts/{slug}, but the listing itself is at /index — send
// anyone who reaches the bare /posts there rather than 404ing.
export function load() {
  redirect(307, '/index')
}
