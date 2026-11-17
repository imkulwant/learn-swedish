import type { LocalDate } from './types.ts'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** A day with its year: "9 Nov 2026". Spelled out so it never depends on the device's locale. */
export function formatDayWithYear(date: LocalDate): string {
  const [year, month, day] = date.split('-').map(Number) as [
    number,
    number,
    number,
  ]
  return `${day} ${MONTHS[month - 1]} ${year}`
}

/** A size in bytes, as KB, MB or GB with one decimal: 1.5 MB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${Math.max(0, Math.round(bytes))} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(1)} ${units[unit]}`
}
