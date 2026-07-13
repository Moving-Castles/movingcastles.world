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

  {#if post.references?.length}
    <!-- End notes. No heading of its own: the content is expected to close
         with its own "References" heading. `cite` marks in the text
         anchor-link to #ref-{id} here. -->
    <section class="references">
      <ul>
        {#each post.references as ref (ref._key)}
          <li id="ref-{ref.id}">
            {ref.text}
            {#if ref.url}
              <a href={ref.url} target="_blank" rel="noreferrer">{ref.url}</a>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
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

  .references {
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      margin-bottom: 0.75em;
      color: var(--foreground);
      font-family: var(--font-stack-mono);
      font-size: var(--font-size-small);
      line-height: var(--line-height-base);
      // Long DOI/arXiv URLs must wrap instead of widening the column.
      overflow-wrap: anywhere;
      // Give the entry a little air when it is jumped to via a citation, and
      // highlight it as the jump target.
      scroll-margin-top: 2rem;

      &:target {
        color: var(--foreground-emphasis);
      }
    }

    a {
      color: inherit;
    }
  }
</style>
