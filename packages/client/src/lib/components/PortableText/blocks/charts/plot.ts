// Plot geometry shared by the chart components. Both charts draw into the
// same box — same height, same margins, same tick cadence — so the numbers,
// and the derivations that hang off them, live here instead of in each chart.
// The markup that consumes them is in ChartFrame.svelte.

export const HEIGHT = 360

// The slim right margin only keeps the last x tick label from clipping; the
// plot fills the full column width. The left margin is per-chart, computed
// from its own y tick labels — see marginLeftFor.
export const MARGIN = {top: 24, right: 16, bottom: 44}

// Left-margin anatomy: a fixed gutter for the rotated axis label, then the
// widest y tick label (monospace ticks, so width is chars × advance), then
// the gap between tick labels and the plot edge.
const LABEL_GUTTER = 24
const TICK_CHAR_WIDTH = 7.2 // Berkeley Mono advance at the 12px tick size
export const TICK_GAP = 8

// Nice the y domain to the same count the ticks use, so the top gridline
// always sits at (not below) the domain ceiling and nothing plotted overshoots
// the last labelled tick.
export const Y_TICK_COUNT = 5

// The rendered width tracks the container so axis text keeps a constant
// on-screen size; the server renders the 640 default and hydration adjusts.
export const plotWidth = (clientWidth: number | undefined): number =>
  clientWidth ? Math.max(clientWidth, 280) : 640

export const marginLeftFor = (yTickLabels: string[]): number =>
  LABEL_GUTTER +
  Math.max(1, ...yTickLabels.map((label) => label.length)) * TICK_CHAR_WIDTH +
  TICK_GAP

export const xTickCountFor = (width: number): number => (width < 480 ? 4 : 6)

// Arrow keys walk the readout along the plot, Escape clears it. Returns the
// index to move to, `null` to clear the readout, or `undefined` when the key
// isn't ours — no data to walk, or any other key.
export const readoutKey = (
  event: KeyboardEvent,
  count: number,
  current: number | null,
): number | null | undefined => {
  if (!count) return undefined
  if (event.key === 'Escape') return null
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return undefined
  event.preventDefault()
  const step = event.key === 'ArrowRight' ? 1 : -1
  if (current === null) return step === 1 ? 0 : count - 1
  return Math.min(Math.max(current + step, 0), count - 1)
}
