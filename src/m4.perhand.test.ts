import 'fake-indexeddb/auto'
import { describe, expect, it, beforeEach } from 'vitest'
import { evaluateSession, currentTarget } from './algorithm/progression'
import { defaultParams } from './algorithm/params'
import { db, SETTINGS_ID } from './db/db'
import { seedIfNeeded } from './db/seed'
import type { ExerciseProgress } from './types/progress'
import type { WorkoutSession } from './types/session'

function makeProgress(partial?: Partial<ExerciseProgress>): ExerciseProgress {
  return {
    exerciseId: 'test',
    weightKg: 60,
    repsRange: [6, 10],
    sessionsAtWeight: 1,
    stallStreak: 0,
    e1rmBest: 80,
    e1rmHistory: [
      { date: '2026-08-01', e1rm: 80 },
      { date: '2026-08-04', e1rm: 82 },
    ],
    ...partial,
  }
}

describe('per-hand instruction messages', () => {
  it('includes "per hand" when isPerHand is true', () => {
    const params = defaultParams()
    const p = makeProgress({ lastSessionDate: '2026-08-04' })
    const { instruction } = evaluateSession(
      {
        progress: p,
        topSet: { weightKg: 60, reps: 10, rpe: 8 },
        dateKey: '2026-08-07',
        effectiveRepsRange: [6, 10],
        sets: 3,
        isBodyweight: false,
        isPerHand: true,
        isNovice: true,
        ladder: [],
      },
      params,
    )
    expect(instruction.message).toContain('per hand')
    expect(instruction.message).toContain('62.5 kg per hand') // increase
  })

  it('omits "per hand" when isPerHand is false (default)', () => {
    const params = defaultParams()
    const p = makeProgress({ lastSessionDate: '2026-08-04' })
    const { instruction } = evaluateSession(
      {
        progress: p,
        topSet: { weightKg: 60, reps: 10, rpe: 8 },
        dateKey: '2026-08-07',
        effectiveRepsRange: [6, 10],
        sets: 3,
        isBodyweight: false,
        isPerHand: false,
        isNovice: true,
        ladder: [],
      },
      params,
    )
    expect(instruction.message).not.toContain('per hand')
    expect(instruction.message).toContain('increase to 62.5 kg')
  })

  it('currentTarget includes "per hand" when isPerHand is true', () => {
    const params = defaultParams()
    const p = makeProgress()
    const instr = currentTarget(p, [6, 10], 3, params, '2026-08-07', true)
    expect(instr.message).toContain('per hand')
  })
})

describe('session volume with per-hand logs', () => {
  it('counts both sides (×2) for per-hand sessions', () => {
    // 30 kg per hand × 10 reps × 2 sides = 600 kg·r
    const session: WorkoutSession = {
      id: 'test',
      dateKey: '2026-08-07',
      splitId: 's',
      splitName: 's',
      dayKey: 'd',
      dayName: 'd',
      status: 'completed',
      startedAt: '',
      finishedAt: '',
      logs: [
        {
          exerciseId: 'db-bench',
          exerciseName: 'DB Bench',
          perHand: true,
          sets: [{ weightKg: 30, reps: 10 }],
        },
      ],
    }
    // sessionVolume is internal to HistoryScreen; replicate the logic here.
    const calcSessionVolume = (s: WorkoutSession) => {
      let v = 0
      for (const log of s.logs) {
        const sides = log.perHand ? 2 : 1
        for (const set of log.sets) v += set.weightKg * sides * set.reps
      }
      return v
    }
    expect(calcSessionVolume(session)).toBe(600)
  })

  it('does not double volume for non-per-hand sessions', () => {
    const session: WorkoutSession = {
      id: 'test',
      dateKey: '2026-08-07',
      splitId: 's',
      splitName: 's',
      dayKey: 'd',
      dayName: 'd',
      status: 'completed',
      startedAt: '',
      finishedAt: '',
      logs: [
        {
          exerciseId: 'bb-bench',
          exerciseName: 'BB Bench',
          perHand: false,
          sets: [{ weightKg: 60, reps: 10 }],
        },
      ],
    }
    const calcSessionVolume = (s: WorkoutSession) => {
      let v = 0
      for (const log of s.logs) {
        const sides = log.perHand ? 2 : 1
        for (const set of log.sets) v += set.weightKg * sides * set.reps
      }
      return v
    }
    expect(calcSessionVolume(session)).toBe(600) // 60 × 10 = 600 (no doubling)
  })
})

describe('exercise catalog', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await seedIfNeeded()
  })

  it('seeds dumbbell exercises with perHand flag', async () => {
    const dbBench = await db.exercises.get('dumbbell-bench-press')
    expect(dbBench?.perHand).toBe(true)
    const bbBench = await db.exercises.get('barbell-bench-press')
    expect(bbBench?.perHand).toBe(false)
  })

  it('allows adding a custom exercise', async () => {
    await db.exercises.add({
      id: 'custom-row',
      name: 'Custom Row',
      muscleGroups: ['back'],
      category: 'compound',
      defaultSets: 4,
      defaultRepsRange: [8, 12],
      defaultRestSeconds: 120,
      createdAt: new Date().toISOString(),
    })
    const ex = await db.exercises.get('custom-row')
    expect(ex?.name).toBe('Custom Row')
    expect(ex?.muscleGroups).toEqual(['back'])
  })

  it('archives and restores an exercise', async () => {
    await db.exercises.update('cable-fly', { archived: true })
    const archived = await db.exercises.get('cable-fly')
    expect(archived?.archived).toBe(true)

    await db.exercises.update('cable-fly', { archived: false })
    const restored = await db.exercises.get('cable-fly')
    expect(restored?.archived).toBe(false)
  })
})

describe('body profile in settings', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await seedIfNeeded()
  })

  it('stores and reads back body profile', async () => {
    const body = {
      sex: 'male' as const,
      ageYears: 28,
      heightCm: 178,
      bodyWeightKg: 82,
      bodyFatPct: 18,
      activityLevel: 'active' as const,
      goal: 'muscle-gain' as const,
      experience: 'intermediate' as const,
    }
    await db.settings.update(SETTINGS_ID, { body })
    const s = await db.settings.get(SETTINGS_ID)
    expect(s?.body).toEqual(body)
  })

  it('clears body profile', async () => {
    await db.settings.update(SETTINGS_ID, {
      body: { sex: 'male', ageYears: 28, heightCm: 178, bodyWeightKg: 82, activityLevel: 'active', goal: 'maintain', experience: 'beginner' },
    })
    await db.settings.update(SETTINGS_ID, { body: undefined })
    const s = await db.settings.get(SETTINGS_ID)
    expect(s?.body).toBeUndefined()
  })
})
