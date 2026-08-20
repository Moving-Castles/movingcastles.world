<script lang="ts">
  import {tick} from 'svelte'
  import type {Snippet} from 'svelte'

  // Shared frame around media blocks. Carries the figure's caption and, when
  // `expandable`, the "[large view]" control that sits inline at the end of
  // it; implements the lightbox, where expanding toggles the `expanded`
  // class, styled below into a fixed, viewport-filling overlay. The frame
  // never leaves its place in the document, so media playback state survives
  // and the block components' theme/duotone rules keep applying. Blocks size
  // their media inside the overlay by bridging to the class with
  // `:global(.expanded)` selectors of their own.
  //
  // Precondition: render this as a direct child of a <figure>. It emits the
  // caption as a second root element, which is only valid there — and a block
  // that passes `caption` must not also render a <figcaption> of its own.
  let {
    wide = false,
    player = false,
    expandable = false,
    clickToExpand = false,
    caption,
    element = $bindable(),
    children,
  }: {
    // Span the full content width (embeds) instead of shrink-wrapping.
    wide?: boolean
    // Hosts a video player: the expanded overlay stacks the control bar
    // below the video, and element-fullscreen centers a column layout.
    player?: boolean
    expandable?: boolean
    // Let a click anywhere on the media open the overlay. Only for media that
    // is not itself interactive — a video's controls and an embed's own ui
    // need their clicks, so those pass the link alone.
    clickToExpand?: boolean
    // Rendered as the figure's caption, and repeated inside the overlay where
    // that caption is out of view behind it. Owned here rather than by the
    // block so the expand control can sit inline with the caption text.
    caption?: string
    element?: HTMLElement
    children: Snippet
  } = $props()

  let expanded = $state(false)

  let expandButton: HTMLButtonElement | undefined = $state()

  const open = async () => {
    expanded = true
    await tick()
    element?.focus()
  }

  const close = async () => {
    expanded = false
    await tick()
    expandButton?.focus()
  }

  // One handler for both directions. It is attached unconditionally and
  // decides here rather than being swapped reactively: a handler that changed
  // with `expanded` would be re-armed mid-click, so a click that dismissed the
  // overlay could immediately reopen it.
  const onFrameClick = (event: MouseEvent) => {
    const target = event.target as Element | null
    if (expanded) {
      // The caption is the one part that does not dismiss, so it can be read
      // and selected without the overlay vanishing underfoot.
      if (target?.closest('.lightbox-caption')) return
      close()
      return
    }
    if (!clickToExpand || !expandable) return
    // A click that started on a control is not a click on the media.
    if (target?.closest('button')) return
    open()
  }

  // While expanded: close on Escape and lock page scroll. The cleanup also
  // runs on unmount, so navigating away while expanded restores scrolling.
  $effect(() => {
    if (!expanded) return
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeydown)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeydown)
      document.documentElement.style.overflow = ''
    }
  })
</script>

<!-- The click surface has no keyboard handler of its own on purpose: the
     "[large view]" button in the caption opens, Escape closes, and giving the
     frame a tab stop would only make the same actions reachable twice. -->
<!-- tabindex -1 keeps the frame out of the tab order while letting it take
     focus programmatically when the overlay opens, so focus is not stranded on
     the control now hidden behind it. Escape is handled on the document, so it
     works wherever focus ends up. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={element}
  class={[
    'frame',
    wide && 'wide',
    player && 'player',
    expanded && 'expanded',
    caption && 'has-caption',
    clickToExpand && expandable && !expanded && 'clickable',
  ]}
  role={expanded ? 'dialog' : undefined}
  aria-modal={expanded ? true : undefined}
  aria-label={expanded ? 'Large view. Press Escape or click to close.' : undefined}
  tabindex="-1"
  onclick={onFrameClick}
>
  {@render children()}
  {#if expanded && caption}
    <!-- A div, not a figcaption: this sits inside the block's <figure>, which
         already has one. -->
    <div class="lightbox-caption">{caption}</div>
  {/if}
</div>

<!-- A second root, so the caption stays a direct child of the block's <figure>
     as the spec requires, rather than being buried inside the frame. The
     expand control sits inline at the end of the caption text.

     The compiler cannot see through the component boundary to check that, so
     the warning is suppressed here: every caller renders this component as a
     direct child of a <figure>, which is the precondition noted at the top. -->
<!-- svelte-ignore a11y_figcaption_parent -->
{#if caption || expandable}
  <figcaption
    >{caption ?? ''}{#if expandable}<button
        type="button"
        class="media-expand"
        bind:this={expandButton}
        onclick={open}>[large view]</button
      >{/if}</figcaption
  >
{/if}

<style>
  /* The frame shrink-wraps its media so the expand button, and for videos the
     warning overlay and control bar, all match the media's width. */
  .frame {
    position: relative;
    width: fit-content;
    max-width: 100%;
    margin-inline: auto;
  }

  .frame.wide {
    width: 100%;
  }

  /* Lightbox: the expanded frame turns into a fixed, viewport-filling
     overlay in place (the figure and caption stay behind it in the
     article). */
  .frame.clickable {
    cursor: zoom-in;
  }

  /* Click anywhere to dismiss, so say so with the cursor. */
  .frame.expanded {
    cursor: zoom-out;
  }

  .frame.expanded {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    width: auto;
    max-width: none;
    padding: 3rem;
    box-sizing: border-box;
    background: var(--background);
    /* The room the media may take, published for the block components to size
       against — only this element knows how much of the viewport the overlay's
       own furniture has claimed. */
    --lightbox-height: calc(100vh - 10rem);
  }

  /* A caption needs a band of its own at the foot of the overlay, and the
     media has to give up that much height. */
  .frame.expanded.has-caption {
    padding-bottom: 6rem;
    --lightbox-height: calc(100vh - 12rem);
  }

  .lightbox-caption {
    /* Exempt from click-to-dismiss, so it reads as text rather than as more
       dismiss surface — and stays selectable even where the block has turned
       selection off for the artwork. */
    cursor: text;
    user-select: text;
    position: absolute;
    left: 3rem;
    right: 3rem;
    bottom: 1.5rem;
    text-align: left;
    max-width: 90ch;
    color: var(--foreground);
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-extra-small);
    line-height: var(--line-height-small);
  }

  /* Grid instead of flex so the control bar lands below the video and
     stretches to the video's width. */
  .frame.player.expanded {
    display: grid;
    align-content: center;
    justify-content: center;
  }

  /* Element fullscreen (video): the wrapper is fullscreened so the custom
     controls stay in view below the centered video. */
  .frame.player:fullscreen {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1rem;
    box-sizing: border-box;
    background: var(--background);
  }

  /* Sits inline at the end of the caption, so it takes the caption's own type
     rather than restating it. */
  .media-expand {
    appearance: none;
    margin-left: 0.5em;
    padding: 0;
    background: none;
    border: none;
    color: var(--foreground);
    font: inherit;
    text-decoration: none;
    cursor: pointer;
  }

  .media-expand:hover,
  .media-expand:focus-visible {
    color: var(--foreground-emphasis);
  }
</style>
