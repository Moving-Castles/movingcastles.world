// Plot-ready payloads stored (as JSON strings) on the `chart` block by the
// report publishing script. See packages/scripts/publish-report.mjs.

export interface LineSeries {
  label?: string
  points: [number, number][]
}

export interface LineData {
  series: LineSeries[]
}

export interface HistogramBin {
  x0: number
  x1: number
  count: number
}

export interface HistogramData {
  bins: HistogramBin[]
}
