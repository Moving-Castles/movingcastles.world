<script lang="ts">
  // Related resources for a post (a model card, a repository), rendered as a
  // row under the abstract. Bracketed labels follow the header/footer nav.
  import type {ExternalLink} from '$lib/types'

  let {links}: {links: ExternalLink[]} = $props()
</script>

{#if links.length}
  <section class="external-links">
    {#each links as link (link._key)}
      <a href={link.url} target="_blank" rel="noreferrer">[{link.label}]</a>
    {/each}
  </section>
{/if}

<style>
  section {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em 1.5em;
    /* Sits in the rule stack the abstract opens: its own dashed border closes
       the lead section off from the body text. */
    padding-bottom: 2em;
    margin-bottom: 2em;
    border-bottom: 1px dashed var(--foreground);
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    line-height: var(--line-height-base);
    color: var(--foreground);
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  a:hover {
    color: var(--foreground-emphasis);
  }
</style>
