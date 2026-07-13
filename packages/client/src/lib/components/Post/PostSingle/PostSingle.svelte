<script lang="ts">
  import PortableTextRender from '$lib/components/PortableText/PortableTextRender.svelte'
  import {formatDate} from '$lib/format'
  import DuotoneFilters from '$lib/components/graphics/DuotoneFilters.svelte'
  import type {Post} from '$lib/types'

  let {post}: {post: Post} = $props()
</script>

<article>
  <header>
    <h1>{post.title}</h1>
    {#if post.authors?.length}
      <div class="authors">
        {#each post.authors as author, i (author._key)}
          {#if i > 0}<span class="sep">, </span>{/if}
          {#if author.url}
            <a href={author.url} target="_blank" rel="noreferrer">{author.name}</a>
          {:else}
            <span>{author.name}</span>
          {/if}
        {/each}
      </div>
    {/if}
    {#if post.date}
      <div class="meta">
        <span class="date">{formatDate(post.date)}</span>
      </div>
    {/if}
  </header>

  {#if post.content}
    <div class="content">
      <PortableTextRender content={post.content} />
    </div>
  {/if}
</article>

<!-- SVG filter defs referenced by ImageBlock's duotone styles -->
<DuotoneFilters />

<style lang="scss">
  article {
    width: 100%;
    max-width: var(--content-width);
    min-height: 80dvh;
    margin: 0 auto;
    padding-inline: 1em;
    padding-top: 1em;
    padding-bottom: 2em;
    box-sizing: border-box;
  }

  header {
    margin-bottom: 1rem;
  }

  h1 {
    margin-top: 0.5rem;
    margin-bottom: 0;
  }

  .authors {
    color: var(--foreground);
  }

  .meta {
    display: flex;
    color: var(--foreground);
  }

  .authors {
    font-style: italic;
    // background: red;
  }
</style>
