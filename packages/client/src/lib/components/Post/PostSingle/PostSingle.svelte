<script lang="ts">
  import {renderBlockText} from '$lib/modules/sanity'
  import type {Post} from '$lib/types'

  let {post}: {post: Post} = $props()

  const year = (date?: string) => (date ? new Date(date).getFullYear() : '')
</script>

<article>
  {#if post.featuredImage?.asset?.url}
    <figure class="featured">
      <img src={post.featuredImage.asset.url} alt={post.featuredImage.caption ?? post.title} />
      {#if post.featuredImage.caption}<figcaption>{post.featuredImage.caption}</figcaption>{/if}
    </figure>
  {/if}

  <header>
    <!-- <div class="meta">
      {#if post.authors && post.authors.length > 0}
        <span class="authors">
          {#each post.authors as author, i (author._key)}
            {#if author.url}<a href={author.url} target="_blank" rel="noreferrer">{author.name}</a
              >{:else}{author.name}{/if}{i < post.authors.length - 1 ? ', ' : ''}
          {/each}
        </span>
      {/if}
      {#if post.date}<span class="date">{year(post.date)}</span>{/if}
    </div> -->
    <h1>{post.title}</h1>
  </header>

  {#if post.content}
    <div class="content">{@html renderBlockText(post.content)}</div>
  {/if}
</article>

<style lang="scss">
  article {
    width: 100%;
    max-width: var(--content-width);
    margin: 0 auto;
    padding-top: 1em;
    padding-bottom: 2em;
    box-sizing: border-box;
  }

  .back {
    display: inline-block;
    margin-bottom: 2rem;
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
    margin-top: 0.75rem;
  }

  .meta {
    display: flex;
    gap: 1rem;
    color: var(--foreground-dimmed);
  }

  .authors a {
    color: inherit;
  }

  .featured {
    margin: 0 0 2rem;
    height: 400px;
    overflow: hidden;

    img {
      display: block;
      width: 100%;
      height: auto;
      object-fit: cover;
    }

    figcaption {
      margin-top: 0.5rem;
      color: var(--foreground-dimmed);
    }
  }
</style>
