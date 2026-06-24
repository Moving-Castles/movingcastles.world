<script lang="ts">
  import type {NavLink} from '$lib/types'
  import ThemeToggle from './ThemeToggle.svelte'

  let {links = []}: {links?: NavLink[]} = $props()
</script>

<footer>
  <a class="brand" href="/">[MC]</a>

  <div class="actions">
    {#if links.length > 0}
      <nav class="links">
        {#each links as link (link._key)}
          <a href={link.url} target="_blank" rel="noreferrer">[{link.label}]</a>
        {/each}
      </nav>
    {/if}
    <ThemeToggle />
  </div>
</footer>

<style lang="scss">
  footer {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    width: 100%;
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 1rem 1rem;
    padding-bottom: 2rem;
    box-sizing: border-box;
    color: var(--foreground);
    user-select: none;
  }

  // Inset the divider by the 1em gutter so it lines up with the article's
  // text column instead of spanning the full content-width box.
  footer::after {
    content: '';
    position: absolute;
    inset-inline: 1rem;
    top: 0;
    border-top: 1px solid var(--foreground);
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
