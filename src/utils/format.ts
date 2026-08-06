import type { WeightUnit } from '../types/settings'

const KG_TO_LB = 2.20462

/** Convert canonical kg to the display unit. */
export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  return unit === 'lb' ? kg * KG_TO_LB : kg
}

/** Convert a user-entered display value back to canonical kg. */
export function fromDisplayWeight(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value / KG_TO_LB : value
}

/** Nicely formatted weight string in the display unit, e.g. "62.5 kg" / "137.5 lb". */
export function formatWeight(kg: number, unit: WeightUnit): string {
  const raw = toDisplayWeight(kg, unit)
  const rounded = unit === 'lb' ? Math.round(raw * 2) / 2 : Math.round(raw * 2) / 2
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return `${str} ${unit}`
}

/** Just the number, for compact labels like "62.5". */
export function formatWeightNumber(kg: number, unit: WeightUnit): string {
  const rounded = Math.round(toDisplayWeight(kg, unit) * 2) / 2
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/** " per hand" for dumbbell/single-arm lifts, otherwise "". */
export function perHandSuffix(perHand?: boolean): string {
  return perHand ? ' per hand' : ''
}

export function formatRepRange(range: [number, number]): string {
  return `${range[0]}–${range[1]}`
}

/** 90 → "1:30", 45 → "45s". */
export function formatRestSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m}m` : `${m}:${String(s).padStart(2, '0')}`
}
