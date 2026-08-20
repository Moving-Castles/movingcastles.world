<script lang="ts">
  import MediaFrame from './MediaFrame.svelte'

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
    largeView?: boolean
  }

  let {value}: {value: DiagramValue} = $props()

  // The intrinsic ratio as a bare number, so the expanded figure can work out
  // how wide it may be before the viewport's height runs out. Without it the
  // two caps would apply independently and the drawing would sit letterboxed
  // in an over-tall box.
  const aspect = $derived(
    value.width && value.height ? String(value.width / value.height) : undefined,
  )
</script>

{#snippet artwork()}
  <div class="frame" style:--diagram-aspect={aspect}>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html value.markup}
  </div>
{/snippet}

{#if value.markup}
  <figure class:small-vertical-margin={value.smallMargin}>
    {#if value.largeView}
      <!-- `wide` because a diagram spans the column rather than shrink-wrapping. -->
      <MediaFrame wide expandable clickToExpand caption={value.caption}>
        {@render artwork()}
      </MediaFrame>
    {:else}
      {@render artwork()}
    {/if}
    <!-- MediaFrame renders the caption when it wraps the media, so the
         control can sit inline with the caption text. -->
    {#if !value.largeView && value.caption}<figcaption>{value.caption}</figcaption>{/if}
  </figure>
{/if}

<style>
  /* Diagrams are traced with a finger on touch devices, so the markup must
     not be selectable; the rhythm and caption come from app.css. */
  figure {
    user-select: none;
  }

  .frame {
    margin-bottom: 2em;
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

  /* Lightbox: inside the expanded MediaFrame the figure is no longer bound by
     the reading column, so it takes whichever of the two viewport axes runs
     out first — growing past its intrinsic size when there is room, which is
     the point of a large view for vector art.

     Expressed as a width rather than a pair of max-* caps on purpose: with
     the width definite the svg's own ratio drives `height: auto` above, so
     the drawing never ends up letterboxed inside an over-tall box. The
     fallback aspect is deliberately large, so a figure with no intrinsic size
     recorded degrades to plain full-width. */
  :global(.expanded) .frame {
    display: flex;
    justify-content: center;
    /* Must claim the overlay's full width: as a flex item it would otherwise
       shrink to its content, and the `100%` below would then resolve against
       the svg's own intrinsic width instead of the room available. */
    width: 100%;
    /* the reading rhythm below the figure has no meaning in the overlay, and
       would push the artwork off centre */
    margin-bottom: 0;
  }

  :global(.expanded) .frame :global(svg) {
    width: min(100%, calc(var(--lightbox-height, 100vh) * var(--diagram-aspect, 100)));
  }
</style>
