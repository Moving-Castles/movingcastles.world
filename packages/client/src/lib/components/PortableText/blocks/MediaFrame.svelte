<script lang="ts">
  import {tick} from 'svelte'
  import type {Snippet} from 'svelte'

  // Shared frame around media blocks. Carries the "+" expand button (when
  // `expandable`) and implements the lightbox: expanding toggles the
  // `expanded` class, styled below into a fixed, viewport-filling overlay.
  // The frame never leaves its place in the document, so media playback
  // state survives and the block components' theme/duotone rules keep
  // applying. Blocks size their media inside the overlay by bridging to the
  // class with `:global(.expanded)` selectors of their own.
  let {
    wide = false,
    player = false,
    expandable = false,
    element = $bindable(),
    children,
  }: {
    // Span the full content width (embeds) instead of shrink-wrapping.
    wide?: boolean
    // Hosts a video player: the expanded overlay stacks the control bar
    // below the video, and element-fullscreen centers a column layout.
    player?: boolean
    expandable?: boolean
    element?: HTMLElement
    children: Snippet
  } = $props()

  let expanded = $state(false)

  let expandButton: HTMLButtonElement | undefined = $state()
  let closeButton: HTMLButtonElement | undefined = $state()

  const open = async () => {
    expanded = true
    await tick()
    closeButton?.focus()
  }

  const close = async () => {
    expanded = false
    await tick()
    expandButton?.focus()
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

<div
  bind:this={element}
  class={['frame', wide && 'wide', player && 'player', expanded && 'expanded']}
  role={expanded ? 'dialog' : undefined}
  aria-modal={expanded ? true : undefined}
>
  {@render children()}
  {#if expandable}
    <!-- Hidden by CSS while expanded; kept mounted so focus can return to it
         when the overlay closes. -->
    <button
      type="button"
      class="media-expand"
      aria-label="Open large view"
      bind:this={expandButton}
      onclick={open}>+</button
    >
  {/if}
  {#if expanded}
    <button
      type="button"
      class="lightbox-close"
      aria-label="Close large view"
      bind:this={closeButton}
      onclick={close}>×</button
    >
  {/if}
</div>

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

  .media-expand,
  .lightbox-close {
    appearance: none;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    background: var(--background);
    border: 1px dashed var(--foreground);
    color: var(--foreground);
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-base);
    line-height: 1;
    cursor: pointer;
  }

  .media-expand {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
  }

  .expanded .media-expand {
    display: none;
  }

  .lightbox-close {
    position: fixed;
    top: 1rem;
    right: 1rem;
  }

  .media-expand:hover,
  .media-expand:focus-visible,
  .lightbox-close:hover,
  .lightbox-close:focus-visible {
    color: var(--foreground-emphasis);
    border-color: var(--foreground-emphasis);
  }
</style>
