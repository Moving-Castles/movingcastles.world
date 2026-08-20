<script lang="ts">
  // The `diagram` block from the cms contentEditor schema: a vector figure
  // whose markup is inlined into the page rather than served through <img>.
  // That is the whole point of the block — inside the document the figure can
  // resolve var(--foreground) and var(--font-stack-mono), so it draws in the
  // site's ink and type and follows the day/night toggle. An <img> is its own
  // document and would see neither.
  //
  // The markup arrives already namespaced by the publishing script (ids
  // prefixed, style rules scoped to the figure's root id — see
  // packages/scripts/inline-svg.mjs), so injecting it here cannot collide with
  // another figure or restyle the charts.
  interface DiagramValue {
    markup?: string
    width?: number
    height?: number
    caption?: string
    smallMargin?: boolean
  }

  let {value}: {value: DiagramValue} = $props()
</script>

{#if value.markup}
  <figure class:small-vertical-margin={value.smallMargin}>
    <div class="frame">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html value.markup}
    </div>
    {#if value.caption}<figcaption>{value.caption}</figcaption>{/if}
  </figure>
{/if}

<style>
  figure {
    margin: 0;
    margin-top: 2em;
    margin-bottom: 2em;
    user-select: none;
  }

  figure.small-vertical-margin {
    margin-top: 1em;
    margin-bottom: 0.5em;
  }

  /* A diagram always fits the reading column: it scales to the available
     width and takes whatever height its own aspect ratio gives. Nothing
     overflows, so the frame needs no scrolling of its own.

     :global because the svg is injected as html and so carries no scoping
     class of its own. The intrinsic width/height on the markup keep the box's
     aspect ratio reserved before and after paint. */
  .frame :global(svg) {
    display: block;
    width: 100%;
    height: auto;
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
