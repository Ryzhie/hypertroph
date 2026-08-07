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
    // v3 migration: backfill section + tags on exercises that predate these flags.
    // All old exercises are 'weights'; tags are copied from the seed data.
    const tagMap = new Map(EXERCISE_SEED.filter((e) => e.tags && e.tags.length > 0).map((e) => [e.id, e.tags!]))
    // Backfill section='weights' on exercises that predate the section field.
    await db.exercises
      .filter((e) => e.section === undefined)
      .modify({ section: 'weights' as const })
    // Backfill tags from seed data for exercises that have tags in the seed.
    const needsTags = await db.exercises
      .filter((e) => e.tags === undefined && tagMap.has(e.id))
      .toArray()
    if (needsTags.length > 0) {
      await db.exercises.bulkPut(
        needsTags.map((e) => ({ ...e, tags: tagMap.get(e.id) })),
      )
    }
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
