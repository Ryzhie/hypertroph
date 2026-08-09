import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSettings } from './useSettings'
import { useProgress } from './useProgress'
import { currentTarget, type Instruction } from '../algorithm/progression'
import { todayKey, weekdayIndex } from '../utils/date'
import type { Exercise } from '../types/exercise'
import type { PlanDay, PlanSlot, Split } from '../types/split'
import type { ExerciseProgress } from '../types/progress'

export interface TodayEntry {
  slot: PlanSlot
  exercise: Exercise
  /** Effective plan values (slot override wins over exercise default). */
  eff: { sets: number; repsRange: [number, number]; restSeconds: number }
  progress?: ExerciseProgress
  target: Instruction
}

export interface TodayPlan {
  splitId?: string
  splitName?: string
  split?: Split
  day?: PlanDay
  dayName?: string
  isRestDay: boolean
  /** True when the user flipped the rest/workout state for today. */
  isOverridden: boolean
  entries: TodayEntry[]
  today: string
  weekdayName: string
  targetWeightUnit: 'kg' | 'lb'
}

const WEEKDAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Everything needed to render today's workout (or rest day). Reactive over Dexie. */
export function useTodayPlan(): TodayPlan {
  const { settings } = useSettings()
  const { progress } = useProgress()
  const splitsRaw = useLiveQuery(() => db.splits.toArray(), [])
  const exercisesRaw = useLiveQuery(() => db.exercises.toArray(), [])
  const splits = Array.isArray(splitsRaw) ? splitsRaw : []
  const exercises = Array.isArray(exercisesRaw) ? exercisesRaw : []

  const today = todayKey()
  const weekdayName = WEEKDAY_NAMES_FULL[weekdayIndex(today)]

  const split = splits.find((s) => s.id === settings?.splitId)
  const dayKey = split ? (split.schedule[weekdayIndex(today)] ?? null) : null
  const day = dayKey ? split?.days[dayKey] : undefined
  // Natural rest = no split, no day scheduled, or day flagged as rest.
  const naturalRest = !split || !day || day.isRest
  // User override: toggles the natural state (XOR).
  const overridden = (settings?.restDayOverrides?.includes(today) ?? false)
  const isRestDay = naturalRest !== overridden // false↔true XOR semantics
  const overriddenToday = naturalRest !== isRestDay

  const params = settings?.params
  const entries: TodayEntry[] = []
  // Populate entries if it's a natural workout day OR if the user flipped a rest day to workout.
  if (params && day && !isRestDay) {
    const sorted = [...day.exercises].sort((a, b) => a.order - b.order)
    for (const slot of sorted) {
      const exercise = exercises.find((e) => e.id === slot.exerciseId)
      if (!exercise) continue
      const eff = {
        sets: slot.sets ?? exercise.defaultSets,
        repsRange: slot.repsRange ?? exercise.defaultRepsRange,
        restSeconds: slot.restSeconds ?? exercise.defaultRestSeconds,
      }
      entries.push({
        slot,
        exercise,
        eff,
        progress: progress[exercise.id],
        target: currentTarget(
          progress[exercise.id],
          eff.repsRange,
          eff.sets,
          params,
          today,
          exercise.perHand === true,
        ),
      })
    }
  }

  return {
    splitId: split?.id,
    splitName: split?.name,
    split,
    day,
    dayName: day?.name,
    isRestDay,
    isOverridden: overriddenToday,
    entries,
    today,
    weekdayName,
    targetWeightUnit: settings?.weightUnit ?? 'kg',
  }
}
