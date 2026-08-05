import { db } from '../db/db'
import { evaluateSession, type Instruction } from '../algorithm/progression'
import { ladderFor } from '../algorithm/plates'
import type { Exercise } from '../types/exercise'
import type { PlanDay, PlanSlot, Split } from '../types/split'
import type { WorkoutExerciseLog, WorkoutSession, WorkoutSet } from '../types/session'
import type { ExerciseProgress, TopSetInfo } from '../types/progress'
import type { StoredSettings } from '../db/db'

export interface FinishWorkoutInput {
  split: Split
  day: PlanDay
  logs: WorkoutExerciseLog[]
  exercises: Exercise[]
  settings: StoredSettings
  dateKey: string
}

export interface FinishedExercise {
  exerciseId: string
  progress: ExerciseProgress
  instruction: Instruction
}

/** Result of running the engine over a completed session, per exercise. */
export interface FinishWorkoutResult {
  session: WorkoutSession
  results: FinishedExercise[]
}

function effective(slot: PlanSlot, exercise: Exercise) {
  return {
    sets: slot.sets ?? exercise.defaultSets,
    repsRange: slot.repsRange ?? exercise.defaultRepsRange,
    restSeconds: slot.restSeconds ?? exercise.defaultRestSeconds,
  }
}

/** First set at the session's max weight = the top set (warmups excluded by definition). */
export function computeTopSet(sets: WorkoutSet[]): TopSetInfo | null {
  if (sets.length === 0) return null
  const maxWeight = Math.max(...sets.map((s) => s.weightKg))
  const top = sets.find((s) => s.weightKg === maxWeight)!
  return { weightKg: top.weightKg, reps: top.reps, rpe: top.rpe }
}

export function createEmptyProgress(
  exerciseId: string,
  weightKg: number,
  repsRange: [number, number],
  isNovice: boolean,
): ExerciseProgress {
  return {
    exerciseId,
    weightKg,
    repsRange: [repsRange[0], repsRange[1]],
    sessionsAtWeight: 0,
    stallStreak: 0,
    e1rmBest: 0,
    e1rmHistory: [],
    isNovice,
  }
}

/**
 * Complete a workout: run the overload engine for every logged exercise,
 * persist updated progress, and write the completed session — one transaction.
 * Only exercises with at least one logged set are evaluated.
 */
export async function finishWorkout(input: FinishWorkoutInput): Promise<FinishWorkoutResult> {
  const { split, day, logs, exercises, settings, dateKey } = input
  const params = settings.params
  const byId = new Map(exercises.map((e) => [e.id, e]))

  const existing = await db.progress.bulkGet(logs.map((l) => l.exerciseId))

  const results: FinishedExercise[] = []
  const progressWrites: ExerciseProgress[] = []

  for (const log of logs) {
    const exercise = byId.get(log.exerciseId)
    if (!exercise) continue
    const topSet = computeTopSet(log.sets)
    if (!topSet) continue

    const slot = day.exercises.find((s) => s.exerciseId === log.exerciseId)
    const eff = slot ? effective(slot, exercise) : {
      sets: exercise.defaultSets,
      repsRange: exercise.defaultRepsRange,
      restSeconds: exercise.defaultRestSeconds,
    }

    const prev = existing[logs.indexOf(log)]
    const progress =
      prev ??
      createEmptyProgress(
        log.exerciseId,
        topSet.weightKg,
        eff.repsRange,
        params.isNovice,
      )

    const { progress: next, instruction } = evaluateSession(
      {
        progress,
        topSet,
        dateKey,
        effectiveRepsRange: eff.repsRange,
        sets: eff.sets,
        isBodyweight: exercise.isBodyweight === true,
        isNovice: progress.isNovice ?? params.isNovice,
        ladder: ladderFor(exercise, params.incrementKg),
      },
      params,
    )
    progressWrites.push(next)
    results.push({ exerciseId: log.exerciseId, progress: next, instruction })
  }

  const session: WorkoutSession = {
    id: crypto.randomUUID(),
    dateKey,
    splitId: split.id,
    splitName: split.name,
    dayKey: day.id,
    dayName: day.name,
    status: 'completed',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    logs,
  }

  await db.transaction('rw', [db.progress, db.sessions], async () => {
    await db.progress.bulkPut(progressWrites)
    await db.sessions.add(session)
  })

  return { session, results }
}
