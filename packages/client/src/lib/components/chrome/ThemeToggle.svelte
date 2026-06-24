<script lang="ts">
  import {theme} from '$lib/theme.svelte'

  // After hydration, adopt whatever the inline head script resolved (the server
  // always renders the default "night" label). Runs client-only.
  $effect(() => {
    theme.sync()
  })
</script>

<button
  type="button"
  class="theme-toggle"
  aria-label="Toggle day or night theme"
  onclick={() => theme.toggle()}
>
  [{theme.current === 'night' ? '△' : '▼'}]
</button>

<style lang="scss">
  // Reset native button chrome so it reads as one of the bracketed nav tokens.
  .theme-toggle {
    appearance: none;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
    cursor: pointer;
    user-select: none;

    &:hover {
      color: var(--foreground-emphasis);
    }
  }
</style>
