import type {Handle} from '@sveltejs/kit/hooks'
import {PREVIEW} from '#lib/server/preview.js'

// A preview is kept out of search engines and analytics, and is never cached:
// every response says noindex, robots.txt disallows everything, the page's
// robots meta says noindex and the analytics script is left out. On the public
// site this hook passes every request through untouched.
export const handle: Handle = async ({event, resolve}) => {
  if (!PREVIEW) return resolve(event)

  if (event.url.pathname === '/robots.txt') {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: {'content-type': 'text/plain', 'x-robots-tag': 'noindex, nofollow'},
    })
  }

  const response = await resolve(event, {
    transformPageChunk: ({html}) =>
      html
        .replace('content="index, follow"', 'content="noindex, nofollow"')
        .replace(/<!-- Fathom[\s\S]*?<!-- \/ Fathom -->/, ''),
  })
  response.headers.set('x-robots-tag', 'noindex, nofollow')
  response.headers.set('cache-control', 'private, no-store')
  response.headers.set('netlify-cdn-cache-control', 'no-store')
  return response
}
