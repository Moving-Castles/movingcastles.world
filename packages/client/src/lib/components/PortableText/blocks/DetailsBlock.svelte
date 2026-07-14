<script lang="ts">
  import type {TypedObject} from '@portabletext/types'
  // Circular import (PortableTextRender registers this component); safe
  // because the reference is only used at render time.
  import PortableTextRender from '../PortableTextRender.svelte'

  // The `details` block from the cms contentEditor schema: an expandable
  // section rendered as a native <details>/<summary>, so it works without JS.
  interface DetailsValue {
    summary?: string
    content?: TypedObject[]
  }

  let {value}: {value: DetailsValue} = $props()
</script>

{#if value.content?.length}
  <details>
    <summary>{value.summary || 'Details'}</summary>
    <div class="content">
      <PortableTextRender content={value.content} />
    </div>
  </details>
{/if}

<style>
  details {
    margin: 2em 0;
  }

  summary {
    cursor: pointer;
    display: inline-block;
    user-select: none;
    /* Matches the global link style in static/app.css. */
    color: var(--foreground);
    text-decoration: underline;
    /* The native marker is replaced with a →/↓ affordance. */
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::before {
    content: '\2192';
    /* inline-block keeps the underline off the marker; the fixed width
       stops the text shifting when the arrow changes between states. */
    display: inline-block;
    width: 1.4em;
  }

  details[open] summary::before {
    content: '\2193';
  }

  summary:hover {
    color: var(--foreground-emphasis);
    text-decoration: none;
  }

  .content {
    margin-top: 0.5em;
    padding-left: 1rem;
    border-left: 1px dashed var(--foreground);
  }
</style>
