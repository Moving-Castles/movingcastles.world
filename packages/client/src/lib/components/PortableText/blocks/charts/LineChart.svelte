<script lang="ts">
  import {bisectCenter, extent} from 'd3-array'
  import {scaleLinear} from 'd3-scale'
  import {line as lineShape} from 'd3-shape'
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
  import type {LineData} from './types'

  let {data, xLabel, yLabel}: {data: LineData; xLabel?: string; yLabel?: string} = $props()

  // Series identity: the entity colors (app.css --entity-color-a…e), assigned
  // in fixed order, or pinned per series via `color`. A single unassigned
  // series stays monochrome foreground (the CSS fallback).
  const ENTITY_LETTERS = 'abcde'

  // The band hatch is declared once in the plot svg but also filled into the
  // legend swatch, which is a separate svg — so the id has to be unique per
  // chart instance, and stable across ssr and hydration.
  const uid = $props.id()
  const hatchId = `band-hatch-${uid}`
  const hatchFill = `url(#${hatchId})`

  let clientWidth: number | undefined = $state()
  const width = $derived(plotWidth(clientWidth))

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
  const marginLeft = $derived(marginLeftFor(yTicks.map(formatYTick)))

  const x = $derived(
    scaleLinear(domainOf(allPoints.map((p) => p[0])), [marginLeft, width - MARGIN.right]),
  )
  const xTickCount = $derived(xTickCountFor(width))
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
    const next = readoutKey(event, hoverXs.length, hoverX === null ? null : hoverXs.indexOf(hoverX))
    if (next === undefined) return
    hoverX = next === null ? null : hoverXs[next]
  }

  const tooltipLeft = $derived(hoverX === null ? 0 : x(hoverX))
  const tooltipFlipped = $derived(hoverX !== null && tooltipLeft > width * 0.6)
</script>

{#if series.length}
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
    ariaLabel={['Line chart', yLabel && `of ${yLabel}`, xLabel && `by ${xLabel}`]
      .filter(Boolean)
      .join(' ')}
    tooltip={readout && hoverX !== null ? {left: tooltipLeft, flipped: tooltipFlipped} : null}
    onpointermove={onPointerMove}
    onpointerleave={() => (hoverX = null)}
    onkeydown={onKeydown}
    onblur={() => (hoverX = null)}
  >
    {#snippet legend()}
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
                <rect class="band" width="14" height="10" fill={hatchFill} />
              </svg>
              {band.label}
            </span>
          {/each}
        </div>
      {/if}
    {/snippet}

    {#snippet defs()}
      <defs>
        <!-- Diagonal hatch for the reference bands: a texture reads as an
             annotated region rather than as a plotted quantity, which a solid
             wash of the foreground color does not. The tile holds one vertical
             stroke centered in its 6px width (centered so it isn't clipped at
             the tile edge) and the whole tile is rotated 45°. -->
        <pattern
          id={hatchId}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line class="hatch" x1="3" y1="0" x2="3" y2="6" />
        </pattern>
      </defs>
    {/snippet}

    <!-- Reference bands sit behind the series lines. -->
    {#snippet underlay()}
      {#each bands as band, i (i)}
        <rect
          class="band"
          fill={hatchFill}
          x={marginLeft}
          width={width - MARGIN.right - marginLeft}
          y={y(band.y1)}
          height={Math.max(y(band.y0) - y(band.y1), 0)}
        />
      {/each}
    {/snippet}

    {#snippet overlay()}
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
    {/snippet}

    {#snippet tooltipContent()}
      {#if readout && hoverX !== null}
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
      {/if}
    {/snippet}
  </ChartFrame>
{/if}

<style>
  .series {
    fill: none;
    stroke: var(--foreground);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Reference bands: a diagonal hatch, never a saturated block. The fill is
     set as an attribute (the pattern id is instance-scoped), so no `fill`
     here — it would win over the attribute and flatten the hatch. */
  .hatch {
    stroke: var(--foreground);
    stroke-width: 1;
    opacity: 0.55;
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

  .legend line {
    stroke: var(--foreground);
    stroke-width: 2;
  }

  .tooltip-x {
    opacity: 0.7;
  }

  .tooltip-row {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }
</style>
