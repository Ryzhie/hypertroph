import type { WeekStart } from '../types/settings'

const pad = (n: number) => String(n).padStart(2, '0')

/** Local date → 'YYYY-MM-DD'. */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

/** 'YYYY-MM-DD' → local Date at midnight. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Whole days from `fromKey` to `toKey` (to - from). Negative if from is later. */
export function daysBetween(fromKey: string, toKey: string): number {
  const ms = parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()
  return Math.round(ms / 86_400_000)
}

/** 0 = Sunday … 6 = Saturday (Date.getDay convention). */
export function weekdayIndex(dateKey: string): number {
  return parseDateKey(dateKey).getDay()
}

const DAY_FORMAT = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

export function formatDateKey(dateKey: string): string {
  return DAY_FORMAT.format(parseDateKey(dateKey))
}

/** dateKey + `days` days. */
export function addDaysToKey(dateKey: string, days: number): string {
  const d = parseDateKey(dateKey)
  d.setDate(d.getDate() + days)
  return toDateKey(d)
}

/** The dateKey of the first day of the week containing `dateKey`. */
export function startOfWeekKey(dateKey: string, weekStart: WeekStart): string {
  const offset = weekStart === 'monday' ? 1 : 0 // Monday=1 offset vs Sunday=0
  const wi = weekdayIndex(dateKey)
  const diff = (wi - offset + 7) % 7
  return addDaysToKey(dateKey, -diff)
}
