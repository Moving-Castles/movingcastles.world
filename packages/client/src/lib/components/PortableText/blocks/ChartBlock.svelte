<script lang="ts">
  import LineChart from './charts/LineChart.svelte'
  import HistogramChart from './charts/HistogramChart.svelte'
  import type {LineData, HistogramData} from './charts/types'

  // The `chart` block from the cms contentEditor schema. The `data` field is
  // a plot-ready JSON string written by the report publishing script; its
  // shape depends on `chartType` (see ./charts/types.ts).
  interface ChartValue {
    chartType?: string
    data?: string
    xLabel?: string
    yLabel?: string
    caption?: string
  }

  let {value}: {value: ChartValue} = $props()

  const parsed = $derived.by(() => {
    if (!value.data) return null
    try {
      return JSON.parse(value.data)
    } catch {
      return null
    }
  })
</script>

{#if parsed}
  <figure>
    {#if value.chartType === 'line'}
      <LineChart data={parsed as LineData} xLabel={value.xLabel} yLabel={value.yLabel} />
    {:else if value.chartType === 'histogram'}
      <HistogramChart data={parsed as HistogramData} xLabel={value.xLabel} yLabel={value.yLabel} />
    {/if}
    {#if value.caption}<figcaption>{value.caption}</figcaption>{/if}
  </figure>
{/if}

<style>
  figure {
    margin: 0;
    margin-top: 2em;
    margin-bottom: 2em;
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
