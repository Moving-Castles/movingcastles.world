<script lang="ts">
  import type {Snippet} from 'svelte'
  import type {ScaleLinear} from 'd3-scale'
  import {HEIGHT, MARGIN, TICK_GAP} from './plot'

  // The plot chrome both charts share: the measured, keyboard-operable svg
  // with its gridlines, axis, ticks and axis labels, plus the tooltip box.
  // What is actually plotted — lines, bars, bands, markers — arrives as
  // snippets, so it stays styled by the chart that renders it.
  //
  // The width round-trip is deliberate: the frame measures itself, the chart
  // builds its scales against that measurement, and hands the geometry back.
  let {
    clientWidth = $bindable(),
    width,
    marginLeft,
    x,
    y,
    xTicks,
    yTicks,
    formatXTick,
    formatYTick,
    xLabel,
    yLabel,
    ariaLabel,
    tooltip = null,
    onpointermove,
    onpointerleave,
    onkeydown,
    onblur,
    legend,
    defs,
    underlay,
    overlay,
    tooltipContent,
  }: {
    clientWidth?: number
    width: number
    marginLeft: number
    x: ScaleLinear<number, number>
    y: ScaleLinear<number, number>
    xTicks: number[]
    yTicks: number[]
    formatXTick: (tick: number) => string
    formatYTick: (tick: number) => string
    xLabel?: string
    yLabel?: string
    ariaLabel: string
    // Position of the readout box, in plot pixels; null while there is none.
    tooltip?: {left: number; flipped: boolean} | null
    onpointermove?: (event: PointerEvent) => void
    onpointerleave?: () => void
    onkeydown?: (event: KeyboardEvent) => void
    onblur?: () => void
    legend?: Snippet
    defs?: Snippet
    // Drawn behind the axis (reference bands, bars) and in front of it
    // (series lines, crosshair, markers) respectively.
    underlay?: Snippet
    overlay?: Snippet
    tooltipContent?: Snippet
  } = $props()
</script>

<div class="chart" bind:clientWidth>
  {@render legend?.()}

  <!-- The chart is a keyboard-operable widget: arrow keys move the readout,
       Escape clears it — hence the tabindex the a11y rule objects to. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <svg
    viewBox="0 0 {width} {HEIGHT}"
    role="application"
    aria-label={ariaLabel}
    tabindex="0"
    {onpointermove}
    {onpointerleave}
    {onkeydown}
    {onblur}
  >
    {@render defs?.()}

    {#each yTicks as tick (tick)}
      <line class="grid" x1={marginLeft} x2={width - MARGIN.right} y1={y(tick)} y2={y(tick)} />
      <text class="tick y" x={marginLeft - TICK_GAP} y={y(tick)}>{formatYTick(tick)}</text>
    {/each}

    {@render underlay?.()}

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

    {@render overlay?.()}
  </svg>

  {#if tooltip}
    <div class="tooltip" class:flipped={tooltip.flipped} style="left: {tooltip.left}px">
      {@render tooltipContent?.()}
    </div>
  {/if}
</div>

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
    /* Touch: a finger tracing the plot drives the readout; only vertical
       page scrolling passes through. Restricting touch-action here also
       disables double-tap/pinch zoom over the plot, which otherwise fires
       erratically while tracing. */
    touch-action: pan-y;
  }

  /* The svg is focusable for the keyboard readout, but a focus ring boxing
     the whole plot reads as a glitch — suppress it. */
  .chart > svg:focus {
    outline: none;
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

  /* Past the far side of the plot the box would run off the column edge, so
     it flips to sit left of the readout instead. */
  .tooltip.flipped {
    transform: translateX(calc(-100% - 12px));
  }

  /* The readout's contents come from the caller's snippet and so carry its
     scoping class, not this component's — hence :global. Confined to the
     tooltip box, which this component does render. */
  .tooltip :global(.value) {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .tooltip :global(.label) {
    opacity: 0.7;
  }

  /* Series swatch in a multi-series readout; monochrome unless the row pins
     an entity color on it. */
  .tooltip :global(line) {
    stroke: var(--foreground);
    stroke-width: 2;
  }
</style>
