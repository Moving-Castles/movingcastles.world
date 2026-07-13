// Axis-tick and tooltip number formatting shared by the chart components.

const compact = new Intl.NumberFormat('en-US', {notation: 'compact', maximumFractionDigits: 1})
const plain = new Intl.NumberFormat('en-US')

// Floats trimmed to four significant digits, without trailing zeros.
const trimFloat = (value: number): string => Number(value.toPrecision(4)).toString()

// Ticks favour compact notation so long numbers don't crowd the axis.
export const formatTick = (value: number): string => {
  if (Math.abs(value) >= 10_000) return compact.format(value)
  if (Number.isInteger(value)) return plain.format(value)
  return trimFloat(value)
}

export const formatValue = (value: number): string => {
  if (Number.isInteger(value)) return plain.format(value)
  return trimFloat(value)
}
