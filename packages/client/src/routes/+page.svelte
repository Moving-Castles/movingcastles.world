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

  {#if data.posts.length > 0}
    <ul class="posts">
      {#each data.posts as post (post._id)}
        <li>
          {#if post.date}<span class="year">{formatDate(post.date)}</span>{/if}
          <a href="/posts/{post.slug}">
            <span class="title">{post.title}</span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
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
    color: var(--foreground-dark);
    border-top: 1px solid var(--foreground-dark);

    li {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
      padding: 0.6rem 0;
      color: inherit;

      &:last-child {
        border-bottom: 1px solid var(--foreground-dark);
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
      color: var(--foreground-dark);
    }
  }
</style>
