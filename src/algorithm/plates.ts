import type { Exercise } from '../types/exercise'

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * A discrete ladder of achievable weights. Increases round UP to the next rung,
 * deloads round DOWN — this is what keeps targets on real plate increments.
 */
export function buildLadder(baseKg: number, stepKg: number, maxKg = 400): number[] {
  const ladder: number[] = []
  for (let w = baseKg; w <= maxKg; w += stepKg) {
    ladder.push(round2(w))
  }
  return ladder
}

/** The achievable weights for an exercise: explicit list if given, else derived. */
export function ladderFor(exercise: Exercise, stepKg: number): number[] {
  if (exercise.isBodyweight) return []
  if (exercise.weightLadder && exercise.weightLadder.length > 0) {
    return [...exercise.weightLadder].sort((a, b) => a - b)
  }
  // Barbells start at the bar weight; dumbbells/machines effectively at 0.
  const base = exercise.equipment?.toLowerCase().includes('barbell') ? 20 : 0
  return buildLadder(base, stepKg)
}

/** Smallest rung >= w. Falls back to the top rung (or w) if w is beyond the ladder. */
export function nextLadderUp(ladder: number[], w: number): number {
  if (ladder.length === 0) return w
  for (const rung of ladder) {
    if (rung >= w) return rung
  }
  return ladder[ladder.length - 1]
}

/** Largest rung <= w. Falls back to the bottom rung (or w). */
export function nextLadderDown(ladder: number[], w: number): number {
  if (ladder.length === 0) return w
  let prev = ladder[0]
  for (const rung of ladder) {
    if (rung > w) break
    prev = rung
  }
  return prev
}

/** Increase target = current + increment, rounded up to a real plate weight. */
export function roundIncrease(ladder: number[], currentKg: number, incrementKg: number): number {
  return nextLadderUp(ladder, currentKg + incrementKg)
}

/** Deload target = current × (1 − pct), rounded down to a real plate weight. */
export function roundDeload(ladder: number[], currentKg: number, pct: number): number {
  return nextLadderDown(ladder, currentKg * (1 - pct))
}
