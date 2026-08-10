<script lang="ts">
  import Metadata from '$lib/components/Metadata.svelte'
  import {formatDate} from '$lib/format'
  import {SITE_NAME} from '$lib/constants'
  import type {PageData} from './$types'

  let {data}: {data: PageData} = $props()

  // The cms title names the page (browser tab, share previews); fall back to
  // "Index" when the singleton has not been created yet.
  const title = $derived(data.index.title || 'Index')
</script>

<Metadata title={`${title} | ${SITE_NAME}`} />

<main>
  {#if data.index.posts.length > 0}
    <table>
      <tbody>
        {#each data.index.posts as post (post._id)}
          <tr>
            <td class="date">{formatDate(post.date)}</td>
            <td class="title"><a href="/posts/{post.slug}">{post.title}</a></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</main>

<style lang="scss">
  // Mirrors PostSingle's article so the index reads as a content page.
  main {
    width: 100%;
    max-width: var(--content-width);
    min-height: 80dvh;
    margin: 0 auto;
    padding-inline: 1em;
    padding-top: 1em;
    padding-bottom: 2em;
    box-sizing: border-box;
  }

  // Hairline rules and a bold title, matching the post list under the logo on
  // the front page.
  table {
    width: 100%;
    border-collapse: collapse;
    color: var(--foreground);
    border-top: 1px solid var(--foreground);
  }

  td {
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--foreground);
    text-align: left;
    vertical-align: baseline;
  }

  // Shrink the date column to its own content; the title column takes the rest.
  .date {
    width: 1%;
    white-space: nowrap;
    padding-right: 1.5rem;
  }

  .title a {
    color: inherit;
    font-weight: bold;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
</style>
