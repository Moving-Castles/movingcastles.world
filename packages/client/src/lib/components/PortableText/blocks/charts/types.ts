// Plot-ready payloads stored (as JSON strings) on the `chart` block by the
// report publishing script. See packages/scripts/publish-report.mjs.

export interface LineSeries {
  label?: string
  // Entity color letter ('a'–'e', the site's --entity-color-* vars). Unset
  // series take entity colors in order when the chart has several lines.
  color?: string
  points: [number, number][]
}

// A horizontal reference band (e.g. a noise floor or confidence interval),
// drawn as a low-opacity wash across the plot width.
export interface LineBand {
  y0: number
  y1: number
  label?: string
}

export interface LineData {
  series: LineSeries[]
  bands?: LineBand[]
  options?: {
    // Pins the bottom of the y domain (e.g. 0 for a zero-based axis).
    yMin?: number
  }
}

export interface HistogramBin {
  x0: number
  x1: number
  count: number
}

export interface HistogramData {
  bins: HistogramBin[]
}
