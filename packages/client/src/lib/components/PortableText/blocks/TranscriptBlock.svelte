<script lang="ts">
  // The `transcript` block from the cms contentEditor schema: a list of
  // label/value lines, e.g. a chat log, with an optional heading/subheading
  // pair above the lines. With `collapsed` set the block starts folded to a
  // fixed height behind a more/less toggle.
  interface TranscriptLine {
    _key: string
    label?: string
    value?: string
  }

  interface TranscriptValue {
    heading?: string
    subheading?: string
    lines?: TranscriptLine[]
    collapsed?: boolean
  }

  let {value}: {value: TranscriptValue} = $props()

  let expanded = $state(false)
  const folded = $derived(Boolean(value.collapsed) && !expanded)
</script>

{#if value.lines?.length}
  <div class="transcript">
    {#if value.heading || value.subheading}
      <!-- Outside the folded area, so the heading stays visible when collapsed. -->
      <div class="head">
        {#if value.heading}<div class="heading">{value.heading}</div>{/if}
        {#if value.subheading}<div class="subheading">{value.subheading}</div>{/if}
      </div>
    {/if}
    <div class="lines" class:folded>
      <dl>
        {#each value.lines as line (line._key)}
          <dt>{line.label}</dt>
          <dd>{line.value}</dd>
        {/each}
      </dl>
      {#if folded}
        <!-- Fold: the last visible lines fade into the background. -->
        <div class="fade" aria-hidden="true"></div>
      {/if}
    </div>
    {#if value.collapsed}
      <button type="button" aria-expanded={expanded} onclick={() => (expanded = !expanded)}>
        {expanded ? 'less ↑' : 'more ↓'}
      </button>
    {/if}
  </div>
{/if}

<style>
  .transcript {
    margin: 2em 0;
  }

  .head {
    margin-bottom: 0.75em;
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    line-height: var(--line-height-base);
  }

  .heading {
    font-weight: 700;
  }

  .lines.folded {
    position: relative;
    max-height: 16em;
    overflow: hidden;
  }

  .fade {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 4em;
    background: linear-gradient(to bottom, transparent, var(--background));
    pointer-events: none;
  }

  /* Two-column grid: the label column takes the widest label, so every value
     starts at the same horizontal position. */
  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 1.5em;
    row-gap: 0.5em;
    margin: 0;
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

  /* Matches the expandable-section toggle: underlined foreground text that
     sharpens on hover. */
  button {
    display: block;
    margin-top: 0.5em;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    width: 100%;
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    line-height: var(--line-height-base);
    color: var(--foreground);
    text-decoration: underline;
    padding-top: 0.5rem;
    margin-top: 0.5rem;
    border-top: 1px dashed var(--foreground);
  }

  button:hover {
    color: var(--foreground-emphasis);
    text-decoration: none;
  }
</style>
