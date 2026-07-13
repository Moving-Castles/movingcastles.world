<script lang="ts">
  import MediaFrame from './MediaFrame.svelte'

  // The `image` block from the cms contentEditor schema, with asset
  // references dereferenced via GROQ `asset->` (see contentEditorProjection).
  interface ImageValue {
    asset?: {url?: string}
    dayImage?: {asset?: {url?: string}}
    caption?: string
    smallMargin?: boolean
    duotone?: boolean
    largeView?: boolean
  }

  let {value}: {value: ImageValue} = $props()

  const nightUrl = $derived(value.asset?.url)
  const dayUrl = $derived(value.dayImage?.asset?.url)
  const alt = $derived(value.caption || '')
</script>

<!-- With a day variant, emit both images and let CSS swap them on
     [data-theme]; the day image is lazy-loaded since it's hidden at night.
     Without one, a single image that shows in both themes. -->
{#snippet images()}
  {#if dayUrl}
    <img class="img-night" src={nightUrl} {alt} />
    <img class="img-day" src={dayUrl} {alt} loading="lazy" />
  {:else}
    <img src={nightUrl} {alt} />
  {/if}
{/snippet}

{#if nightUrl}
  <figure class:small-vertical-margin={value.smallMargin} class:duotone={value.duotone}>
    {#if value.largeView}
      <MediaFrame expandable>
        {@render images()}
      </MediaFrame>
    {:else}
      {@render images()}
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

  img {
    display: block;
    max-width: 100%;
    height: auto;
    margin-inline: auto;
    max-height: 800px;
  }

  @media (max-width: 600px) {
    img {
      max-height: 600px;
    }
  }

  /* Duotone: a luminance grayscale remapped onto the two theme greys via an
     SVG filter (defined in DuotoneFilters.svelte). Highlights take the light
     tone, shadows the dark tone, so full-colour images sit inside the
     monochrome palette. Theme-specific because night and day swap which grey
     is light. */
  figure.duotone img {
    filter: url(#duotone-night);
  }

  :global(:root[data-theme='day']) figure.duotone img {
    filter: url(#duotone-day);
  }

  /* Night/day image pairs. Night is shown by default and as the no-theme
     fallback; the day variant is swapped in when the toggle sets
     data-theme="day". Single images have neither class and are unaffected. */
  img.img-day {
    display: none;
  }

  :global(:root[data-theme='day']) img.img-night {
    display: none;
  }

  :global(:root[data-theme='day']) img.img-day {
    display: block;
  }

  /* Lightbox: viewport cap while the MediaFrame around the image is
     expanded. */
  :global(.expanded) img {
    max-height: calc(100vh - 6rem);
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
