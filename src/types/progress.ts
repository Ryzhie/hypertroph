export interface TopSetInfo {
  weightKg: number
  reps: number
  rpe?: number
}

export interface E1rmPoint {
  date: string
  e1rm: number
}

/**
 * Per-exercise overload state. Keyed globally by exerciseId (shared across splits —
 * bench on Bro Split and on PPL is the same lift).
 */
export interface ExerciseProgress {
  exerciseId: string
  /** Current prescribed weight for the next session. */
  weightKg: number
  /** Currently active rep range (may differ from the plan slot's default). */
  repsRange: [number, number]
  /** Consecutive sessions that reached at least the bottom of the range. */
  sessionsAtWeight: number
  /** Consecutive sessions that FAILED to reach the bottom of the range. */
  stallStreak: number
  lastSessionDate?: string
  lastTopSet?: TopSetInfo
  e1rmBest: number
  e1rmBestDate?: string
  /** Bounded history (~200 points). */
  e1rmHistory: E1rmPoint[]
  deloadedAt?: string
  /** UI nudge only — never an automatic weight change. */
  suggestDeload?: boolean
  isNovice?: boolean
}

/** How hard a set felt, as a fast quick-pick. Maps to an RPE value. */
export const RPE_PRESETS: { label: string; rpe: number }[] = [
  { label: 'Too easy', rpe: 7 },
  { label: 'Just right', rpe: 8 },
  { label: 'Grinder', rpe: 9 },
  { label: 'Failed', rpe: 10 },
]
