export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'legs'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'cardio'
  | 'sport'
  | 'full'

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  legs: 'Legs',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
  cardio: 'Cardio',
  sport: 'Sport',
  full: 'Full body',
}

export type ExerciseCategory = 'compound' | 'isolation'

/** Which section the exercise appears in on the Exercises screen. */
export type ExerciseSection = 'weights' | 'calisthenics' | 'cardio' | 'sport'

export const SECTION_LABELS: Record<ExerciseSection, string> = {
  weights: 'Weights',
  calisthenics: 'Calisthenics',
  cardio: 'Cardio',
  sport: 'Sports',
}

export interface Exercise {
  id: string
  name: string
  muscleGroups: MuscleGroup[]
  category: ExerciseCategory
  /** Which section: weights, calisthenics, cardio, or sport. */
  section?: ExerciseSection
  /** Optional equipment note, e.g. "Barbell", "Dumbbell", "Cable". */
  equipment?: string
  defaultSets: number
  defaultRepsRange: [number, number]
  defaultRestSeconds: number
  /** Bodyweight exercises progress by rep range, not weight. */
  isBodyweight?: boolean
  /**
   * Calisthenics load multiplier: effective load = bodyWeight × loadFactor.
   * E.g., push-up ≈ 0.64, dip ≈ 0.75. Used to calculate actual load.
   */
  loadFactor?: number
  /**
   * Dumbbell/single-arm exercises where the weight is PER HAND.
   */
  perHand?: boolean
  /** Tracks duration (minutes) instead of weight×reps. */
  tracksDuration?: boolean
  /** Default duration in minutes for duration-based exercises. */
  defaultDuration?: number
  /** Section-specific tags (intensity for cardio, type for sport). */
  tags?: string[]
  /** Explicit achievable weights (dumbbells, machines). Falls back to a derived ladder. */
  weightLadder?: number[]
  /** Soft delete — never hard-delete an exercise; history depends on it. */
  archived?: boolean
  createdAt: string
}
