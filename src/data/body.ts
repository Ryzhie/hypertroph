import type { MuscleGroup } from '../types/exercise'

/**
 * Muscle-map regions for the front/back body SVG.
 *
 * Each region is authored on the LEFT half of a 240×440 viewBox and mirrored
 * to the right side by the BodyMap component, so shapes are symmetric by
 * construction. `view: 'both'` regions (forearms, calves) appear on both sides
 * of the figure. `deco` regions (head, feet) are non-muscle.
 */
export interface BodyRegion {
  id: string
  view: 'front' | 'back' | 'both'
  d: string
  deco?: boolean
  /** Centered shapes (abs, head) render once — no right-side mirror. */
  centered?: boolean
}

export const BODY_REGIONS: BodyRegion[] = [
  // --- front ---
  { id: 'head', view: 'front', d: 'M120 6 a20 24 0 1 0 0.1 0 Z', deco: true },
  {
    id: 'chest',
    view: 'front',
    d: 'M78 88 C92 80 108 84 114 94 L112 160 C104 168 84 164 78 152 C76 120 76 100 78 88 Z',
  },
  {
    id: 'delt',
    view: 'front',
    d: 'M66 86 C58 72 70 62 84 66 C92 68 97 76 94 88 C84 94 72 94 66 86 Z',
  },
  {
    id: 'biceps',
    view: 'front',
    d: 'M88 96 C82 104 78 120 78 136 L92 140 C92 120 94 104 100 96 Z',
  },
  {
    id: 'abs',
    view: 'front',
    centered: true,
    d: 'M102 150 C106 148 134 148 138 150 L140 208 L100 208 Z',
  },
  // --- back ---
  {
    id: 'traps',
    view: 'back',
    centered: true,
    d: 'M80 74 C98 64 142 64 160 74 L158 90 C140 80 100 80 82 90 Z',
  },
  {
    id: 'lat',
    view: 'back',
    d: 'M78 118 C72 148 74 180 84 204 L108 196 C102 166 102 138 106 118 Z',
  },
  {
    id: 'triceps',
    view: 'back',
    d: 'M88 96 C78 106 72 122 72 138 L86 142 C86 122 90 106 98 96 Z',
  },
  {
    id: 'glute',
    view: 'back',
    d: 'M92 200 C86 220 88 236 94 246 L118 242 C116 226 114 208 110 200 Z',
  },
  {
    id: 'ham',
    view: 'back',
    d: 'M92 244 C88 270 86 292 90 308 L116 308 C114 284 112 262 108 244 Z',
  },
  // --- both sides ---
  {
    id: 'forearm',
    view: 'both',
    d: 'M74 142 C68 158 64 178 68 198 L82 194 C78 176 80 156 84 142 Z',
  },
  {
    id: 'quad',
    view: 'front',
    d: 'M94 206 C88 240 86 268 90 298 L116 298 C116 262 114 232 110 206 Z',
  },
  {
    id: 'calf',
    view: 'both',
    d: 'M88 306 C84 338 86 360 92 380 L116 376 C114 354 112 332 110 306 Z',
  },
]

/** Decorative silhouette pieces (head, feet) for each view. */
export const BODY_DECO: Record<'front' | 'back', string[]> = {
  front: ['head', 'foot'],
  back: ['head', 'foot'],
}

const FOOT_PATH = 'M86 384 L114 382 L116 394 L84 396 Z'

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
  if (active.has('full')) {
    return new Set(MUSCLE_REGIONS.full)
  }
  const ids = new Set<string>()
  for (const g of active) for (const id of MUSCLE_REGIONS[g] ?? []) ids.add(id)
  return ids
}

/** Get the region definition (with the foot path filled in) by id. */
export function regionById(id: string): BodyRegion | undefined {
  if (id === 'foot') return { id: 'foot', view: 'both', d: FOOT_PATH, deco: true }
  return BODY_REGIONS.find((r) => r.id === id)
}
