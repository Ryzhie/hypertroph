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
  full: 'Full body',
}

export type ExerciseCategory = 'compound' | 'isolation'

export interface Exercise {
  id: string
  name: string
  muscleGroups: MuscleGroup[]
  category: ExerciseCategory
  /** Optional equipment note, e.g. "Barbell", "Dumbbell", "Cable". */
  equipment?: string
  defaultSets: number
  defaultRepsRange: [number, number]
  defaultRestSeconds: number
  /** Bodyweight exercises progress by rep range, not weight. */
  isBodyweight?: boolean
  /** Explicit achievable weights (dumbbells, machines). Falls back to a derived ladder. */
  weightLadder?: number[]
  /** Soft delete — never hard-delete an exercise; history depends on it. */
  archived?: boolean
  createdAt: string
}
