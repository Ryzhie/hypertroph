import Dexie, { type Table } from 'dexie'
import type { Exercise } from '../types/exercise'
import type { Split } from '../types/split'
import type { WorkoutSession } from '../types/session'
import type { ExerciseProgress } from '../types/progress'
import type { Settings } from '../types/settings'
import type { AiInsight } from '../types/ai'
import type { DraftSet } from '../components/SetRow'

/** Bump on every breaking schema change; the export file carries the same number. */
export const SCHEMA_VERSION = 3

export const SETTINGS_ID = 'main'

/** The settings row includes its own key. */
export type StoredSettings = Settings & { id: string }

/** Persisted session draft for the resume feature. */
export interface SessionDraftRow {
  id: string
  dayId: string
  drafts: Record<string, DraftSet[]>
  savedAt: string
}

class HypheDB extends Dexie {
  exercises!: Table<Exercise, string>
  splits!: Table<Split, string>
  sessions!: Table<WorkoutSession, string>
  progress!: Table<ExerciseProgress, string>
  settings!: Table<StoredSettings, string>
  aiInsights!: Table<AiInsight, string>
  // v3+: persisted session drafts for resume.
  drafts!: Table<SessionDraftRow, string>

  constructor() {
    super('hypertroph') // Keep original name for backward compat — don't change or data is lost
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
    this.version(2).stores({
      exercises: 'id, name, archived',
      splits: 'id, name',
      sessions: 'id, dateKey, splitId, status',
      progress: 'exerciseId',
      settings: 'id',
      aiInsights: 'id, createdAt',
    })
    // v3: adds drafts table for session resume.
    this.version(SCHEMA_VERSION).stores({
      exercises: 'id, name, archived',
      splits: 'id, name',
      sessions: 'id, dateKey, splitId, status',
      progress: 'exerciseId',
      settings: 'id',
      aiInsights: 'id, createdAt',
      drafts: 'id',
    })
  }
}

export const db = new HypheDB()