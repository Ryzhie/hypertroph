import { db, SETTINGS_ID } from './db'
import { EXERCISE_SEED } from '../data/exercises'
import { SPLIT_SEED } from '../data/splits'
import { defaultParams } from '../algorithm/params'

/**
 * First-run setup: exercise catalog + preset splits + default settings.
 * Idempotent — skips if the catalog is already populated.
 */
export async function seedIfNeeded(): Promise<void> {
  const count = await db.exercises.count()
  if (count > 0) {
    // v3 migration: backfill section on exercises that predate the flag.
    // All old exercises are 'weights' (calisthenics/cardio/sport are v3 additions).
    await db.exercises
      .filter((e) => e.section === undefined)
      .modify({ section: 'weights' as const })
    return
  }

  const now = new Date().toISOString()
  await db.transaction('rw', [db.exercises, db.splits, db.settings], async () => {
    await db.exercises.bulkPut(
      EXERCISE_SEED.map((e) => ({
        ...e,
        // Dumbbells are per-hand by default; explicit perHand can override.
        perHand: e.perHand ?? (e.equipment?.toLowerCase().includes('dumbbell') ?? false),
        createdAt: now,
      })),
    )
    await db.splits.bulkPut(SPLIT_SEED)
    await db.settings.put({
      id: SETTINGS_ID,
      splitId: 'bro',
      weekStart: 'monday',
      weightUnit: 'kg',
      params: defaultParams(),
    })
  })
}
