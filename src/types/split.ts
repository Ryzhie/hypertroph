/** A per-exercise entry inside a plan day. Overrides fall back to the Exercise defaults. */
export interface PlanSlot {
  exerciseId: string
  order: number
  sets?: number
  repsRange?: [number, number]
  restSeconds?: number
  /** Target RPE for working sets; used for instruction output. */
  rpeTarget?: number
}

export interface PlanDay {
  id: string
  name: string
  isRest: boolean
  exercises: PlanSlot[]
}

/**
 * A workout split. `schedule` maps weekday → dayKey:
 * index = Date.getDay() (0 = Sunday … 6 = Saturday), value = a PlanDay id, or null for no workout.
 */
export interface Split {
  id: string
  name: string
  /** Presets are starting templates the user can duplicate/edit; just a label. */
  template: boolean
  schedule: (string | null)[]
  days: Record<string, PlanDay>
}

export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export function dayKeyForWeekday(weekdayIndex: number, split: Split): string | null {
  return split.schedule[weekdayIndex] ?? null
}
