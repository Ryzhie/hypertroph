import Dexie, { type Table } from 'dexie'
import type { Exercise } from '../types/exercise'
import type { Split } from '../types/split'
import type { WorkoutSession } from '../types/session'
import type { ExerciseProgress } from '../types/progress'
import type { Settings } from '../types/settings'
import type { AiInsight } from '../types/ai'

/** Bump on every breaking schema change; the export file carries the same number. */
export const SCHEMA_VERSION = 2

export const SETTINGS_ID = 'main'

/** The settings row includes its own key. */
export type StoredSettings = Settings & { id: string }

class HyperTrophDB extends Dexie {
  exercises!: Table<Exercise, string>
  splits!: Table<Split, string>
  sessions!: Table<WorkoutSession, string>
  progress!: Table<ExerciseProgress, string>
  settings!: Table<StoredSettings, string>
  aiInsights!: Table<AiInsight, string>

  constructor() {
    super('hypertroph')
    // v1: original M1 schema. Must be kept so Dexie can migrate existing DBs.
    this.version(1).stores({
      exercises: 'id, name, archived',
      splits: 'id, name',
      sessions: 'id, dateKey, splitId, status',
      progress: 'exerciseId',
      settings: 'id',
    })
    // v2: adds aiInsights table; Exercise.perHand / body profile are
    // optional fields that don't require a migration callback.
    this.version(SCHEMA_VERSION).stores({
      exercises: 'id, name, archived',
      splits: 'id, name',
      sessions: 'id, dateKey, splitId, status',
      progress: 'exerciseId',
      settings: 'id',
      aiInsights: 'id, createdAt',
    })
  }
}

export const db = new HyperTrophDB()
