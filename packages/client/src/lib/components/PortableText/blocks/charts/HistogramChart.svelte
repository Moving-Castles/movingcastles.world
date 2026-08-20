<script lang="ts">
  import {max} from 'd3-array'
  import {scaleLinear} from 'd3-scale'
  import ChartFrame from './ChartFrame.svelte'
  import {formatValue} from './format'
  import {
    HEIGHT,
    MARGIN,
    Y_TICK_COUNT,
    marginLeftFor,
    plotWidth,
    readoutKey,
    xTickCountFor,
  } from './plot'
  import type {HistogramData} from './types'

  let {data, xLabel, yLabel}: {data: HistogramData; xLabel?: string; yLabel?: string} = $props()

  let clientWidth: number | undefined = $state()
  const width = $derived(plotWidth(clientWidth))

  const bins = $derived((data.bins ?? []).filter((b) => b.x1 > b.x0))

  const y = $derived(
    scaleLinear([0, max(bins, (b) => b.count) ?? 1], [HEIGHT - MARGIN.bottom, MARGIN.top]).nice(
      Y_TICK_COUNT,
    ),
  )

  // Scale-derived tick formatters keep a uniform number of decimals across
  // the whole axis (0.15, 0.20 — never a mix of 0.15 and 0.2).
  const yTicks = $derived(y.ticks(Y_TICK_COUNT))
  const formatYTick = $derived(y.tickFormat(Y_TICK_COUNT))
  const marginLeft = $derived(marginLeftFor(yTicks.map(formatYTick)))

  const x = $derived(
    scaleLinear(bins.length ? [bins[0].x0, bins[bins.length - 1].x1] : [0, 1], [
      marginLeft,
      width - MARGIN.right,
    ]),
  )
  const xTickCount = $derived(xTickCountFor(width))
  const xTicks = $derived(x.ticks(xTickCount))
  const formatXTick = $derived(x.tickFormat(xTickCount))

  // Bars grow from the baseline, sharp-cornered, with a 2px surface gap
  // between neighbours (1px inset on each side).
  const barRect = (x0: number, x1: number, count: number) => {
    const left = x(x0) + 1
    const w = x(x1) - 1 - left
    const top = y(count)
    const h = y(0) - top
    if (w <= 0 || count <= 0) return null
    return {x: left, y: top, width: w, height: h}
  }

  let hovered: number | null = $state(null)

  // The whole plot is the hit area: the pointer picks the bin under its x.
  const onPointerMove = (event: PointerEvent) => {
    if (!bins.length) return
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect()
    const value = x.invert(event.clientX - rect.left)
    const index = bins.findIndex((b, i) => value >= b.x0 && (value < b.x1 || i === bins.length - 1))
    hovered = index === -1 ? null : index
  }

  const onKeydown = (event: KeyboardEvent) => {
    const next = readoutKey(event, bins.length, hovered)
    if (next !== undefined) hovered = next
  }

  const tooltipLeft = $derived(hovered === null ? 0 : x((bins[hovered].x0 + bins[hovered].x1) / 2))
  const tooltipFlipped = $derived(hovered !== null && tooltipLeft > width * 0.6)
</script>

{#if bins.length}
  <ChartFrame
    bind:clientWidth
    {width}
    {marginLeft}
    {x}
    {y}
    {xTicks}
    {yTicks}
    {formatXTick}
    {formatYTick}
    {xLabel}
    {yLabel}
    ariaLabel={['Histogram', xLabel && `of ${xLabel}`].filter(Boolean).join(' ')}
    tooltip={hovered === null ? null : {left: tooltipLeft, flipped: tooltipFlipped}}
    onpointermove={onPointerMove}
    onpointerleave={() => (hovered = null)}
    onkeydown={onKeydown}
    onblur={() => (hovered = null)}
  >
    {#snippet underlay()}
      {#each bins as bin, i (i)}
        {@const rect = barRect(bin.x0, bin.x1, bin.count)}
        {#if rect}
          <rect class="bar" class:lifted={hovered === i} {...rect} />
        {/if}
      {/each}
    {/snippet}

    {#snippet tooltipContent()}
      {#if hovered !== null}
        {@const bin = bins[hovered]}
        <span class="tooltip-row">
          <span class="value">{formatValue(bin.count)}</span>
          <span class="label">{formatValue(bin.x0)}–{formatValue(bin.x1)}</span>
        </span>
      {/if}
    {/snippet}
  </ChartFrame>
{/if}

<style>
  .bar {
    fill: var(--foreground);
  }

  .bar.lifted {
    fill: var(--foreground-emphasis);
  }

  .tooltip-row {
    display: flex;
    align-items: baseline;
    gap: 0.5em;
  }
</style>
