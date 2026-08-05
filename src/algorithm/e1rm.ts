import type { E1rmPoint } from '../types/progress'

/** Epley formula: estimated one-rep max from a weight × reps performance. */
export function epley1rm(weightKg: number, reps: number): number {
  if (reps < 1) return weightKg
  return weightKg * (1 + reps / 30)
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

/** Average of the most recent `window` E1RM points (noisy signal smoothing). */
export function smoothedE1rm(history: E1rmPoint[], window: number): number | null {
  if (history.length < Math.max(2, window)) return null
  return avg(history.slice(-window).map((p) => p.e1rm))
}

/** Best E1RM within the most recent `window` sessions — never all-time. */
export function windowedBest(history: E1rmPoint[], window: number): number {
  if (history.length === 0) return 0
  const slice = history.slice(-window)
  return Math.max(...slice.map((p) => p.e1rm))
}

export const E1RM_HISTORY_CAP = 200
