<script lang="ts">
  import type {TypedObject} from '@portabletext/types'
  // Circular import (PortableTextRender registers this component); safe
  // because the reference is only used at render time.
  import PortableTextRender from '../PortableTextRender.svelte'

  // The `code` block from the cms contentEditor schema: a verbatim mono
  // passage (e.g. a full system prompt). Shares the abstract block's mono
  // treatment, minus its rules, and is kept as its own component so the
  // two can diverge.
  interface CodeValue {
    content?: TypedObject[]
  }

  let {value}: {value: CodeValue} = $props()
</script>

{#if value.content?.length}
  <section class="code">
    <PortableTextRender content={value.content} />
  </section>
{/if}

<style>
  section {
    margin: 2em 0;
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
  }

  section :global(p:last-child) {
    margin-bottom: 0;
  }
</style>
