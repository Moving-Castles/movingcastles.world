<script lang="ts">
  import {renderBlockText} from '$lib/modules/sanity'
  import {formatDate} from '$lib/format'
  import type {Post} from '$lib/types'

  let {post}: {post: Post} = $props()
</script>

<article>
  <header>
    <h1>{post.title}</h1>
    <div class="meta">
      {#if post.date}<span class="date">{formatDate(post.date)}</span>{/if}
    </div>
  </header>

  <!-- {#if post.featuredImage?.asset?.url}
    <figure class="featured">
      <img src={post.featuredImage.asset.url} alt={post.featuredImage.caption ?? post.title} />
      {#if post.featuredImage.caption}<figcaption>{post.featuredImage.caption}</figcaption>{/if}
    </figure>
  {/if} -->

  {#if post.content}
    <div class="content">{@html renderBlockText(post.content)}</div>
  {/if}
</article>

<style lang="scss">
  article {
    width: 100%;
    max-width: var(--content-width);
    margin: 0 auto;
    padding-inline: 1em;
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
    margin-top: 0.5rem;
    margin-bottom: 0;
    // padding-bottom: 0.5em;
    // border-bottom: 1px solid var(--foreground);
  }

  .meta {
    display: flex;
    // gap: 1rem;
    color: var(--foreground-dark);
    // font-size: var(--font-size-small);
    // font-family: var(--font-stack-mono);
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
      object-fit: cover;
    }

    figcaption {
      margin-top: 0.5rem;
      color: var(--foreground-dark);
    }
  }
</style>
