<script lang="ts">
  import type {NavLink} from '$lib/types'
  import {resolveNavLink} from '$lib/nav'
  import ThemeToggle from './ThemeToggle.svelte'

  let {links = []}: {links?: NavLink[]} = $props()
</script>

<header>
  <a class="brand" href="/">[MC]</a>

  <div class="actions">
    {#if links.length > 0}
      <nav class="links">
        {#each links as link (link._key)}
          {@const {href, external} = resolveNavLink(link)}
          <a
            {href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}>[{link.label}]</a>
        {/each}
      </nav>
    {/if}
    <ThemeToggle />
  </div>
</header>

<style lang="scss">
  header {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    width: 100%;
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 1rem 1rem;
    box-sizing: border-box;
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    color: var(--foreground);
    user-select: none;
  }

  // Inset the divider by the 1em gutter so it lines up with the article's
  // text column instead of spanning the full content-width box.
  header::after {
    content: '';
    position: absolute;
    inset-inline: 1rem;
    bottom: 0;
    border-bottom: 1px solid var(--foreground);
  }

  .brand {
    color: inherit;
    text-decoration: none;

    &:hover {
      color: var(--foreground-emphasis);
    }
  }

  .actions {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .links {
    display: flex;
    gap: 0.5rem;

    a {
      color: inherit;
      text-decoration: none;

      &:hover {
        color: var(--foreground-emphasis);
      }
    }
  }
</style>
