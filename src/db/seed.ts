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
  if (count > 0) return

  const now = new Date().toISOString()
  await db.transaction('rw', [db.exercises, db.splits, db.settings], async () => {
    await db.exercises.bulkPut(EXERCISE_SEED.map((e) => ({ ...e, createdAt: now })))
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
