import type { Exercise } from '../types/exercise'

type SeedExercise = Omit<Exercise, 'createdAt'>

/** Built-in catalog. `createdAt` is stamped at seed time. */
export const EXERCISE_SEED: SeedExercise[] = [
  // Chest
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', muscleGroups: ['chest'], category: 'compound', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [6, 10], defaultRestSeconds: 180 },
  { id: 'incline-barbell-press', name: 'Incline Barbell Press', muscleGroups: ['chest'], category: 'compound', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 150 },
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', muscleGroups: ['chest'], category: 'compound', equipment: 'Dumbbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },
  { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', muscleGroups: ['chest'], category: 'compound', equipment: 'Dumbbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },
  { id: 'cable-fly', name: 'Cable Fly', muscleGroups: ['chest'], category: 'isolation', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [10, 15], defaultRestSeconds: 90 },
  { id: 'push-up', name: 'Push-Up', muscleGroups: ['chest', 'triceps'], category: 'compound', equipment: 'Bodyweight', isBodyweight: true, defaultSets: 3, defaultRepsRange: [10, 20], defaultRestSeconds: 90 },

  // Back
  { id: 'deadlift', name: 'Deadlift', muscleGroups: ['back', 'legs', 'glutes'], category: 'compound', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [5, 8], defaultRestSeconds: 240 },
  { id: 'barbell-row', name: 'Barbell Row', muscleGroups: ['back'], category: 'compound', equipment: 'Barbell', defaultSets: 4, defaultRepsRange: [6, 10], defaultRestSeconds: 150 },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroups: ['back'], category: 'compound', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },
  { id: 'seated-cable-row', name: 'Seated Cable Row', muscleGroups: ['back'], category: 'compound', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },
  { id: 'pull-up', name: 'Pull-Up', muscleGroups: ['back'], category: 'compound', equipment: 'Bodyweight', isBodyweight: true, defaultSets: 3, defaultRepsRange: [5, 12], defaultRestSeconds: 150 },
  { id: 'one-arm-dumbbell-row', name: 'One-Arm Dumbbell Row', muscleGroups: ['back'], category: 'compound', equipment: 'Dumbbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },
  { id: 'face-pull', name: 'Face Pull', muscleGroups: ['back', 'shoulders'], category: 'isolation', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [12, 20], defaultRestSeconds: 90 },

  // Shoulders
  { id: 'overhead-press', name: 'Overhead Press', muscleGroups: ['shoulders'], category: 'compound', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [6, 10], defaultRestSeconds: 180 },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', muscleGroups: ['shoulders'], category: 'compound', equipment: 'Dumbbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroups: ['shoulders'], category: 'isolation', equipment: 'Dumbbell', defaultSets: 4, defaultRepsRange: [10, 15], defaultRestSeconds: 60 },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscleGroups: ['shoulders'], category: 'isolation', equipment: 'Dumbbell', defaultSets: 3, defaultRepsRange: [12, 20], defaultRestSeconds: 60 },
  { id: 'front-raise', name: 'Front Raise', muscleGroups: ['shoulders'], category: 'isolation', equipment: 'Dumbbell', defaultSets: 3, defaultRepsRange: [10, 15], defaultRestSeconds: 60 },

  // Biceps
  { id: 'barbell-curl', name: 'Barbell Curl', muscleGroups: ['biceps'], category: 'isolation', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 90 },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', muscleGroups: ['biceps'], category: 'isolation', equipment: 'Dumbbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 90 },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroups: ['biceps', 'forearms'], category: 'isolation', equipment: 'Dumbbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 90 },
  { id: 'cable-curl', name: 'Cable Curl', muscleGroups: ['biceps'], category: 'isolation', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [10, 15], defaultRestSeconds: 90 },

  // Triceps
  { id: 'close-grip-bench', name: 'Close-Grip Bench Press', muscleGroups: ['triceps', 'chest'], category: 'compound', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [6, 10], defaultRestSeconds: 150 },
  { id: 'triceps-pushdown', name: 'Triceps Pushdown', muscleGroups: ['triceps'], category: 'isolation', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [10, 15], defaultRestSeconds: 60 },
  { id: 'overhead-triceps-extension', name: 'Overhead Triceps Extension', muscleGroups: ['triceps'], category: 'isolation', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [10, 15], defaultRestSeconds: 90 },
  { id: 'dips', name: 'Dips', muscleGroups: ['triceps', 'chest'], category: 'compound', equipment: 'Bodyweight', isBodyweight: true, defaultSets: 3, defaultRepsRange: [8, 15], defaultRestSeconds: 120 },

  // Legs
  { id: 'back-squat', name: 'Back Squat', muscleGroups: ['legs', 'glutes'], category: 'compound', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [5, 10], defaultRestSeconds: 240 },
  { id: 'front-squat', name: 'Front Squat', muscleGroups: ['legs'], category: 'compound', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [5, 10], defaultRestSeconds: 240 },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroups: ['legs', 'glutes', 'back'], category: 'compound', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 180 },
  { id: 'leg-press', name: 'Leg Press', muscleGroups: ['legs'], category: 'compound', equipment: 'Machine', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 180 },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroups: ['legs'], category: 'isolation', equipment: 'Machine', defaultSets: 3, defaultRepsRange: [10, 15], defaultRestSeconds: 90 },
  { id: 'leg-curl', name: 'Leg Curl', muscleGroups: ['legs'], category: 'isolation', equipment: 'Machine', defaultSets: 3, defaultRepsRange: [10, 15], defaultRestSeconds: 90 },
  { id: 'walking-lunge', name: 'Walking Lunge', muscleGroups: ['legs', 'glutes'], category: 'compound', equipment: 'Dumbbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },

  // Glutes
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroups: ['glutes'], category: 'compound', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 180 },
  { id: 'glute-kickback', name: 'Glute Kickback', muscleGroups: ['glutes'], category: 'isolation', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [12, 20], defaultRestSeconds: 60 },

  // Calves
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', muscleGroups: ['calves'], category: 'isolation', equipment: 'Machine', defaultSets: 4, defaultRepsRange: [12, 20], defaultRestSeconds: 60 },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', muscleGroups: ['calves'], category: 'isolation', equipment: 'Machine', defaultSets: 4, defaultRepsRange: [12, 20], defaultRestSeconds: 60 },

  // Core
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscleGroups: ['core'], category: 'isolation', equipment: 'Bodyweight', isBodyweight: true, defaultSets: 3, defaultRepsRange: [8, 15], defaultRestSeconds: 90 },
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroups: ['core'], category: 'isolation', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [12, 20], defaultRestSeconds: 90 },
  { id: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', muscleGroups: ['core'], category: 'compound', equipment: 'Bodyweight', isBodyweight: true, defaultSets: 3, defaultRepsRange: [6, 12], defaultRestSeconds: 90 },
]
