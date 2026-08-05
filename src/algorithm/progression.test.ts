import { describe, expect, it } from 'vitest'
import { evaluateSession, type EvaluateInput } from './progression'
import { epley1rm, smoothedE1rm, windowedBest } from './e1rm'
import {
  buildLadder,
  nextLadderUp,
  nextLadderDown,
  roundIncrease,
  roundDeload,
} from './plates'
import { defaultParams } from './params'
import { computeTopSet, createEmptyProgress } from '../services/overload'
import type { ExerciseProgress } from '../types/progress'

const LADDER = buildLadder(20, 2.5)

function run(
  progress: ExerciseProgress,
  topSet: { weightKg: number; reps: number; rpe?: number },
  dateKey: string,
  overrides: Partial<EvaluateInput> = {},
  params = defaultParams(),
) {
  return evaluateSession(
    {
      progress,
      topSet,
      dateKey,
      effectiveRepsRange: progress.repsRange,
      sets: 3,
      isBodyweight: false,
      isNovice: false,
      ladder: LADDER,
      ...overrides,
    },
    { ...params, isNovice: overrides.isNovice ?? params.isNovice },
  )
}

function bench(over: Partial<ExerciseProgress> = {}): ExerciseProgress {
  return {
    exerciseId: 'barbell-bench-press',
    weightKg: 60,
    repsRange: [6, 10],
    sessionsAtWeight: 0,
    stallStreak: 0,
    e1rmBest: 0,
    e1rmHistory: [],
    ...over,
  }
}

describe('plates (weight ladder)', () => {
  it('builds a barbell ladder in smallest-plate steps from the bar', () => {
    expect(LADDER.slice(0, 6)).toEqual([20, 22.5, 25, 27.5, 30, 32.5])
  })
  it('rounds increases UP to a real plate weight', () => {
    expect(roundIncrease(LADDER, 60, 2.5)).toBe(62.5)
    expect(roundIncrease(LADDER, 60, 5)).toBe(65)
  })
  it('rounds deloads DOWN to a real plate weight', () => {
    // 60 × 0.9 = 54 → 52.5
    expect(roundDeload(LADDER, 60, 0.1)).toBe(52.5)
  })
  it('clamps at the edges of the ladder', () => {
    expect(nextLadderUp(LADDER, 500)).toBe(LADDER[LADDER.length - 1])
    expect(nextLadderDown(LADDER, 5)).toBe(LADDER[0])
  })
})

describe('e1rm', () => {
  it('computes Epley', () => {
    expect(epley1rm(60, 10)).toBeCloseTo(80)
    expect(epley1rm(60, 1)).toBeCloseTo(62)
  })
  it('smoothes the recent window and bounds the best', () => {
    const history = [
      { date: 'd1', e1rm: 100 },
      { date: 'd2', e1rm: 100 },
      { date: 'd3', e1rm: 90 },
      { date: 'd4', e1rm: 88 },
    ]
    expect(smoothedE1rm(history, 3)).toBeCloseTo((90 + 88 + 100) / 3)
    expect(windowedBest(history, 8)).toBe(100)
    expect(smoothedE1rm([{ date: 'd', e1rm: 100 }], 3)).toBeNull()
  })
})

describe('progression', () => {
  it('increases when the top set reaches the top of the range at good RPE', () => {
    const r = run(bench(), { weightKg: 60, reps: 10, rpe: 8 }, '2026-07-01')
    expect(r.instruction.mode).toBe('increase')
    expect(r.progress.weightKg).toBe(62.5)
    expect(r.progress.stallStreak).toBe(0)
    expect(r.progress.e1rmHistory).toHaveLength(1)
  })

  it('applies the newbie boost (double increment) when a novice finds it easy', () => {
    const r = run(bench(), { weightKg: 60, reps: 10, rpe: 7 }, '2026-07-01', {
      isNovice: true,
    })
    expect(r.instruction.mode).toBe('increase')
    expect(r.progress.weightKg).toBe(65)
  })

  it('blocks the increase on a grinder (RPE at/above the gate)', () => {
    const r = run(bench(), { weightKg: 60, reps: 10, rpe: 9 }, '2026-07-01')
    expect(r.instruction.mode).toBe('hold-high-rpe')
    expect(r.progress.weightKg).toBe(60)
    expect(r.progress.stallStreak).toBe(0)
  })

  it('holds and counts success when reps are inside the range', () => {
    const r = run(bench(), { weightKg: 60, reps: 8, rpe: 8 }, '2026-07-01')
    expect(r.instruction.mode).toBe('hold')
    expect(r.progress.weightKg).toBe(60)
    expect(r.progress.sessionsAtWeight).toBe(1)
  })

  it('counts a stall when reps fall below the floor', () => {
    const r = run(bench(), { weightKg: 60, reps: 5, rpe: 9 }, '2026-07-01')
    expect(r.instruction.mode).toBe('hold')
    expect(r.progress.stallStreak).toBe(1)
    expect(r.progress.weightKg).toBe(60)
  })

  it('deloads after N consecutive stalls', () => {
    const s1 = run(bench(), { weightKg: 60, reps: 5, rpe: 9 }, '2026-07-01')
    expect(s1.progress.stallStreak).toBe(1)
    const s2 = run(s1.progress, { weightKg: 60, reps: 5, rpe: 9 }, '2026-07-08')
    expect(s2.progress.stallStreak).toBe(2)
    const s3 = run(s2.progress, { weightKg: 60, reps: 5, rpe: 9 }, '2026-07-15')
    expect(s3.instruction.mode).toBe('deload')
    expect(s3.progress.weightKg).toBe(52.5) // 60 × 0.9 rounded down
    expect(s3.progress.stallStreak).toBe(0)
    expect(s3.progress.deloadedAt).toBe('2026-07-15')
  })

  it('treats a layoff as re-acclimation, not a stall', () => {
    const p = bench({ lastSessionDate: '2026-06-01', stallStreak: 1 })
    const r = run(p, { weightKg: 60, reps: 5 }, '2026-07-01')
    expect(r.instruction.mode).toBe('re-acclimate')
    expect(r.progress.stallStreak).toBe(0)
    expect(r.progress.weightKg).toBe(60)
  })

  it('adopts a changed rep range without punishing the first session', () => {
    const r = run(
      bench({ repsRange: [6, 10] }),
      { weightKg: 60, reps: 5 },
      '2026-07-01',
      { effectiveRepsRange: [8, 12] },
    )
    expect(r.progress.repsRange).toEqual([8, 12])
    expect(r.progress.stallStreak).toBe(0) // no stall from the goalposts moving
    expect(r.instruction.mode).toBe('hold')
  })

  it('moves the rep range up for bodyweight exercises instead of adding weight', () => {
    const p = bench({ weightKg: 0, repsRange: [10, 20], isNovice: false })
    const r = run(p, { weightKg: 0, reps: 21 }, '2026-07-01', { isBodyweight: true })
    expect(r.instruction.mode).toBe('range-bump')
    expect(r.progress.repsRange).toEqual([14, 24])
  })

  it('suggests a deload when recent E1RM drops below the windowed best', () => {
    const history = [100, 100, 100, 92, 90, 88].map((e1rm, i) => ({
      date: `d${i}`,
      e1rm,
    }))
    const p = bench({ e1rmHistory: history, e1rmBest: 100, lastSessionDate: '2026-06-28' })
    const r = run(p, { weightKg: 70, reps: 8 }, '2026-07-01') // e1rm ≈ 88.7
    expect(r.progress.suggestDeload).toBe(true)
  })

  it('requires multiple top-range hits when hitsToProgress > 1', () => {
    const params = { ...defaultParams(), hitsToProgress: 2 }
    const s1 = run(bench(), { weightKg: 60, reps: 10, rpe: 8 }, '2026-07-01', {}, params)
    expect(s1.instruction.mode).toBe('hold') // confirm once more
    expect(s1.progress.sessionsAtWeight).toBe(1)
    const s2 = run(s1.progress, { weightKg: 60, reps: 10, rpe: 8 }, '2026-07-08', {}, params)
    expect(s2.instruction.mode).toBe('increase')
    expect(s2.progress.weightKg).toBe(62.5)
  })

  it('progresses linearly across a simulated month (headless)', () => {
    let p = bench()
    let w = 60
    const dates = ['2026-07-01', '2026-07-08', '2026-07-15', '2026-07-22', '2026-07-29']
    for (const d of dates) {
      const r = run(p, { weightKg: w, reps: 10, rpe: 8 }, d)
      expect(r.instruction.mode).toBe('increase')
      w = r.progress.weightKg
      p = r.progress
    }
    expect(w).toBe(72.5) // 60 + 5 × 2.5
    expect(p.e1rmHistory).toHaveLength(5)
    expect(p.e1rmBest).toBeGreaterThan(0)
  })
})

describe('service helpers (pure)', () => {
  it('picks the first set at max weight as the top set (warmups excluded)', () => {
    const top = computeTopSet([
      { weightKg: 20, reps: 5 }, // warmup
      { weightKg: 40, reps: 5 }, // warmup
      { weightKg: 60, reps: 8, rpe: 8 }, // top set
      { weightKg: 60, reps: 7, rpe: 9 },
      { weightKg: 60, reps: 6 },
    ])
    expect(top).toEqual({ weightKg: 60, reps: 8, rpe: 8 })
  })

  it('returns null for an empty log', () => {
    expect(computeTopSet([])).toBeNull()
  })

  it('creates fresh progress from a starting weight', () => {
    const p = createEmptyProgress('deadlift', 100, [5, 8], true)
    expect(p.weightKg).toBe(100)
    expect(p.repsRange).toEqual([5, 8])
    expect(p.stallStreak).toBe(0)
  })
})
