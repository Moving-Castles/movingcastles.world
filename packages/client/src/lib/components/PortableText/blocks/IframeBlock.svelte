<script lang="ts">
  import MediaFrame from './MediaFrame.svelte'

  // The `iframe` block from the cms contentEditor schema.
  interface IframeValue {
    url?: string
    caption?: string
    aspectRatio?: string
    smallMargin?: boolean
    largeView?: boolean
  }

  let {value}: {value: IframeValue} = $props()
</script>

<!-- The editor picks a display ratio; the iframe fills the content width
     and derives its height from it. -->
{#snippet frame()}
  <iframe
    src={value.url}
    title={value.caption || 'Embedded content'}
    style="aspect-ratio: {value.aspectRatio || '16/9'}"
    loading="lazy"
    allowfullscreen
  ></iframe>
{/snippet}

{#if value.url}
  <figure class:small-vertical-margin={value.smallMargin}>
    {#if value.largeView}
      <MediaFrame wide expandable>
        {@render frame()}
      </MediaFrame>
    {:else}
      {@render frame()}
    {/if}
    {#if value.caption}<figcaption>{value.caption}</figcaption>{/if}
  </figure>
{/if}

<style>
  figure {
    margin: 0;
    margin-top: 2em;
    margin-bottom: 2em;
  }

  figure.small-vertical-margin {
    margin-top: 1em;
    margin-bottom: 0.5em;
  }

  iframe {
    display: block;
    width: 100%;
    border: none;
  }

  /* Lightbox: fill the whole overlay while the MediaFrame around the embed
     is expanded; the in-article aspect ratio (inline style) no longer
     applies. */
  :global(.expanded) iframe {
    width: calc(100vw - 6rem);
    height: calc(100vh - 6rem);
    aspect-ratio: auto !important;
  }

  figcaption {
    margin-top: 0.5rem;
    margin-bottom: 1rem;
    color: var(--foreground);
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    line-height: var(--line-height-base);
  }
</style>
