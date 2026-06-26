<script lang="ts">
  import {page} from '$app/state'
  import {SITE_NAME} from '$lib/constants'
  import Metadata from '$lib/components/Metadata.svelte'
  import Header from '$lib/components/chrome/Header.svelte'
  import type {NavLink} from '$lib/types'

  // The root +error.svelte renders inside the (chrome-less) root layout, so it
  // brings its own Header to match the post page. `links` come from the root
  // +layout.server.ts, which loads them for every route — including the
  // unmatched-route 404s that only this boundary catches. Default to [] as a
  // fallback.
  const links = $derived((page.data?.links as NavLink[] | undefined) ?? [])

  const heading = $derived(page.status === 404 ? 'Page not found' : 'Something went wrong')
</script>

<Metadata title={`${heading} | ${SITE_NAME}`} />

<Header {links} />

<article>
  <div class="content">
    <h1>{page.status}</h1>
    <p><a href="/">Go to landing page</a></p>
  </div>
</article>

<style lang="scss">
  // Mirrors PostSingle's article so the error page reads as a content page.
  article {
    width: 100%;
    max-width: var(--content-width);
    margin: 0 auto;
    padding-inline: 1em;
    padding-top: 1em;
    padding-bottom: 2em;
    box-sizing: border-box;
  }

  h1 {
    margin-top: 0.5rem;
    margin-bottom: 0;
  }
</style>
