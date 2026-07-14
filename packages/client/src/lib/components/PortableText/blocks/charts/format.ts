// Tooltip number formatting shared by the chart components. (Axis ticks use
// the d3 scales' own tickFormat, which keeps decimals uniform per axis.)

const plain = new Intl.NumberFormat('en-US')

// Floats trimmed to four significant digits, without trailing zeros.
const trimFloat = (value: number): string => Number(value.toPrecision(4)).toString()

export const formatValue = (value: number): string => {
  if (Number.isInteger(value)) return plain.format(value)
  return trimFloat(value)
}
