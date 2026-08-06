export type SessionStatus = 'in-progress' | 'completed'

export interface WorkoutSet {
  /** Canonical kg. Display conversion happens at the UI boundary. */
  weightKg: number
  reps: number
  /** Effort rating 6–10, optional. 10 = failure. */
  rpe?: number
}

export interface WorkoutExerciseLog {
  exerciseId: string
  /** Snapshot of the exercise name so history survives edits/archives. */
  exerciseName: string
  /**
   * Snapshot of whether weights are per hand (dumbbells). Set weightKg is per
   * side; volume counts both sides (×2). Keeps history self-contained.
   */
  perHand?: boolean
  sets: WorkoutSet[]
}

/**
 * A workout session. Day/split names are snapshots so history never joins
 * against a live (possibly edited) plan. Only `completed` sessions feed the algorithm.
 */
export interface WorkoutSession {
  id: string
  /** Local date, YYYY-MM-DD. */
  dateKey: string
  splitId: string
  splitName: string
  dayKey: string
  dayName: string
  status: SessionStatus
  startedAt: string
  finishedAt?: string
  logs: WorkoutExerciseLog[]
}
