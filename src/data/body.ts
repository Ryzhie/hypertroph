import type { MuscleGroup } from '../types/exercise'

export interface BodyRegion {
  id: string
  view: 'front' | 'back' | 'both'
  d: string
  deco?: boolean
  centered?: boolean
}

/*
 * Body regions with smooth, organic curves.
 * All authored on the LEFT half of a 240×400 viewBox and mirrored.
 * The figure is a stylized athletic body — wider shoulders, tapered waist,
 * proportional limbs. Smooth bezier curves throughout.
 */
const CX = 120 // center line

export const BODY_REGIONS: BodyRegion[] = [
  // --- decorative: head + neck ---
  { id: 'head', view: 'front', d: `M${CX} 8 a18 22 0 1 0 0.01 0 Z`, deco: true },
  { id: 'neck', view: 'front', d: `M${CX-8} 30 L${CX+8} 30 L${CX+8} 44 L${CX-8} 44 Z`, deco: true },

  // --- FRONT muscle regions ---
  // Chest (pectorals) — fan shape from shoulder to sternum
  {
    id: 'chest',
    view: 'front',
    d: `M${CX-40} 62 C${CX-30} 54 ${CX-12} 58 ${CX-4} 72
        L${CX-6} 130 C${CX-12} 136 ${CX-32} 132 ${CX-38} 122
        C${CX-42} 108 ${CX-42} 80 ${CX-40} 62 Z`,
  },
  // Deltoids (front) — rounded shoulder cap
  {
    id: 'delt',
    view: 'front',
    d: `M${CX-48} 56 C${CX-54} 44 ${CX-42} 34 ${CX-32} 38
        C${CX-24} 40 ${CX-20} 50 ${CX-22} 60
        C${CX-30} 68 ${CX-44} 66 ${CX-48} 56 Z`,
  },
  // Biceps — elongated oval on upper arm
  {
    id: 'biceps',
    view: 'front',
    d: `M${CX-26} 72 C${CX-32} 82 ${CX-34} 104 ${CX-32} 122
        L${CX-24} 124 C${CX-24} 104 ${CX-22} 86 ${CX-16} 74 Z`,
  },
  // Abs (centered) — segmented rectangle
  {
    id: 'abs',
    view: 'front',
    centered: true,
    d: `M${CX-18} 128 C${CX-14} 126 ${CX+14} 126 ${CX+18} 128
        L${CX+16} 196 L${CX-16} 196 Z`,
  },

  // --- BACK muscle regions ---
  // Traps — diamond shape across upper back
  {
    id: 'traps',
    view: 'back',
    centered: true,
    d: `M${CX-38} 48 C${CX-22} 38 ${CX+22} 38 ${CX+38} 48
        L${CX+36} 70 C${CX+20} 62 ${CX-20} 62 ${CX-36} 70 Z`,
  },
  // Lats — wide V-shape
  {
    id: 'lat',
    view: 'back',
    d: `M${CX-34} 88 C${CX-38} 118 ${CX-36} 162 ${CX-28} 186
        L${CX-16} 180 C${CX-20} 152 ${CX-18} 118 ${CX-14} 90 Z`,
  },
  // Triceps — horseshoe on back of upper arm
  {
    id: 'triceps',
    view: 'back',
    d: `M${CX-24} 72 C${CX-34} 82 ${CX-38} 104 ${CX-36} 122
        L${CX-26} 124 C${CX-26} 104 ${CX-22} 84 ${CX-16} 74 Z`,
  },
  // Glutes — rounded
  {
    id: 'glute',
    view: 'back',
    d: `M${CX-28} 176 C${CX-34} 194 ${CX-32} 216 ${CX-26} 228
        L${CX-8} 224 C${CX-10} 210 ${CX-10} 190 ${CX-6} 176 Z`,
  },
  // Hamstrings — back of thigh
  {
    id: 'ham',
    view: 'back',
    d: `M${CX-26} 226 C${CX-32} 256 ${CX-32} 288 ${CX-28} 314
        L${CX-14} 310 C${CX-16} 282 ${CX-14} 252 ${CX-8} 226 Z`,
  },

  // --- BOTH SIDES ---
  // Forearms
  {
    id: 'forearm',
    view: 'both',
    d: `M${CX-36} 126 C${CX-42} 148 ${CX-44} 176 ${CX-40} 198
        L${CX-30} 194 C${CX-30} 170 ${CX-28} 148 ${CX-22} 128 Z`,
  },
  // Quads (front thigh)
  {
    id: 'quad',
    view: 'front',
    d: `M${CX-24} 192 C${CX-32} 222 ${CX-34} 258 ${CX-30} 290
        L${CX-14} 286 C${CX-16} 254 ${CX-16} 222 ${CX-10} 192 Z`,
  },
  // Calves
  {
    id: 'calf',
    view: 'both',
    d: `M${CX-28} 318 C${CX-34} 344 ${CX-32} 372 ${CX-28} 388
        L${CX-16} 384 C${CX-18} 364 ${CX-16} 336 ${CX-12} 318 Z`,
  },
]

export const BODY_DECO: Record<'front' | 'back', string[]> = {
  front: ['head', 'neck'],
  back: ['head'],
}

/** Full body silhouette outline (thin stroke, no fill) — gives context to the muscle regions. */
export const BODY_OUTLINE = `M${CX} 8
  a18 22 0 1 0 0.01 0 Z
  M${CX-8} 30 C${CX-10} 36 ${CX-12} 40 ${CX-14} 44
  C${CX-36} 50 ${CX-50} 42 ${CX-54} 56
  C${CX-56} 68 ${CX-48} 80 ${CX-42} 92
  C${CX-44} 112 ${CX-44} 140 ${CX-40} 160
  C${CX-42} 176 ${CX-44} 196 ${CX-40} 206
  C${CX-44} 228 ${CX-38} 260 ${CX-32} 290
  C${CX-34} 320 ${CX-32} 350 ${CX-28} 380
  C${CX-26} 388 ${CX-24} 392 ${CX-16} 392
  C${CX-10} 392 ${CX+10} 392 ${CX+16} 392
  C${CX+24} 392 ${CX+26} 388 ${CX+28} 380
  C${CX+32} 350 ${CX+34} 320 ${CX+32} 290
  C${CX+38} 260 ${CX+44} 228 ${CX+40} 206
  C${CX+42} 196 ${CX+44} 176 ${CX+42} 160
  C${CX+44} 140 ${CX+44} 112 ${CX+42} 92
  C${CX+48} 80 ${CX+56} 68 ${CX+54} 56
  C${CX+50} 42 ${CX+36} 50 ${CX+14} 44
  C${CX+12} 40 ${CX+10} 36 ${CX+8} 30
  C${CX+4} 34 ${CX-4} 34 ${CX-8} 30 Z`

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

export const REGION_GROUP: Record<string, MuscleGroup> = Object.fromEntries(
  (Object.entries(MUSCLE_REGIONS) as [MuscleGroup, string[]][]).flatMap(([group, ids]) =>
    ids.map((id) => [id, group]),
  ),
)

export function regionsFor(groups: MuscleGroup[] | undefined): Set<string> {
  const active = new Set(groups ?? [])
  if (active.has('full')) return new Set(MUSCLE_REGIONS.full)
  const ids = new Set<string>()
  for (const g of active) for (const id of MUSCLE_REGIONS[g] ?? []) ids.add(id)
  return ids
}

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
    tip: 'Control the eccentric (lowering) — that is where growth happens.',
    cue: 'Squeeze at the top for a 1-second peak contraction.',
  },
  triceps: {
    exercises: ['Triceps Pushdown', 'Close-Grip Bench', 'Dips', 'Overhead Extension'],
    tip: 'Keep elbows pinned during pushdowns — only forearms move.',
    cue: 'Straighten the arm fully at the bottom for peak contraction.',
  },
  forearms: {
    exercises: ['Hammer Curl', 'Wrist Curl', "Farmer's Walk"],
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
    cue: 'Squeeze your glutes at the top like you are cracking a walnut.',
  },
  calves: {
    exercises: ['Standing Calf Raise', 'Seated Calf Raise', 'Leg Press Calf'],
    tip: 'Full stretch at the bottom, peak contraction at the top.',
    cue: 'Slow 2-second eccentric; do not bounce.',
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
