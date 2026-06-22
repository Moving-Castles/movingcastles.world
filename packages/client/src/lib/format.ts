// Formats a Sanity `date` value (ISO `YYYY-MM-DD`) as `YYYY.MM.DD`, e.g. "2026.12.01".
// Reads the date parts straight from the string rather than via `new Date()` so the
// displayed day can't shift by a timezone offset.
export const formatDate = (date?: string): string => {
  if (!date) return ''
  const [year, month, day] = date.slice(0, 10).split('-')
  if (!year || !month || !day) return ''
  return `${year}.${month}.${day}`
}
