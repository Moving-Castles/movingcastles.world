<script lang="ts">
  import type {TypedObject} from '@portabletext/types'
  import {page} from '$app/state'
  // Circular import (PortableTextRender registers this component); safe
  // because the reference is only used at render time.
  import PortableTextRender from '../PortableTextRender.svelte'

  // The `note` block from the cms contentEditor schema: a working note of a
  // draft. Shown by the preview build alone (`preview` from the root layout's
  // load); on the public site it renders nothing, should one ever be published.
  interface NoteValue {
    kind?: string
    content?: TypedObject[]
  }

  let {value}: {value: NoteValue} = $props()
</script>

{#if page.data.preview && value.content?.length}
  <aside class="note" data-kind={value.kind ?? 'note'}>
    <span class="label">{(value.kind ?? 'note').toUpperCase()}</span>
    <PortableTextRender content={value.content} />
  </aside>
{/if}

<style>
  aside {
    margin: 2em 0;
    padding: 0.75em 1em;
    border: 1px dashed var(--entity-color-b, #c98500);
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
  }

  aside[data-kind='warning'],
  aside[data-kind='caution'] {
    border-color: var(--entity-color-c, #d55181);
  }

  .label {
    display: block;
    margin-bottom: 0.5em;
    color: var(--entity-color-b, #c98500);
    font-size: var(--font-size-extra-small);
    letter-spacing: 0.05em;
  }

  aside[data-kind='warning'] .label,
  aside[data-kind='caution'] .label {
    color: var(--entity-color-c, #d55181);
  }

  aside :global(p:last-child) {
    margin-bottom: 0;
  }
</style>
