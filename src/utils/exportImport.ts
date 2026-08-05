import { db, SCHEMA_VERSION, type StoredSettings } from '../db/db'
import type { Exercise } from '../types/exercise'
import type { Split } from '../types/split'
import type { WorkoutSession } from '../types/session'
import type { ExerciseProgress } from '../types/progress'

/** Versioned backup covering ALL user data + algorithm config. */
export interface BackupFile {
  schemaVersion: number
  exportedAt: string
  exercises: Exercise[]
  splits: Split[]
  sessions: WorkoutSession[]
  progress: ExerciseProgress[]
  settings: StoredSettings[]
}

/** Dump the whole database to a JSON string for download. */
export async function exportBackup(): Promise<string> {
  const [exercises, splits, sessions, progress, settings] = await Promise.all([
    db.exercises.toArray(),
    db.splits.toArray(),
    db.sessions.toArray(),
    db.progress.toArray(),
    db.settings.toArray(),
  ])
  const backup: BackupFile = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    exercises,
    splits,
    sessions,
    progress,
    settings,
  }
  return JSON.stringify(backup, null, 2)
}

/** Parse + validate a backup file. Throws with a readable message if malformed. */
export function parseBackup(text: string): BackupFile {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Backup file has no content.')
  }
  const b = raw as Partial<BackupFile>
  if (typeof b.schemaVersion !== 'number') {
    throw new Error('Backup is missing a schema version.')
  }
  if (b.schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `This backup was made with a newer app version (v${b.schemaVersion}). ` +
        `Update the app first, then import again.`,
    )
  }
  for (const key of ['exercises', 'splits', 'sessions', 'progress', 'settings'] as const) {
    if (!Array.isArray(b[key])) {
      throw new Error(`Backup is missing the "${key}" section.`)
    }
  }
  return b as BackupFile
}

/** Replace the entire database with backup contents (destructive — clears current data). */
export async function importBackup(text: string): Promise<void> {
  const backup = parseBackup(text)
  await db.transaction(
    'rw',
    [db.exercises, db.splits, db.sessions, db.progress, db.settings],
    async () => {
      await db.exercises.clear()
      await db.splits.clear()
      await db.sessions.clear()
      await db.progress.clear()
      await db.settings.clear()
      await db.exercises.bulkPut(backup.exercises)
      await db.splits.bulkPut(backup.splits)
      await db.sessions.bulkPut(backup.sessions)
      await db.progress.bulkPut(backup.progress)
      await db.settings.bulkPut(backup.settings)
    },
  )
}
