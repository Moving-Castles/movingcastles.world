<script lang="ts">
  import {max} from 'd3-array'
  import {scaleLinear} from 'd3-scale'
  import {formatTick, formatValue} from './format'
  import type {HistogramData} from './types'

  let {data, xLabel, yLabel}: {data: HistogramData; xLabel?: string; yLabel?: string} = $props()

  const HEIGHT = 360
  const MARGIN = {top: 24, right: 24, bottom: 44, left: 56}

  let clientWidth: number | undefined = $state()
  const width = $derived(clientWidth ? Math.max(clientWidth, 280) : 640)

  const bins = $derived((data.bins ?? []).filter((b) => b.x1 > b.x0))

  const x = $derived(
    scaleLinear(bins.length ? [bins[0].x0, bins[bins.length - 1].x1] : [0, 1], [
      MARGIN.left,
      width - MARGIN.right,
    ]),
  )
  const y = $derived(
    scaleLinear([0, max(bins, (b) => b.count) ?? 1], [HEIGHT - MARGIN.bottom, MARGIN.top]).nice(),
  )

  const xTicks = $derived(x.ticks(width < 480 ? 4 : 6))
  const yTicks = $derived(y.ticks(5))

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
    if (!bins.length) return
    if (event.key === 'Escape') {
      hovered = null
      return
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const step = event.key === 'ArrowRight' ? 1 : -1
    const index =
      hovered === null
        ? step === 1
          ? 0
          : bins.length - 1
        : Math.min(Math.max(hovered + step, 0), bins.length - 1)
    hovered = index
  }

  const tooltipLeft = $derived(hovered === null ? 0 : x((bins[hovered].x0 + bins[hovered].x1) / 2))
  const tooltipFlipped = $derived(hovered !== null && tooltipLeft > width * 0.6)
</script>

{#if bins.length}
  <div class="chart" bind:clientWidth>
    <!-- The chart is a keyboard-operable widget: arrow keys move the readout,
         Escape clears it — hence the tabindex the a11y rule objects to. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <svg
      viewBox="0 0 {width} {HEIGHT}"
      role="application"
      aria-label={['Histogram', xLabel && `of ${xLabel}`].filter(Boolean).join(' ')}
      tabindex="0"
      onpointermove={onPointerMove}
      onpointerleave={() => (hovered = null)}
      onkeydown={onKeydown}
      onblur={() => (hovered = null)}
    >
      {#each yTicks as tick (tick)}
        <line class="grid" x1={MARGIN.left} x2={width - MARGIN.right} y1={y(tick)} y2={y(tick)} />
        <text class="tick y" x={MARGIN.left - 8} y={y(tick)}>{formatTick(tick)}</text>
      {/each}

      {#each bins as bin, i (i)}
        {@const rect = barRect(bin.x0, bin.x1, bin.count)}
        {#if rect}
          <rect class="bar" class:lifted={hovered === i} {...rect} />
        {/if}
      {/each}

      <line
        class="axis"
        x1={MARGIN.left}
        x2={width - MARGIN.right}
        y1={HEIGHT - MARGIN.bottom}
        y2={HEIGHT - MARGIN.bottom}
      />
      {#each xTicks as tick (tick)}
        <text class="tick x" x={x(tick)} y={HEIGHT - MARGIN.bottom + 18}>{formatTick(tick)}</text>
      {/each}

      {#if yLabel}<text class="axis-label" x="8" y="14">{yLabel}</text>{/if}
      {#if xLabel}
        <text class="axis-label x" x={(MARGIN.left + width - MARGIN.right) / 2} y={HEIGHT - 6}>
          {xLabel}
        </text>
      {/if}
    </svg>

    {#if hovered !== null}
      {@const bin = bins[hovered]}
      <div class="tooltip" class:flipped={tooltipFlipped} style="left: {tooltipLeft}px">
        <span class="value">{formatValue(bin.count)}</span>
        <span class="label">{formatValue(bin.x0)}–{formatValue(bin.x1)}</span>
      </div>
    {/if}
  </div>
{/if}

<style>
  .chart {
    position: relative;
  }

  .chart > svg {
    display: block;
    width: 100%;
    height: auto;
    font-family: var(--font-stack-mono);
    font-size: 12px;
  }

  .chart > svg:focus-visible {
    outline: 1px dashed var(--foreground);
    outline-offset: 4px;
  }

  .grid {
    stroke: var(--foreground);
    opacity: 0.18;
  }

  .axis {
    stroke: var(--foreground);
    opacity: 0.6;
  }

  .tick,
  .axis-label {
    fill: var(--foreground);
  }

  .tick {
    font-variant-numeric: tabular-nums;
  }

  .tick.y {
    text-anchor: end;
    dominant-baseline: middle;
  }

  .tick.x,
  .axis-label.x {
    text-anchor: middle;
  }

  .bar {
    fill: var(--foreground);
  }

  .bar.lifted {
    fill: var(--foreground-emphasis);
  }

  .tooltip {
    position: absolute;
    top: 24px;
    transform: translateX(12px);
    padding: 0.4em 0.75em;
    background: var(--background);
    border: 1px dashed var(--foreground);
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    color: var(--foreground);
    white-space: nowrap;
    pointer-events: none;
    z-index: 2;
    display: flex;
    align-items: baseline;
    gap: 0.5em;
  }

  .tooltip.flipped {
    transform: translateX(calc(-100% - 12px));
  }

  .tooltip .value {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .tooltip .label {
    opacity: 0.7;
  }
</style>
