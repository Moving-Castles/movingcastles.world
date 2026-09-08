<script lang="ts">
  import {extractH2Headings, type ContentEditorInput} from '$lib/modules/sanity'
  import type {TocEntry} from '$lib/types'

  // Table of contents, in two layouts on the one breakpoint (see the styles):
  // a fixed sidebar beside the text column where there is room for it, and
  // below that a bar across the top of the viewport that names the current
  // section and opens a menu of all of them. Both share the entry list and
  // the scroll spy.
  let {content, toc}: {content: ContentEditorInput; toc?: TocEntry[]} = $props()

  // Headings may carry their own numbering ("3 Data generation"); the ToC
  // renders its own index column, so strip it from the displayed title.
  const tocLabel = (text: string) => text.replace(/^\d+[.):]?\s+/, '')

  // Manual entries (authored in the post's `toc` field, indexes verbatim)
  // win over the derived H2 list (auto-numbered from 01).
  const headings = $derived(
    toc?.length
      ? toc.map((entry) => ({id: entry.anchor, text: entry.label, index: entry.index ?? ''}))
      : extractH2Headings(content).map((heading, i) => ({
          id: heading.id,
          text: tocLabel(heading.text),
          index: String(i + 1).padStart(2, '0'),
        })),
  )

  let activeId = $state('')

  const active = $derived(headings.find((heading) => heading.id === activeId))

  // The bar shows once the post title has scrolled out of view — until then
  // the reader is looking at the post header, and a bar would only cover the
  // site header above it. Its menu goes with it, so scrolling back to the top
  // never strands an open menu under a bar that has left.
  let barShown = $state(false)
  let menuOpen = $state(false)

  const closeMenu = () => {
    menuOpen = false
  }

  $effect(() => {
    if (!barShown) closeMenu()
  })

  $effect(() => {
    if (!menuOpen) return
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  })

  // While a click-driven scroll is in flight the spy is paused, so sections
  // passing the reading line don't flash active — the clicked target is
  // highlighted immediately instead. Paused until the reader scrolls again
  // themselves (wheel/touch/key), not just until the animation ends: the
  // animation's own scroll events would otherwise re-trigger the spy.
  let spyPaused = false

  // Scroll spy: the active section is the last h2 above the reading line
  // (a quarter down the viewport); none is active before the first section.
  // At the very bottom of the page the last section wins, so short final
  // sections still highlight.
  const updateActive = () => {
    // The post title: the first h1 in the article this ToC belongs to.
    const title = document.querySelector('article h1')
    barShown = title ? title.getBoundingClientRect().bottom < 0 : window.scrollY > 0
    if (spyPaused) return
    const atBottom = window.scrollY + window.innerHeight >= document.body.scrollHeight - 2
    if (atBottom && headings.length > 0) {
      activeId = headings[headings.length - 1].id
      return
    }
    const line = window.innerHeight * 0.25
    let current = ''
    for (const heading of headings) {
      const el = document.getElementById(heading.id)
      if (el && el.getBoundingClientRect().top <= line) current = heading.id
    }
    activeId = current
  }

  const resumeSpy = () => {
    if (!spyPaused) return
    spyPaused = false
    updateActive()
  }

  $effect(() => {
    updateActive()
    window.addEventListener('scroll', updateActive, {passive: true})
    window.addEventListener('resize', updateActive, {passive: true})
    // Reader-initiated scrolling only — the animation emits scroll events.
    window.addEventListener('wheel', resumeSpy, {passive: true})
    window.addEventListener('touchstart', resumeSpy, {passive: true})
    window.addEventListener('keydown', resumeSpy, {passive: true})
    return () => {
      window.removeEventListener('scroll', updateActive)
      window.removeEventListener('resize', updateActive)
      window.removeEventListener('wheel', resumeSpy)
      window.removeEventListener('touchstart', resumeSpy)
      window.removeEventListener('keydown', resumeSpy)
    }
  })

  // Fast smooth scroll (300ms ease-out) — native smooth scrolling has no
  // duration control and feels sluggish over long documents.
  //
  // The heading highlight is pure CSS on :target (see app.css), so it also
  // works for in-text §-links. :target only re-evaluates on a real fragment
  // navigation — history.replaceState wouldn't trip it — so the hash is set
  // via location.replace (which, like replaceState, adds no history entry).
  // Its native jump-to-anchor is what positions the page: immediately under
  // reduced motion, otherwise after the animation, whose end position it
  // matches — both honour the heading's scroll-margin-top (app.css), which
  // is the standing air above a heading plus, in the bar layout, the bar.
  const scrollToHeading = (event: MouseEvent, id: string) => {
    event.preventDefault()
    closeMenu()
    const el = document.getElementById(id)
    if (!el) return
    const offset = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
    const targetY = window.scrollY + el.getBoundingClientRect().top - offset
    activeId = id
    spyPaused = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      location.replace(`#${id}`)
      return
    }
    const startY = window.scrollY
    const duration = 300
    let startTime: number | undefined
    const step = (now: number) => {
      if (startTime === undefined) startTime = now
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      window.scrollTo(0, startY + (targetY - startY) * eased)
      if (t < 1) requestAnimationFrame(step)
      else location.replace(`#${id}`)
    }
    requestAnimationFrame(step)
  }
</script>

{#snippet entries()}
  <ul>
    {#each headings as heading, i (`${heading.id}:${i}`)}
      <li>
        <a
          href="#{heading.id}"
          aria-current={activeId === heading.id ? 'location' : undefined}
          onclick={(event) => scrollToHeading(event, heading.id)}
          ><span class="index">{heading.index ? `${heading.index}.` : ''}</span>{heading.text}</a
        >
      </li>
    {/each}
  </ul>
{/snippet}

{#if headings.length > 0}
  <!-- Sidebar layout. -->
  <nav class="toc" aria-label="Table of contents">
    {@render entries()}
  </nav>

  <!-- Bar layout. The whole bar is the menu's toggle, so the tap target is
       the full strip rather than the control at its end. -->
  <div class="bar" class:shown={barShown}>
    <button
      type="button"
      class="bar-toggle"
      aria-expanded={menuOpen}
      aria-controls="toc-menu"
      onclick={() => (menuOpen = !menuOpen)}
    >
      <span class="current"
        >{#if active}{active.index ? `${active.index}. ` : ''}{active.text}{/if}</span
      >
      <span class="control">{menuOpen ? '[close]' : '[contents]'}</span>
    </button>
  </div>
  {#if menuOpen}
    <!-- The backdrop takes the tap that dismisses the menu; it is not a
         control in its own right, and Escape covers the keyboard. -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="backdrop" onclick={closeMenu}></div>
    <nav id="toc-menu" class="menu" aria-label="Table of contents">
      {@render entries()}
    </nav>
  {/if}
{/if}

<style>
  /* The one breakpoint: the sidebar needs room beside the centred text
     column, and below it the bar takes over. Both queries must agree, and so
     must the anchor-offset rule in app.css keyed on `.has-toc`. */
  .toc {
    display: none;
  }

  @media (min-width: 1100px) {
    .toc {
      display: block;
      position: fixed;
      left: 1rem;
      bottom: 1rem;
      width: 200px;
      max-height: calc(100vh - 8rem);
      overflow-y: auto;
      font-family: var(--font-stack-mono);
      font-size: var(--font-size-extra-small);
      line-height: var(--line-height-small);
    }

    .bar,
    .backdrop,
    .menu {
      display: none;
    }
  }

  /* Bar layout. All three pieces are fixed on their own rather than nested,
     so the bar's slide (a transform, which would make a fixed descendant
     move with it) leaves the menu and backdrop where they are. */
  .bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 51;
    height: var(--toc-bar-height);
    box-sizing: border-box;
    background: var(--background);
    border-bottom: 1px solid var(--foreground);
    color: var(--foreground);
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-extra-small);
    line-height: var(--line-height-small);
    user-select: none;
    /* Parked above the viewport until a section is current, then slid in. */
    transform: translateY(-100%);
    /* transition: transform 0.2s ease-out; */
  }

  .bar.shown {
    transform: none;
  }

  /* @media (prefers-reduced-motion: reduce) {
    .bar {
      transition: none;
    }
  } */

  /* The toggle fills the bar, its content held to the text column's width so
     it lines up with the header on viewports wider than the column. */
  .bar-toggle {
    appearance: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    max-width: var(--content-width);
    height: 100%;
    margin-inline: auto;
    padding: 0 1rem;
    box-sizing: border-box;
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .current {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--foreground-emphasis);
  }

  .control {
    flex: none;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 49;
    /* Keeps a touch on it from scrolling the page underneath. */
    touch-action: none;
  }

  .menu {
    position: fixed;
    top: var(--toc-bar-height);
    left: 0;
    right: 0;
    z-index: 50;
    max-height: calc(100dvh - var(--toc-bar-height));
    overflow-y: auto;
    box-sizing: border-box;
    background: var(--background);
    border-bottom: 1px solid var(--foreground);
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    line-height: var(--line-height-small);
  }

  .menu ul {
    max-width: var(--content-width);
    margin-inline: auto;
    padding: 0.5rem 1rem 1rem;
    box-sizing: border-box;
  }

  /* Tap-sized rows in the menu; the sidebar keeps its tight list. */
  .menu li {
    padding-block: 0.4rem;
  }

  /* Fixed on-screen navigation aids; on paper they would just overprint the
     first page. */
  @media print {
    .toc,
    .bar,
    .backdrop,
    .menu {
      display: none;
    }
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    margin-bottom: 0em;
    word-break: keep-all;
    /* Hanging indent: wrapped title lines align after the 4ch index column. */
    padding-left: 4ch;
    text-indent: -4ch;
  }

  /* The index is set flush right in a 3ch box, so a single digit sits one
     digit in and every entry's dot lands in the same column, followed by the
     1ch gap that makes up the 4ch hanging indent. */
  .index {
    display: inline-block;
    width: 3ch;
    margin-right: 1ch;
    text-align: right;
    /* text-indent inherits; without this the li's -4ch also shifts the
       digits inside this box, pushing them out of the clipped nav. */
    text-indent: 0;
  }

  a {
    color: var(--foreground);
    text-decoration: none;
  }

  a:hover,
  a[aria-current] {
    color: var(--foreground-emphasis);
  }
</style>
