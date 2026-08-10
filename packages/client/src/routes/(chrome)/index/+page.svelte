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
      <thead>
        <tr>
          <th class="date">date</th>
          <th class="title">title</th>
        </tr>
      </thead>
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
  // Mirrors PostSingle's article so the index reads as a content page. The one
  // departure is the top padding: 1.5rem is the whole space between the header
  // and the column headers, landing them where a post title sits (the article's
  // 1em plus the h1's own 0.5rem).
  main {
    width: 100%;
    max-width: var(--content-width);
    min-height: 80dvh;
    margin: 0 auto;
    padding-inline: 1em;
    padding-top: 1rem;
    padding-bottom: 2em;
    box-sizing: border-box;
  }

  // Hairline rules and a bold title, matching the post list under the logo on
  // the front page. The column headers are unruled above — the first rule on
  // the page is the one under them.
  table {
    width: 100%;
    border-collapse: collapse;
    color: var(--foreground);
  }

  th,
  td {
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--foreground);
    text-align: left;
    vertical-align: baseline;
  }

  // Column headers take the small mono of the site chrome.
  th {
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    font-weight: normal;
  }

  // Shrink the date column to its own content; the title column takes the rest.
  .date {
    width: 1%;
    white-space: nowrap;
    padding-right: 2.5rem;
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
