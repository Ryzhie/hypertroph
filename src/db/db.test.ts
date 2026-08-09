import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, SETTINGS_ID } from './db'
import { seedIfNeeded } from './seed'
import { finishWorkout } from '../services/overload'
import { exportBackup, importBackup, parseBackup } from '../utils/exportImport'
import type { WorkoutExerciseLog } from '../types/session'

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedIfNeeded()
})

describe('database', () => {
  it('seeds the catalog, splits, and settings on first run', async () => {
    expect(await db.exercises.count()).toBeGreaterThan(30)
    expect(await db.splits.count()).toBe(4)
    const settings = await db.settings.get(SETTINGS_ID)
    expect(settings?.splitId).toBe('bro')
    expect(settings?.params.incrementKg).toBe(2.5)
  })

  it('runs the engine end-to-end when a workout is finished', async () => {
    const exercises = await db.exercises.toArray()
    const bench = exercises.find((e) => e.id === 'barbell-bench-press')!
    const splits = await db.splits.toArray()
    const bro = splits.find((s) => s.id === 'bro')!
    const day = Object.values(bro.days).find((d) => d.name === 'Chest')!
    const settings = (await db.settings.get(SETTINGS_ID))!

    const logs: WorkoutExerciseLog[] = [
      {
        exerciseId: bench.id,
        exerciseName: bench.name,
        sets: [
          { weightKg: 20, reps: 5 },
          { weightKg: 60, reps: 10, rpe: 8 }, // top set
          { weightKg: 60, reps: 8, rpe: 8 },
        ],
      },
    ]

    const { session, results } = await finishWorkout({
      split: bro,
      day,
      logs,
      exercises,
      settings,
      dateKey: '2026-07-01',
    })

    expect(session.status).toBe('completed')
    expect(results[0].instruction.mode).toBe('increase')
    const saved = await db.progress.get(bench.id)
    expect(saved?.weightKg).toBe(62.5)
    expect(saved?.e1rmHistory).toHaveLength(1)
    expect(await db.sessions.count()).toBe(1)
  })

  it('exports and imports a full backup round-trip', async () => {
    const text = await exportBackup()
    const backup = parseBackup(text)
    expect(backup.schemaVersion).toBe(3)
    expect(backup.exercises.length).toBeGreaterThan(0)

    // Wipe everything, then restore from the backup.
    await db.exercises.clear()
    await db.splits.clear()
    await db.sessions.clear()
    await db.progress.clear()
    await db.settings.clear()

    await importBackup(text)
    expect(await db.exercises.count()).toBe(backup.exercises.length)
    expect(await db.settings.get(SETTINGS_ID)).toBeDefined()
  })

  it('rejects backups from a newer schema version', () => {
    const text = JSON.stringify({
      schemaVersion: 999,
      exercises: [],
      splits: [],
      sessions: [],
      progress: [],
      settings: [],
    })
    expect(() => parseBackup(text)).toThrow(/newer app version/)
  })
})
