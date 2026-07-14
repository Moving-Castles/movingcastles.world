<script lang="ts">
  import {bisectCenter, extent} from 'd3-array'
  import {scaleLinear} from 'd3-scale'
  import {line as lineShape} from 'd3-shape'
  import {formatValue} from './format'
  import type {LineData} from './types'

  let {data, xLabel, yLabel}: {data: LineData; xLabel?: string; yLabel?: string} = $props()

  const HEIGHT = 360
  // The slim right margin only keeps the last x tick label from clipping;
  // the plot fills the full column width. The left margin is computed from
  // the y tick labels below.
  const MARGIN = {top: 24, right: 16, bottom: 44}

  // Left-margin anatomy: a fixed gutter for the rotated axis label, then the
  // widest y tick label (monospace ticks, so width is chars × advance), then
  // the gap between tick labels and the plot edge.
  const LABEL_GUTTER = 24
  const TICK_CHAR_WIDTH = 7.2 // Berkeley Mono advance at the 12px tick size
  const TICK_GAP = 8

  // Nice the y domain to the same count the ticks use, so the top gridline
  // always sits at (not below) the domain ceiling and lines never overshoot
  // the last labelled tick.
  const Y_TICK_COUNT = 5

  // Series identity: the entity colors (app.css --entity-color-a…e), assigned
  // in fixed order, or pinned per series via `color`. A single unassigned
  // series stays monochrome foreground (the CSS fallback).
  const ENTITY_LETTERS = 'abcde'

  // The rendered width tracks the container so axis text keeps a constant
  // on-screen size; the server renders the 640 default and hydration adjusts.
  let clientWidth: number | undefined = $state()
  const width = $derived(clientWidth ? Math.max(clientWidth, 280) : 640)

  const series = $derived((data.series ?? []).filter((s) => s.points?.length))
  const strokes = $derived(
    series.map((s, i) => {
      const letter =
        s.color ?? (series.length > 1 ? ENTITY_LETTERS[i % ENTITY_LETTERS.length] : undefined)
      return letter ? `var(--entity-color-${letter})` : undefined
    }),
  )
  const allPoints = $derived(series.flatMap((s) => s.points))
  const bands = $derived((data.bands ?? []).filter((b) => b.y1 > b.y0))
  const labeledBands = $derived(bands.filter((b) => b.label))

  const domainOf = (values: number[]): [number, number] => {
    const [min, max] = extent(values)
    if (min === undefined || max === undefined) return [0, 1]
    return min === max ? [min - 1, max + 1] : [min, max]
  }

  // The y domain covers the data and any reference bands; `yMin` pins the
  // floor (typically 0).
  const y = $derived.by(() => {
    const [autoMin, autoMax] = domainOf([
      ...allPoints.map((p) => p[1]),
      ...bands.flatMap((b) => [b.y0, b.y1]),
    ])
    const min = data.options?.yMin !== undefined ? Math.min(data.options.yMin, autoMin) : autoMin
    return scaleLinear([min, autoMax], [HEIGHT - MARGIN.bottom, MARGIN.top]).nice(Y_TICK_COUNT)
  })

  // Scale-derived tick formatters keep a uniform number of decimals across
  // the whole axis (0.15, 0.20 — never a mix of 0.15 and 0.2).
  const yTicks = $derived(y.ticks(Y_TICK_COUNT))
  const formatYTick = $derived(y.tickFormat(Y_TICK_COUNT))

  const marginLeft = $derived(
    LABEL_GUTTER +
      Math.max(1, ...yTicks.map((tick) => formatYTick(tick).length)) * TICK_CHAR_WIDTH +
      TICK_GAP,
  )

  const x = $derived(
    scaleLinear(domainOf(allPoints.map((p) => p[0])), [marginLeft, width - MARGIN.right]),
  )
  const xTickCount = $derived(width < 480 ? 4 : 6)
  const xTicks = $derived(x.ticks(xTickCount))
  const formatXTick = $derived(x.tickFormat(xTickCount))

  const path = $derived(
    lineShape<[number, number]>(
      (p) => x(p[0]),
      (p) => y(p[1]),
    ),
  )

  // The crosshair snaps to the union of the series' x positions.
  const hoverXs = $derived([...new Set(allPoints.map((p) => p[0]))].sort((a, b) => a - b))

  let hoverX: number | null = $state(null)

  // One readout for every series at the hovered x (nearest point per series).
  const readout = $derived.by(() => {
    if (hoverX === null) return null
    return series.map((s, i) => ({
      label: s.label,
      stroke: strokes[i],
      point:
        s.points[
          bisectCenter(
            s.points.map((p) => p[0]),
            hoverX!,
          )
        ],
    }))
  })

  const onPointerMove = (event: PointerEvent) => {
    if (!hoverXs.length) return
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect()
    const value = x.invert(event.clientX - rect.left)
    hoverX = hoverXs[bisectCenter(hoverXs, value)]
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (!hoverXs.length) return
    if (event.key === 'Escape') {
      hoverX = null
      return
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const step = event.key === 'ArrowRight' ? 1 : -1
    const index =
      hoverX === null
        ? step === 1
          ? 0
          : hoverXs.length - 1
        : Math.min(Math.max(hoverXs.indexOf(hoverX) + step, 0), hoverXs.length - 1)
    hoverX = hoverXs[index]
  }

  const tooltipLeft = $derived(hoverX === null ? 0 : x(hoverX))
  const tooltipFlipped = $derived(hoverX !== null && tooltipLeft > width * 0.6)
</script>

{#if series.length}
  <div class="chart" bind:clientWidth>
    {#if series.length > 1 || labeledBands.length}
      <div class="legend">
        {#each series as s, i (i)}
          <span class="key">
            <svg width="20" height="4" aria-hidden="true">
              <line x1="0" y1="2" x2="20" y2="2" style:stroke={strokes[i]} />
            </svg>
            {s.label ?? `Series ${i + 1}`}
          </span>
        {/each}
        {#each labeledBands as band, i (i)}
          <span class="key">
            <svg width="14" height="10" aria-hidden="true">
              <rect class="band" width="14" height="10" />
            </svg>
            {band.label}
          </span>
        {/each}
      </div>
    {/if}

    <!-- The chart is a keyboard-operable widget: arrow keys move the readout,
         Escape clears it — hence the tabindex the a11y rule objects to. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <svg
      viewBox="0 0 {width} {HEIGHT}"
      role="application"
      aria-label={['Line chart', yLabel && `of ${yLabel}`, xLabel && `by ${xLabel}`]
        .filter(Boolean)
        .join(' ')}
      tabindex="0"
      onpointermove={onPointerMove}
      onpointerleave={() => (hoverX = null)}
      onkeydown={onKeydown}
      onblur={() => (hoverX = null)}
    >
      {#each yTicks as tick (tick)}
        <line class="grid" x1={marginLeft} x2={width - MARGIN.right} y1={y(tick)} y2={y(tick)} />
        <text class="tick y" x={marginLeft - TICK_GAP} y={y(tick)}>{formatYTick(tick)}</text>
      {/each}

      <!-- Reference bands sit behind the series lines. -->
      {#each bands as band, i (i)}
        <rect
          class="band"
          x={marginLeft}
          width={width - MARGIN.right - marginLeft}
          y={y(band.y1)}
          height={Math.max(y(band.y0) - y(band.y1), 0)}
        />
      {/each}

      <line
        class="axis"
        x1={marginLeft}
        x2={width - MARGIN.right}
        y1={HEIGHT - MARGIN.bottom}
        y2={HEIGHT - MARGIN.bottom}
      />
      {#each xTicks as tick (tick)}
        <text class="tick x" x={x(tick)} y={HEIGHT - MARGIN.bottom + 18}>{formatXTick(tick)}</text>
      {/each}

      <!-- Rotated to read bottom-to-top along the axis, centered on the plot. -->
      {#if yLabel}
        <text
          class="axis-label y"
          transform="rotate(-90)"
          x={-(MARGIN.top + HEIGHT - MARGIN.bottom) / 2}
          y="14"
        >
          {yLabel}
        </text>
      {/if}
      {#if xLabel}
        <text class="axis-label x" x={(marginLeft + width - MARGIN.right) / 2} y={HEIGHT - 6}>
          {xLabel}
        </text>
      {/if}

      {#each series as s, i (i)}
        <path class="series" d={path(s.points)} style:stroke={strokes[i]} />
      {/each}

      {#if readout && hoverX !== null}
        <line
          class="crosshair"
          x1={x(hoverX)}
          x2={x(hoverX)}
          y1={MARGIN.top}
          y2={HEIGHT - MARGIN.bottom}
        />
        {#each readout as row, i (i)}
          {#if row.point}
            <circle
              class="marker"
              style:fill={row.stroke}
              cx={x(row.point[0])}
              cy={y(row.point[1])}
              r="4"
            />
          {/if}
        {/each}
      {/if}
    </svg>

    {#if readout && hoverX !== null}
      <div class="tooltip" class:flipped={tooltipFlipped} style="left: {tooltipLeft}px">
        <div class="tooltip-x">{xLabel ? `${xLabel} ` : ''}{formatValue(hoverX)}</div>
        {#each readout as row, i (i)}
          {#if row.point}
            <div class="tooltip-row">
              {#if series.length > 1}
                <svg width="14" height="4" aria-hidden="true">
                  <line x1="0" y1="2" x2="14" y2="2" style:stroke={row.stroke} />
                </svg>
              {/if}
              <span class="value">{formatValue(row.point[1])}</span>
              {#if row.label}<span class="label">{row.label}</span>{/if}
            </div>
          {/if}
        {/each}
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
  .axis-label.x,
  .axis-label.y {
    text-anchor: middle;
  }

  .series {
    fill: none;
    stroke: var(--foreground);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Reference bands: a wash, never a saturated block. */
  .band {
    fill: var(--foreground);
    opacity: 0.15;
  }

  .crosshair {
    stroke: var(--foreground);
    opacity: 0.5;
  }

  /* Markers carry a surface ring so they stay legible on top of the line. */
  .marker {
    fill: var(--foreground);
    stroke: var(--background);
    stroke-width: 2;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em 1.5em;
    margin-bottom: 0.75em;
    font-family: var(--font-stack-mono);
    font-size: var(--font-size-small);
    color: var(--foreground);
  }

  .legend .key {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
  }

  .legend line,
  .tooltip line {
    stroke: var(--foreground);
    stroke-width: 2;
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
  }

  .tooltip.flipped {
    transform: translateX(calc(-100% - 12px));
  }

  .tooltip-x {
    opacity: 0.7;
  }

  .tooltip-row {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  .tooltip-row .value {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .tooltip-row .label {
    opacity: 0.7;
  }
</style>
