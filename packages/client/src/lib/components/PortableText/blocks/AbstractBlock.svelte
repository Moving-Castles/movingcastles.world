<script lang="ts">
  import type {TypedObject} from '@portabletext/types'
  // Circular import (PortableTextRender registers this component); safe
  // because the reference is only used at render time.
  import PortableTextRender from '../PortableTextRender.svelte'

  // The `abstract` block from the cms contentEditor schema: a visually
  // distinct lead section holding plain text blocks.
  interface AbstractValue {
    content?: TypedObject[]
  }

  let {value}: {value: AbstractValue} = $props()
</script>

{#if value.content?.length}
  <section class="abstract">
    <PortableTextRender content={value.content} />
  </section>
{/if}

<style>
  section {
    margin: 2em 0;
    padding: 1.25em 0;
    /* Solid rules above and below, echoing the hr style, set the abstract
       apart from the body text without the dashed quote treatment. */
    border-top: 1px solid var(--foreground);
    border-bottom: 1px solid var(--foreground);
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
  }

  section :global(p:last-child) {
    margin-bottom: 0;
  }
</style>
