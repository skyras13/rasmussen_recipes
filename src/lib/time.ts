const UNITS: Array<[number, Intl.RelativeTimeFormatUnit]> = [
  [60, 'second'],
  [60, 'minute'],
  [24, 'hour'],
  [7, 'day'],
  [4.345, 'week'],
  [12, 'month'],
  [Number.POSITIVE_INFINITY, 'year'],
]

/** "just now", "5 minutes ago", "3 weeks ago" — relative to `now`. */
export function timeAgo(date: Date, now: Date = new Date()): string {
  let value = (date.getTime() - now.getTime()) / 1000
  if (value > -45 && value < 45) return 'just now'

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'always' })
  for (const [factor, unit] of UNITS) {
    if (Math.abs(value) < factor) {
      return formatter.format(Math.round(value), unit)
    }
    value /= factor
  }
  return formatter.format(Math.round(value), 'year')
}
