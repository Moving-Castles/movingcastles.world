<script lang="ts">
  import Logo from '$lib/components/graphics/Logo.svelte'
  import Metadata from '$lib/components/Metadata.svelte'
  import {formatDate} from '$lib/format'
  import type {PageData} from './$types'

  let {data}: {data: PageData} = $props()
</script>

<Metadata />

<main>
  <div class="lockup-container">
    <Logo />
  </div>

  <ul class="posts">
    {#each data.posts as post (post._id)}
      <li>
        {#if post.date}<span class="year">{formatDate(post.date)}</span>{/if}
        <a href="/posts/{post.slug}">
          <span class="title">{post.title}</span>
        </a>
      </li>
    {/each}
    <li class="index">
      <a href="/index">[index]</a>
    </li>
  </ul>
</main>

<style lang="scss">
  main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 2.5rem;
    min-height: 100dvh;
    width: 100dvw;
    box-sizing: border-box;
    padding: 3rem 1.25rem;
    background-color: var(--background);
  }

  .lockup-container {
    width: 240px;
    max-width: 90dvw;
  }

  .posts {
    list-style: none;
    margin: 0;
    padding: 0;
    // padding-top: 0.5em;
    width: 100%;
    max-width: 420px;
    color: var(--foreground);
    border-top: 1px solid var(--foreground);

    li {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
      padding: 0.6rem 0;
      color: inherit;

      &:last-child {
        border-bottom: 1px solid var(--foreground);
      }

      a {
        color: inherit;
        text-decoration: none;
        font-weight: bold;

        &:hover .title {
          text-decoration: underline;
        }
      }
    }

    .year {
      flex-shrink: 0;
      color: var(--foreground);
    }

    // The index row is a post row in every dimension — same padding, same row
    // box — but carries the mono/small type of the site chrome, centred. Its
    // height is unchanged by the smaller font: the inherited line-height is a
    // computed length (body's 1.4em, resolved against the base font size).
    li.index {
      justify-content: center;
      border-top: 1px solid var(--foreground);
      font-family: var(--font-stack-mono);
      font-size: var(--font-size-small);

      a {
        font-weight: normal;

        // Lightens on hover like the header/footer links, rather than taking
        // the underline the post rows above it use.
        &:hover {
          color: var(--foreground-emphasis);
        }
      }
    }
  }
</style>
