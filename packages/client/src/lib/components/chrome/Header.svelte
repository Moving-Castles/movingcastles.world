<script lang="ts">
  import type {NavLink} from '$lib/types'

  let {links = []}: {links?: NavLink[]} = $props()
</script>

<header>
  <a class="brand" href="/">Moving Castles</a>

  {#if links.length > 0}
    <nav class="links">
      {#each links as link (link._key)}
        <a href={link.url} target="_blank" rel="noreferrer">[{link.label}]</a>
      {/each}
    </nav>
  {/if}
</header>

<style lang="scss">
  header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1em;
    width: 100%;
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 1em 0em;
    box-sizing: border-box;
    border-bottom: 1px solid var(--foreground-dimmed);
    color: var(--foreground-dimmed);
  }

  .brand {
    color: inherit;
    text-decoration: none;

    &:hover {
      color: var(--foreground);
    }
  }

  .links {
    display: flex;
    gap: 0.5rem;

    a {
      color: inherit;
      text-decoration: none;

      &:hover {
        color: var(--foreground);
      }
    }
  }
</style>
