<script lang="ts">
  import {renderBlockText} from '$lib/modules/sanity'
  import type {Post} from '$lib/types'

  let {post}: {post: Post} = $props()

  const year = (date?: string) => (date ? new Date(date).getFullYear() : '')
</script>

<article>
  <a class="back" href="/posts">← Posts</a>

  <header>
    <h1>{post.title}</h1>
    <div class="meta">
      {#if post.authors && post.authors.length > 0}
        <span class="authors">
          {#each post.authors as author, i (author._key)}
            {#if author.url}<a href={author.url} target="_blank" rel="noreferrer">{author.name}</a
              >{:else}{author.name}{/if}{i < post.authors.length - 1 ? ', ' : ''}
          {/each}
        </span>
      {/if}
      {#if post.date}<span class="date">{year(post.date)}</span>{/if}
    </div>
  </header>

  {#if post.featuredImage?.asset?.url}
    <figure class="featured">
      <img src={post.featuredImage.asset.url} alt={post.featuredImage.caption ?? post.title} />
      {#if post.featuredImage.caption}<figcaption>{post.featuredImage.caption}</figcaption>{/if}
    </figure>
  {/if}

  {#if post.content}
    <div class="content">{@html renderBlockText(post.content)}</div>
  {/if}
</article>

<style lang="scss">
  article {
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1.25rem 6rem;
    box-sizing: border-box;
  }

  .back {
    display: inline-block;
    margin-bottom: 2rem;
    font-size: 0.85rem;
    color: inherit;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  header {
    margin-bottom: 2rem;
  }

  h1 {
    margin: 0 0 0.75rem;
    font-size: 2rem;
    line-height: 1.1;
  }

  .meta {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    opacity: 0.7;
  }

  .authors a {
    color: inherit;
  }

  .featured {
    margin: 0 0 2rem;

    img {
      display: block;
      width: 100%;
      height: auto;
    }

    figcaption {
      margin-top: 0.5rem;
      font-size: 0.8rem;
      opacity: 0.7;
    }
  }

  // Portable Text output (rendered via {@html})
  .content {
    line-height: 1.6;

    :global(p) {
      margin: 0 0 1.25rem;
    }

    :global(h1),
    :global(h2),
    :global(h3) {
      margin: 2rem 0 0.75rem;
      line-height: 1.2;
    }

    :global(blockquote) {
      margin: 1.5rem 0;
      padding-left: 1rem;
      border-left: 2px solid currentColor;
      opacity: 0.85;
    }

    :global(hr) {
      margin: 2rem 0;
      border: none;
      border-top: 1px solid currentColor;
    }

    :global(figure.content-image) {
      margin: 1.5rem 0;
    }

    :global(figure.content-image img) {
      display: block;
      width: 100%;
      height: auto;
    }

    :global(figure.content-image figcaption) {
      margin-top: 0.5rem;
      font-size: 0.8rem;
      opacity: 0.7;
    }
  }
</style>
