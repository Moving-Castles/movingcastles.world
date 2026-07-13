<script lang="ts">
  // The `table` block from the cms contentEditor schema: an optional header
  // row and rows of plain-text cells.
  interface TableRow {
    _key: string
    cells?: string[]
  }

  interface TableValue {
    header?: string[]
    rows?: TableRow[]
    caption?: string
  }

  let {value}: {value: TableValue} = $props()
</script>

{#if value.rows?.length}
  <figure>
    <!-- Wide tables scroll inside the figure instead of breaking the column. -->
    <div class="scroll">
      <table>
        {#if value.header?.length}
          <thead>
            <tr>
              {#each value.header as cell, i (i)}
                <th>{cell}</th>
              {/each}
            </tr>
          </thead>
        {/if}
        <tbody>
          {#each value.rows as row (row._key)}
            <tr>
              {#each row.cells ?? [] as cell, i (i)}
                <td>{cell}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if value.caption}<figcaption>{value.caption}</figcaption>{/if}
  </figure>
{/if}

<style>
  figure {
    margin: 0;
    margin-top: 2em;
    margin-bottom: 2em;
  }

  .scroll {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    line-height: var(--line-height-base);
  }

  th,
  td {
    padding: 0.35em 1.5em 0.35em 0;
    text-align: left;
    vertical-align: top;
  }

  th:last-child,
  td:last-child {
    padding-right: 0;
  }

  th {
    font-weight: 700;
    border-bottom: 1px solid var(--foreground);
  }

  td {
    border-bottom: 1px dashed var(--foreground);
  }

  figcaption {
    margin-top: 0.5rem;
    margin-bottom: 1rem;
    color: var(--foreground);
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    line-height: var(--line-height-base);
  }
</style>
