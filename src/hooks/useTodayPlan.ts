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
  const splits = useLiveQuery(() => db.splits.toArray(), []) ?? []
  const exercises = useLiveQuery(() => db.exercises.toArray(), []) ?? []

  const today = todayKey()
  const weekdayName = WEEKDAY_NAMES_FULL[weekdayIndex(today)]

  const split = splits.find((s) => s.id === settings?.splitId)
  const dayKey = split ? (split.schedule[weekdayIndex(today)] ?? null) : null
  const day = dayKey ? split?.days[dayKey] : undefined
  const isRestDay = !split || !day || day.isRest

  const params = settings?.params
  const entries: TodayEntry[] = []
  if (params && day && !day.isRest) {
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
        target: currentTarget(progress[exercise.id], eff.repsRange, eff.sets, params, today),
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
    entries,
    today,
    weekdayName,
    targetWeightUnit: settings?.weightUnit ?? 'kg',
  }
}
