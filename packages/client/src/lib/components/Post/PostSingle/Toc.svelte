<script lang="ts">
  import {extractH2Headings, type ContentEditorInput} from '$lib/modules/sanity'
  import type {TocEntry} from '$lib/types'

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

  // Flash the jumped-to heading so the eye lands on the right section. The
  // class drives a color-fade animation defined globally in app.css (the
  // heading lives in {@html} output, outside this component's scope).
  const flashHeading = (el: HTMLElement) => {
    el.classList.remove('toc-flash')
    void el.offsetWidth // restart the animation when re-clicked
    el.classList.add('toc-flash')
    el.addEventListener('animationend', () => el.classList.remove('toc-flash'), {once: true})
  }

  // Fast smooth scroll (300ms ease-out) — native smooth scrolling has no
  // duration control and feels sluggish over long documents.
  const scrollToHeading = (event: MouseEvent, id: string) => {
    event.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    const targetY = window.scrollY + el.getBoundingClientRect().top - 24
    history.replaceState(null, '', `#${id}`)
    activeId = id
    spyPaused = true
    flashHeading(el)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, targetY)
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
    }
    requestAnimationFrame(step)
  }
</script>

{#if headings.length > 0}
  <nav class="toc" aria-label="Table of contents">
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
  </nav>
{/if}

<style>
  /* Only shown when there is room beside the centred text column. */
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
      font-size: 12px;
      line-height: var(--line-height-base);
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

  .index {
    display: inline-block;
    width: 4ch;
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
