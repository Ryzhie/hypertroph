import type { MuscleGroup } from '../types/exercise'

/**
 * Muscle-map regions for the front/back body SVG.
 * Redesigned with smoother, more anatomical curves.
 * Each region is authored on the LEFT half (viewBox 200×420) and
 * mirrored to the right by the BodyMap component.
 */
export interface BodyRegion {
  id: string
  view: 'front' | 'back' | 'both'
  d: string
  deco?: boolean
  centered?: boolean
}

const CX = 100 // center x

export const BODY_REGIONS: BodyRegion[] = [
  // --- decorative ---
  { id: 'head', view: 'front', d: `M${CX} 4 a16 19 0 1 0 0.01 0 Z`, deco: true },

  // --- front: torso ---
  {
    id: 'chest',
    view: 'front',
    d: `M${CX - 32} 72 C${CX - 18} 66 ${CX - 6} 70 ${CX - 2} 82 L${CX - 4} 140 C${CX - 10} 150 ${CX - 28} 146 ${CX - 32} 136 C${CX - 34} 110 ${CX - 34} 88 ${CX - 32} 72 Z`,
  },
  {
    id: 'delt',
    view: 'front',
    d: `M${CX - 38} 74 C${CX - 44} 62 ${CX - 32} 52 ${CX - 20} 58 C${CX - 14} 60 ${CX - 10} 68 ${CX - 12} 78 C${CX - 22} 84 ${CX - 34} 82 ${CX - 38} 74 Z`,
  },
  {
    id: 'biceps',
    view: 'front',
    d: `M${CX - 18} 86 C${CX - 24} 94 ${CX - 26} 112 ${CX - 24} 128 L${CX - 16} 130 C${CX - 16} 114 ${CX - 14} 98 ${CX - 8} 88 Z`,
  },
  {
    id: 'abs',
    view: 'front',
    centered: true,
    d: `M${CX - 16} 140 C${CX - 12} 138 ${CX + 12} 138 ${CX + 16} 140 L${CX + 14} 200 L${CX - 14} 200 Z`,
  },

  // --- back ---
  {
    id: 'traps',
    view: 'back',
    centered: true,
    d: `M${CX - 34} 64 C${CX - 16} 54 ${CX + 16} 54 ${CX + 34} 64 L${CX + 32} 82 C${CX + 16} 74 ${CX - 16} 74 ${CX - 32} 82 Z`,
  },
  {
    id: 'lat',
    view: 'back',
    d: `M${CX - 30} 100 C${CX - 34} 130 ${CX - 32} 168 ${CX - 26} 194 L${CX - 14} 188 C${CX - 18} 160 ${CX - 16} 126 ${CX - 12} 100 Z`,
  },
  {
    id: 'triceps',
    view: 'back',
    d: `M${CX - 16} 86 C${CX - 26} 94 ${CX - 30} 114 ${CX - 28} 130 L${CX - 18} 132 C${CX - 18} 114 ${CX - 12} 96 ${CX - 6} 88 Z`,
  },
  {
    id: 'glute',
    view: 'back',
    d: `M${CX - 22} 186 C${CX - 28} 204 ${CX - 26} 222 ${CX - 20} 234 L${CX - 4} 230 C${CX - 6} 218 ${CX - 6} 200 ${CX - 2} 186 Z`,
  },
  {
    id: 'ham',
    view: 'back',
    d: `M${CX - 20} 230 C${CX - 26} 256 ${CX - 26} 280 ${CX - 22} 302 L${CX - 10} 298 C${CX - 12} 274 ${CX - 10} 250 ${CX - 4} 230 Z`,
  },

  // --- both sides ---
  {
    id: 'forearm',
    view: 'both',
    d: `M${CX - 26} 132 C${CX - 30} 150 ${CX - 34} 172 ${CX - 30} 192 L${CX - 22} 188 C${CX - 22} 168 ${CX - 18} 148 ${CX - 14} 132 Z`,
  },
  {
    id: 'quad',
    view: 'front',
    d: `M${CX - 22} 198 C${CX - 28} 226 ${CX - 30} 254 ${CX - 26} 282 L${CX - 10} 278 C${CX - 12} 250 ${CX - 12} 222 ${CX - 6} 198 Z`,
  },
  {
    id: 'calf',
    view: 'both',
    d: `M${CX - 24} 290 C${CX - 28} 314 ${CX - 26} 340 ${CX - 22} 358 L${CX - 10} 354 C${CX - 12} 332 ${CX - 10} 308 ${CX - 4} 290 Z`,
  },
]

/** Decorative pieces for each view. */
export const BODY_DECO: Record<'front' | 'back', string[]> = {
  front: ['head'],
  back: ['head'],
}

// Foot path (decorative).
const FOOT_PATH = `M${CX - 22} 364 L${CX - 8} 362 L${CX - 6} 374 L${CX - 24} 376 Z`

/** Muscle group → region id(s) to highlight. `full` lights up everything. */
export const MUSCLE_REGIONS: Record<MuscleGroup, string[]> = {
  chest: ['chest'],
  back: ['traps', 'lat'],
  shoulders: ['delt'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearm'],
  legs: ['quad', 'ham'],
  glutes: ['glute'],
  calves: ['calf'],
  core: ['abs'],
  cardio: [],
  full: ['chest', 'delt', 'biceps', 'forearm', 'abs', 'traps', 'lat', 'triceps', 'glute', 'ham', 'quad', 'calf'],
}

/** Reverse lookup: region id → owning muscle group. */
export const REGION_GROUP: Record<string, MuscleGroup> = Object.fromEntries(
  (Object.entries(MUSCLE_REGIONS) as [MuscleGroup, string[]][]).flatMap(([group, ids]) =>
    ids.map((id) => [id, group]),
  ),
)

/** Resolve a set of active muscle groups to the region ids to light up. */
export function regionsFor(groups: MuscleGroup[] | undefined): Set<string> {
  const active = new Set(groups ?? [])
  if (active.has('full')) return new Set(MUSCLE_REGIONS.full)
  const ids = new Set<string>()
  for (const g of active) for (const id of MUSCLE_REGIONS[g] ?? []) ids.add(id)
  return ids
}

/** Get the region definition by id. */
export function regionById(id: string): BodyRegion | undefined {
  if (id === 'foot') return { id: 'foot', view: 'both', d: FOOT_PATH, deco: true }
  return BODY_REGIONS.find((r) => r.id === id)
}

/** Per-muscle-group info: exercises, tips, common mistakes. */
export const MUSCLE_INFO: Record<MuscleGroup, { exercises: string[]; tip: string; cue: string }> = {
  chest: {
    exercises: ['Barbell Bench Press', 'Incline Press', 'Dumbbell Bench Press', 'Cable Fly', 'Push-Up'],
    tip: 'Drive through the middle chest; retract shoulder blades for stability.',
    cue: 'Think "break the bar" at the bottom.',
  },
  back: {
    exercises: ['Barbell Row', 'Deadlift', 'Lat Pulldown', 'Seated Row', 'Face Pull'],
    tip: 'Initiate pulls from the lats, not the biceps.',
    cue: 'Imagine squeezing an orange between your shoulder blades.',
  },
  shoulders: {
    exercises: ['Overhead Press', 'Lateral Raise', 'Rear Delt Fly'],
    tip: 'Keep core braced during presses; slight lean for lateral raises.',
    cue: 'Think "pour out a pitcher" at the top of lateral raises.',
  },
  biceps: {
    exercises: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Cable Curl'],
    tip: 'Control the eccentric (lowering) — that\'s where growth happens.',
    cue: 'Squeeze at the top for a 1-second peak contraction.',
  },
  triceps: {
    exercises: ['Triceps Pushdown', 'Close-Grip Bench', 'Dips', 'Overhead Extension'],
    tip: 'Keep elbows pinned during pushdowns — only forearms move.',
    cue: 'Straighten the arm fully at the bottom for peak contraction.',
  },
  forearms: {
    exercises: ['Hammer Curl', 'Wrist Curl', 'Farmer\'s Walk'],
    tip: 'Forearm volume correlates with grip strength and deadlift progress.',
    cue: 'Squeeze the bar as hard as you can during every rep.',
  },
  legs: {
    exercises: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Lunges'],
    tip: 'Depth matters more than weight — full ROM builds more muscle.',
    cue: 'Push the floor away, not the bar.',
  },
  glutes: {
    exercises: ['Hip Thrust', 'Romanian Deadlift', 'Walking Lunge', 'Deadlift'],
    tip: 'Hip thrusts are the most direct glute builder; full lockout matters.',
    cue: 'Squeeze your glutes at the top like you\'re cracking a walnut.',
  },
  calves: {
    exercises: ['Standing Calf Raise', 'Seated Calf Raise', 'Leg Press Calf'],
    tip: 'Full stretch at the bottom, peak contraction at the top.',
    cue: 'Slow 2-second eccentric; don\'t bounce.',
  },
  core: {
    exercises: ['Hanging Leg Raise', 'Cable Crunch', 'Ab Wheel', 'Plank'],
    tip: 'Bracing (not just flexing) is the key to core strength.',
    cue: 'Draw your belly button toward your spine.',
  },
  cardio: {
    exercises: ['Treadmill Run', 'Stationary Bike', 'Rowing Machine', 'Jump Rope', 'Elliptical'],
    tip: 'Cardio builds endurance and aids recovery. 2-3 sessions per week at moderate intensity.',
    cue: 'Zone 2 training (60-70% max HR) builds aerobic base most efficiently.',
  },
  full: {
    exercises: ['Any compound lift (Squat, Deadlift, Bench, Row, OHP)'],
    tip: 'Compound movements hit multiple muscle groups — prioritize them.',
    cue: 'Full-body days are great for beginners and recovery phases.',
  },
}
