<script lang="ts">
  // The `transcript` block from the cms contentEditor schema: a list of
  // label/value lines, e.g. a chat log.
  interface TranscriptLine {
    _key: string
    label?: string
    value?: string
  }

  interface TranscriptValue {
    lines?: TranscriptLine[]
  }

  let {value}: {value: TranscriptValue} = $props()
</script>

{#if value.lines?.length}
  <dl>
    {#each value.lines as line (line._key)}
      <dt>{line.label}</dt>
      <dd>{line.value}</dd>
    {/each}
  </dl>
{/if}

<style>
  /* Two-column grid: the label column takes the widest label, so every value
     starts at the same horizontal position. */
  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 1.5em;
    row-gap: 0.5em;
    margin: 2em 0;
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    line-height: var(--line-height-base);
  }

  dt {
    font-weight: 700;
  }

  dd {
    margin: 0;
    /* Keep authored line breaks within a value. */
    white-space: pre-wrap;
  }
</style>
