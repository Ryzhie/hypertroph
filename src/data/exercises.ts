import type { Exercise } from '../types/exercise'

type SeedExercise = Omit<Exercise, 'createdAt'>

/**
 * Built-in catalog — organized into 4 sections:
 * - Weights: barbell, dumbbell, machine, cable exercises
 * - Calisthenics: bodyweight + weighted bodyweight
 * - Cardio: machines, running, rowing, etc.
 * - Sport: swimming, basketball, etc.
 *
 * loadFactor for calisthenics: effective load = bodyWeight × loadFactor.
 * tracksDuration for cardio/sport: tracks minutes instead of weight×reps.
 */
export const EXERCISE_SEED: SeedExercise[] = [
  // ==================== WEIGHTS ====================
  // Chest
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', muscleGroups: ['chest'], category: 'compound', section: 'weights', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [6, 10], defaultRestSeconds: 180 },
  { id: 'incline-barbell-press', name: 'Incline Barbell Press', muscleGroups: ['chest'], category: 'compound', section: 'weights', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 150 },
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', muscleGroups: ['chest'], category: 'compound', section: 'weights', equipment: 'Dumbbell', perHand: true, defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },
  { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', muscleGroups: ['chest'], category: 'compound', section: 'weights', equipment: 'Dumbbell', perHand: true, defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },
  { id: 'cable-fly', name: 'Cable Fly', muscleGroups: ['chest'], category: 'isolation', section: 'weights', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [10, 15], defaultRestSeconds: 90 },

  // Back
  { id: 'deadlift', name: 'Deadlift', muscleGroups: ['back', 'legs', 'glutes'], category: 'compound', section: 'weights', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [5, 8], defaultRestSeconds: 240 },
  { id: 'barbell-row', name: 'Barbell Row', muscleGroups: ['back'], category: 'compound', section: 'weights', equipment: 'Barbell', defaultSets: 4, defaultRepsRange: [6, 10], defaultRestSeconds: 150 },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroups: ['back'], category: 'compound', section: 'weights', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },
  { id: 'seated-cable-row', name: 'Seated Cable Row', muscleGroups: ['back'], category: 'compound', section: 'weights', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },
  { id: 'face-pull', name: 'Face Pull', muscleGroups: ['back', 'shoulders'], category: 'isolation', section: 'weights', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [12, 20], defaultRestSeconds: 90 },
  { id: 'one-arm-dumbbell-row', name: 'One-Arm Dumbbell Row', muscleGroups: ['back'], category: 'compound', section: 'weights', equipment: 'Dumbbell', perHand: true, defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },

  // Shoulders
  { id: 'overhead-press', name: 'Overhead Press', muscleGroups: ['shoulders'], category: 'compound', section: 'weights', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [6, 10], defaultRestSeconds: 180 },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', muscleGroups: ['shoulders'], category: 'compound', section: 'weights', equipment: 'Dumbbell', perHand: true, defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroups: ['shoulders'], category: 'isolation', section: 'weights', equipment: 'Dumbbell', perHand: true, defaultSets: 4, defaultRepsRange: [10, 15], defaultRestSeconds: 60 },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscleGroups: ['shoulders'], category: 'isolation', section: 'weights', equipment: 'Dumbbell', perHand: true, defaultSets: 3, defaultRepsRange: [12, 20], defaultRestSeconds: 60 },
  { id: 'front-raise', name: 'Front Raise', muscleGroups: ['shoulders'], category: 'isolation', section: 'weights', equipment: 'Dumbbell', perHand: true, defaultSets: 3, defaultRepsRange: [10, 15], defaultRestSeconds: 60 },

  // Biceps
  { id: 'barbell-curl', name: 'Barbell Curl', muscleGroups: ['biceps'], category: 'isolation', section: 'weights', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 90 },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', muscleGroups: ['biceps'], category: 'isolation', section: 'weights', equipment: 'Dumbbell', perHand: true, defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 90 },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroups: ['biceps', 'forearms'], category: 'isolation', section: 'weights', equipment: 'Dumbbell', perHand: true, defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 90 },
  { id: 'cable-curl', name: 'Cable Curl', muscleGroups: ['biceps'], category: 'isolation', section: 'weights', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [10, 15], defaultRestSeconds: 90 },

  // Triceps
  { id: 'close-grip-bench', name: 'Close-Grip Bench Press', muscleGroups: ['triceps', 'chest'], category: 'compound', section: 'weights', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [6, 10], defaultRestSeconds: 150 },
  { id: 'triceps-pushdown', name: 'Triceps Pushdown', muscleGroups: ['triceps'], category: 'isolation', section: 'weights', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [10, 15], defaultRestSeconds: 60 },
  { id: 'overhead-triceps-extension', name: 'Overhead Triceps Extension', muscleGroups: ['triceps'], category: 'isolation', section: 'weights', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [10, 15], defaultRestSeconds: 90 },

  // Legs
  { id: 'back-squat', name: 'Back Squat', muscleGroups: ['legs', 'glutes'], category: 'compound', section: 'weights', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [5, 10], defaultRestSeconds: 240 },
  { id: 'front-squat', name: 'Front Squat', muscleGroups: ['legs'], category: 'compound', section: 'weights', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [5, 10], defaultRestSeconds: 240 },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroups: ['legs', 'glutes', 'back'], category: 'compound', section: 'weights', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 180 },
  { id: 'leg-press', name: 'Leg Press', muscleGroups: ['legs'], category: 'compound', section: 'weights', equipment: 'Machine', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 180 },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroups: ['legs'], category: 'isolation', section: 'weights', equipment: 'Machine', defaultSets: 3, defaultRepsRange: [10, 15], defaultRestSeconds: 90 },
  { id: 'leg-curl', name: 'Leg Curl', muscleGroups: ['legs'], category: 'isolation', section: 'weights', equipment: 'Machine', defaultSets: 3, defaultRepsRange: [10, 15], defaultRestSeconds: 90 },
  { id: 'walking-lunge', name: 'Walking Lunge', muscleGroups: ['legs', 'glutes'], category: 'compound', section: 'weights', equipment: 'Dumbbell', perHand: true, defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },

  // Glutes
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroups: ['glutes'], category: 'compound', section: 'weights', equipment: 'Barbell', defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 180 },
  { id: 'glute-kickback', name: 'Glute Kickback', muscleGroups: ['glutes'], category: 'isolation', section: 'weights', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [12, 20], defaultRestSeconds: 60 },

  // Calves
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', muscleGroups: ['calves'], category: 'isolation', section: 'weights', equipment: 'Machine', defaultSets: 4, defaultRepsRange: [12, 20], defaultRestSeconds: 60 },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', muscleGroups: ['calves'], category: 'isolation', section: 'weights', equipment: 'Machine', defaultSets: 4, defaultRepsRange: [12, 20], defaultRestSeconds: 60 },

  // Core
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroups: ['core'], category: 'isolation', section: 'weights', equipment: 'Cable', defaultSets: 3, defaultRepsRange: [12, 20], defaultRestSeconds: 90 },

  // ==================== CALISTHENICS ====================
  // Chest
  { id: 'push-up', name: 'Push-Up', muscleGroups: ['chest', 'triceps'], category: 'compound', section: 'calisthenics', equipment: 'Bodyweight', isBodyweight: true, loadFactor: 0.64, defaultSets: 3, defaultRepsRange: [10, 20], defaultRestSeconds: 90 },
  { id: 'incline-push-up', name: 'Incline Push-Up', muscleGroups: ['chest', 'triceps'], category: 'compound', section: 'calisthenics', equipment: 'Bodyweight', isBodyweight: true, loadFactor: 0.45, defaultSets: 3, defaultRepsRange: [12, 25], defaultRestSeconds: 60 },

  // Back
  { id: 'pull-up', name: 'Pull-Up', muscleGroups: ['back'], category: 'compound', section: 'calisthenics', equipment: 'Bodyweight', isBodyweight: true, loadFactor: 1.0, defaultSets: 3, defaultRepsRange: [5, 12], defaultRestSeconds: 150 },
  { id: 'chin-up', name: 'Chin-Up', muscleGroups: ['back', 'biceps'], category: 'compound', section: 'calisthenics', equipment: 'Bodyweight', isBodyweight: true, loadFactor: 1.0, defaultSets: 3, defaultRepsRange: [5, 12], defaultRestSeconds: 150 },
  { id: 'australian-row', name: 'Australian Row', muscleGroups: ['back'], category: 'compound', section: 'calisthenics', equipment: 'Bodyweight', isBodyweight: true, loadFactor: 0.55, defaultSets: 3, defaultRepsRange: [8, 15], defaultRestSeconds: 90 },
  { id: 'muscle-up', name: 'Muscle-Up', muscleGroups: ['back', 'chest', 'shoulders'], category: 'compound', section: 'calisthenics', equipment: 'Bodyweight', isBodyweight: true, loadFactor: 1.0, defaultSets: 3, defaultRepsRange: [3, 8], defaultRestSeconds: 180 },

  // Shoulders
  { id: 'pike-push-up', name: 'Pike Push-Up', muscleGroups: ['shoulders'], category: 'compound', section: 'calisthenics', equipment: 'Bodyweight', isBodyweight: true, loadFactor: 0.5, defaultSets: 3, defaultRepsRange: [6, 12], defaultRestSeconds: 90 },
  { id: 'handstand-push-up', name: 'Handstand Push-Up', muscleGroups: ['shoulders'], category: 'compound', section: 'calisthenics', equipment: 'Bodyweight', isBodyweight: true, loadFactor: 1.0, defaultSets: 3, defaultRepsRange: [3, 8], defaultRestSeconds: 180 },

  // Core
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscleGroups: ['core'], category: 'isolation', section: 'calisthenics', equipment: 'Bodyweight', isBodyweight: true, loadFactor: 0.35, defaultSets: 3, defaultRepsRange: [8, 15], defaultRestSeconds: 90 },
  { id: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', muscleGroups: ['core'], category: 'compound', section: 'calisthenics', equipment: 'Bodyweight', isBodyweight: true, loadFactor: 0.5, defaultSets: 3, defaultRepsRange: [6, 12], defaultRestSeconds: 90 },
  { id: 'plank', name: 'Plank', muscleGroups: ['core'], category: 'isolation', section: 'calisthenics', equipment: 'Bodyweight', isBodyweight: true, loadFactor: 0.4, defaultSets: 3, defaultRepsRange: [30, 90], defaultRestSeconds: 60, tracksDuration: true, defaultDuration: 1 },

  // Arms
  { id: 'dips', name: 'Dips', muscleGroups: ['triceps', 'chest'], category: 'compound', section: 'calisthenics', equipment: 'Bodyweight', isBodyweight: true, loadFactor: 0.75, defaultSets: 3, defaultRepsRange: [8, 15], defaultRestSeconds: 120 },

  // Legs
  { id: 'pistol-squat', name: 'Pistol Squat', muscleGroups: ['legs', 'glutes'], category: 'compound', section: 'calisthenics', equipment: 'Bodyweight', isBodyweight: true, loadFactor: 1.0, defaultSets: 3, defaultRepsRange: [3, 8], defaultRestSeconds: 150 },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', muscleGroups: ['legs', 'glutes'], category: 'compound', section: 'calisthenics', equipment: 'Bodyweight', isBodyweight: true, loadFactor: 0.75, defaultSets: 3, defaultRepsRange: [8, 12], defaultRestSeconds: 120 },

  // ==================== CARDIO (intensity tags) ====================
  { id: 'treadmill-run', name: 'Treadmill Run', muscleGroups: ['cardio'], category: 'compound', section: 'cardio', equipment: 'Machine', tracksDuration: true, defaultDuration: 30, defaultSets: 1, defaultRepsRange: [20, 30], defaultRestSeconds: 0, tags: ['moderate', 'endurance', 'steady-state'] },
  { id: 'stationary-bike', name: 'Stationary Bike', muscleGroups: ['cardio', 'legs'], category: 'compound', section: 'cardio', equipment: 'Machine', tracksDuration: true, defaultDuration: 30, defaultSets: 1, defaultRepsRange: [15, 30], defaultRestSeconds: 0, tags: ['moderate', 'endurance', 'low-impact'] },
  { id: 'rowing-machine', name: 'Rowing Machine', muscleGroups: ['cardio', 'back'], category: 'compound', section: 'cardio', equipment: 'Machine', tracksDuration: true, defaultDuration: 20, defaultSets: 1, defaultRepsRange: [15, 25], defaultRestSeconds: 0, tags: ['high', 'full-body', 'power'] },
  { id: 'jump-rope', name: 'Jump Rope', muscleGroups: ['cardio', 'calves'], category: 'compound', section: 'cardio', equipment: 'Other', tracksDuration: true, defaultDuration: 10, defaultSets: 3, defaultRepsRange: [30, 60], defaultRestSeconds: 60, tags: ['high', 'agility', 'coordination'] },
  { id: 'elliptical', name: 'Elliptical', muscleGroups: ['cardio', 'legs'], category: 'compound', section: 'cardio', equipment: 'Machine', tracksDuration: true, defaultDuration: 30, defaultSets: 1, defaultRepsRange: [15, 30], defaultRestSeconds: 0, tags: ['light', 'endurance', 'low-impact'] },
  { id: 'stair-master', name: 'Stair Master', muscleGroups: ['cardio', 'glutes', 'calves'], category: 'compound', section: 'cardio', equipment: 'Machine', tracksDuration: true, defaultDuration: 20, defaultSets: 1, defaultRepsRange: [15, 20], defaultRestSeconds: 0, tags: ['high', 'endurance', 'lower-body'] },
  { id: 'battle-ropes', name: 'Battle Ropes', muscleGroups: ['cardio', 'shoulders'], category: 'compound', section: 'cardio', equipment: 'Other', tracksDuration: true, defaultDuration: 10, defaultSets: 3, defaultRepsRange: [15, 30], defaultRestSeconds: 60, tags: ['max', 'power', 'HIIT'] },
  { id: 'sled-push', name: 'Sled Push', muscleGroups: ['cardio', 'legs'], category: 'compound', section: 'cardio', equipment: 'Machine', tracksDuration: true, defaultDuration: 10, defaultSets: 3, defaultRepsRange: [15, 30], defaultRestSeconds: 90, tags: ['max', 'power', 'lower-body'] },
  { id: 'assault-bike', name: 'Assault Bike', muscleGroups: ['cardio'], category: 'compound', section: 'cardio', equipment: 'Machine', tracksDuration: true, defaultDuration: 15, defaultSets: 1, defaultRepsRange: [10, 20], defaultRestSeconds: 0, tags: ['max', 'HIIT', 'full-body'] },
  { id: 'swimming-laps', name: 'Swimming Laps', muscleGroups: ['full'], category: 'compound', section: 'cardio', equipment: 'Other', tracksDuration: true, defaultDuration: 30, defaultSets: 1, defaultRepsRange: [20, 40], defaultRestSeconds: 0, tags: ['moderate', 'endurance', 'low-impact'] },

  // ==================== SPORTS ====================
  { id: 'swimming', name: 'Swimming', muscleGroups: ['full'], category: 'compound', section: 'sport', equipment: 'Other', tracksDuration: true, defaultDuration: 45, defaultSets: 1, defaultRepsRange: [30, 60], defaultRestSeconds: 0, tags: ['freestyle', 'backstroke', 'butterfly', 'breaststroke', 'drills'] },
  { id: 'badminton', name: 'Badminton', muscleGroups: ['shoulders', 'legs', 'cardio'], category: 'compound', section: 'sport', equipment: 'Other', tracksDuration: true, defaultDuration: 60, defaultSets: 1, defaultRepsRange: [30, 60], defaultRestSeconds: 0, tags: ['singles-match', 'doubles-match', 'drills', 'footwork'] },
  { id: 'tennis', name: 'Tennis', muscleGroups: ['shoulders', 'legs', 'cardio'], category: 'compound', section: 'sport', equipment: 'Other', tracksDuration: true, defaultDuration: 60, defaultSets: 1, defaultRepsRange: [30, 60], defaultRestSeconds: 0, tags: ['singles-match', 'doubles-match', 'serving-practice', 'rally'] },
  { id: 'basketball', name: 'Basketball', muscleGroups: ['legs', 'cardio'], category: 'compound', section: 'sport', equipment: 'Other', tracksDuration: true, defaultDuration: 60, defaultSets: 1, defaultRepsRange: [30, 60], defaultRestSeconds: 0, tags: ['match', 'hooping-practice', 'drills', '3v3', 'pickup-game'] },
  { id: 'soccer', name: 'Soccer', muscleGroups: ['legs', 'cardio'], category: 'compound', section: 'sport', equipment: 'Other', tracksDuration: true, defaultDuration: 90, defaultSets: 1, defaultRepsRange: [30, 60], defaultRestSeconds: 0, tags: ['match', 'training', 'scrimmage', 'skills-drill'] },
  { id: 'martial-arts', name: 'Martial Arts', muscleGroups: ['full', 'core'], category: 'compound', section: 'sport', equipment: 'Other', tracksDuration: true, defaultDuration: 60, defaultSets: 1, defaultRepsRange: [30, 60], defaultRestSeconds: 0, tags: ['sparring', 'bag-work', 'technique-drill', 'grappling'] },
  { id: 'rock-climbing', name: 'Rock Climbing', muscleGroups: ['back', 'biceps', 'forearms', 'core'], category: 'compound', section: 'sport', equipment: 'Other', tracksDuration: true, defaultDuration: 45, defaultSets: 1, defaultRepsRange: [20, 45], defaultRestSeconds: 0, tags: ['bouldering', 'lead-climb', 'top-rope', 'traverse'] },
  { id: 'boxing', name: 'Boxing', muscleGroups: ['shoulders', 'core', 'cardio'], category: 'compound', section: 'sport', equipment: 'Other', tracksDuration: true, defaultDuration: 45, defaultSets: 1, defaultRepsRange: [20, 45], defaultRestSeconds: 0, tags: ['bag-work', 'sparring', 'pad-work', 'footwork-drill'] },
  { id: 'cycling', name: 'Cycling', muscleGroups: ['legs', 'cardio'], category: 'compound', section: 'sport', equipment: 'Other', tracksDuration: true, defaultDuration: 60, defaultSets: 1, defaultRepsRange: [30, 60], defaultRestSeconds: 0, tags: ['road-ride', 'indoor-trainer', 'hill-climbs', 'sprint-intervals'] },
]
