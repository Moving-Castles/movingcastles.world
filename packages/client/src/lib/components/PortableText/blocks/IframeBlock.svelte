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
      <!-- No clickToExpand: an embed needs its own clicks. -->
      <MediaFrame wide expandable caption={value.caption}>
        {@render frame()}
      </MediaFrame>
    {:else}
      {@render frame()}
    {/if}
    <!-- MediaFrame renders the caption when it wraps the media, so the
         control can sit inline with the caption text. -->
    {#if !value.largeView && value.caption}<figcaption>{value.caption}</figcaption>{/if}
  </figure>
{/if}

<style>
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
    height: var(--lightbox-height, calc(100vh - 6rem));
    aspect-ratio: auto !important;
  }
</style>
