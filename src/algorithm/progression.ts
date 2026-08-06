import { epley1rm, smoothedE1rm, windowedBest, E1RM_HISTORY_CAP } from './e1rm'
import { roundIncrease, roundDeload } from './plates'
import { daysBetween } from '../utils/date'
import type { ExerciseProgress, TopSetInfo } from '../types/progress'
import type { AlgorithmParams } from '../types/settings'

export type InstructionMode =
  | 'increase'
  | 'hold'
  | 'hold-high-rpe'
  | 'deload'
  | 're-acclimate'
  | 'range-bump'
  // Display-only modes (from currentTarget, not a session evaluation):
  | 'new'
  | 'deload-suggested'
  | 'target'

/** What the user should do NEXT session for this exercise. */
export interface Instruction {
  mode: InstructionMode
  weightKg: number
  repsRange: [number, number]
  sets: number
  rpeTarget: number
  message: string
  suggestDeload: boolean
}

const makeInstruction = (
  mode: InstructionMode,
  weightKg: number,
  repsRange: [number, number],
  sets: number,
  rpeTarget: number,
  message: string,
  suggestDeload = false,
): Instruction => ({ mode, weightKg, repsRange, sets, rpeTarget, message, suggestDeload })

export interface EvaluateInput {
  progress: ExerciseProgress
  /** First set at the session's max weight for this exercise. */
  topSet: TopSetInfo
  dateKey: string
  /** Effective rep range (plan slot override wins over exercise default). */
  effectiveRepsRange: [number, number]
  sets: number
  isBodyweight: boolean
  /** Dumbbells: weights are per hand; messages say "per hand". */
  isPerHand?: boolean
  isNovice: boolean
  ladder: number[]
}

export interface EvaluateResult {
  progress: ExerciseProgress
  instruction: Instruction
}

const sameRange = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1]

/**
 * Pure rule engine. Given one exercise's carried state and today's top set,
 * returns the updated state plus what to do next session. No I/O, no randomness.
 */
export function evaluateSession(
  input: EvaluateInput,
  params: AlgorithmParams,
): EvaluateResult {
  const {
    progress,
    topSet,
    dateKey,
    effectiveRepsRange,
    sets,
    isBodyweight,
    isPerHand = false,
    isNovice,
    ladder,
  } = input

  const w = (kg: number) => (isPerHand ? `${kg} kg per hand` : `${kg} kg`)
  const p: ExerciseProgress = { ...progress, e1rmHistory: [...progress.e1rmHistory] }
  p.lastSessionDate = dateKey
  p.lastTopSet = { weightKg: topSet.weightKg, reps: topSet.reps, rpe: topSet.rpe }
  p.suggestDeload = false

  // --- E1RM bookkeeping (always, bounded) ---
  const e1rm = epley1rm(topSet.weightKg, topSet.reps)
  p.e1rmHistory.push({ date: dateKey, e1rm })
  if (p.e1rmHistory.length > E1RM_HISTORY_CAP) {
    p.e1rmHistory = p.e1rmHistory.slice(-E1RM_HISTORY_CAP)
  }
  const best = windowedBest(p.e1rmHistory, params.e1rmBestWindow)
  if (best > p.e1rmBest) {
    p.e1rmBest = best
    p.e1rmBestDate = dateKey
  }

  // --- Rep-range change: adopt the slot's range, reset counters, re-evaluate ---
  // A session right after a range change never counts as a stall (the goalposts moved).
  let rangeChanged = false
  if (!sameRange(effectiveRepsRange, p.repsRange)) {
    p.repsRange = [effectiveRepsRange[0], effectiveRepsRange[1]]
    p.stallStreak = 0
    p.sessionsAtWeight = 0
    rangeChanged = true
  }

  const instr = (
    mode: InstructionMode,
    weightKg: number,
    repsRange: [number, number],
    rpeTarget: number,
    message: string,
    suggestDeload = false,
  ): Instruction => makeInstruction(mode, weightKg, repsRange, sets, rpeTarget, message, suggestDeload)

  // --- Gap guard: a layoff is never a stall ---
  if (
    progress.lastSessionDate &&
    daysBetween(progress.lastSessionDate, dateKey) > params.gapDaysThreshold
  ) {
    p.stallStreak = 0
    return {
      progress: p,
      instruction: instr(
        're-acclimate',
        p.weightKg,
        p.repsRange,
        params.rpeTarget,
        `Back after a break — re-acclimate. Same ${w(p.weightKg)}, ` +
          `${p.repsRange[0]}–${p.repsRange[1]} reps, keep it smooth.`,
      ),
    }
  }

  // --- Automatic deload: triggered by the INCOMING stall streak ---
  if (progress.stallStreak >= params.sessionsBeforeDeload) {
    const newW = isBodyweight ? p.weightKg : roundDeload(ladder, p.weightKg, params.deloadPct)
    p.weightKg = newW
    p.stallStreak = 0
    p.sessionsAtWeight = 0
    p.deloadedAt = dateKey
    const msg = isBodyweight
      ? 'Deload week — easy sets, fewer reps, no grind. Reset and rebuild.'
      : `Deload week — drop to ${w(newW)}, ${p.repsRange[0]}–${p.repsRange[1]} reps, ` +
        `keep it easy (RPE ~6). Reset and rebuild.`
    return { progress: p, instruction: instr('deload', newW, p.repsRange, 6, msg) }
  }

  // --- E1RM-drop deload: informational nudge only, never automatic ---
  const smooth = smoothedE1rm(p.e1rmHistory, params.e1rmSmoothingWindow)
  const winBest = windowedBest(p.e1rmHistory, params.e1rmBestWindow)
  if (smooth !== null && smooth < winBest * (1 - params.e1rmDropDeloadPct)) {
    p.suggestDeload = true
  }

  // --- Normal progression ---
  const { reps, rpe } = topSet
  const [lo, hi] = p.repsRange

  if (isBodyweight) {
    if (reps >= hi) {
      const newRange: [number, number] = [lo + 4, hi + 4]
      p.repsRange = newRange
      p.stallStreak = 0
      p.sessionsAtWeight = 0
      return {
        progress: p,
        instruction: instr(
          'range-bump',
          0,
          newRange,
          params.rpeTarget,
          `Easily hit ${hi}+ reps — rep goal moves to ${newRange[0]}–${newRange[1]}.`,
        ),
      }
    }
    if (reps >= lo) {
      p.stallStreak = 0
      p.sessionsAtWeight += 1
      return {
        progress: p,
        instruction: instr(
          'hold',
          0,
          p.repsRange,
          params.rpeTarget,
          `Good — ${reps} reps. Work toward ${hi}; you progress at ${hi}+.`,
        ),
      }
    }
    p.stallStreak += 1
    return {
      progress: p,
      instruction: instr(
        'hold',
        0,
        p.repsRange,
        params.rpeTarget,
        `Below ${lo} reps. Repeat — aim for at least ${lo}.`,
      ),
    }
  }

  // Weighted exercise.
  if (reps >= hi) {
    const grindy = rpe != null && rpe >= params.minRpeForStall
    if (grindy) {
      p.stallStreak = 0
      p.sessionsAtWeight += 1
      return {
        progress: p,
        instruction: instr(
          'hold-high-rpe',
          p.weightKg,
          p.repsRange,
          params.rpeTarget,
          `Hit ${reps} reps but it was a grinder (RPE ${rpe}). Repeat at ${w(p.weightKg)}, ` +
            `keep RPE ≤ ${params.rpeTarget}.`,
        ),
      }
    }
    if (p.sessionsAtWeight + 1 >= params.hitsToProgress) {
      const boost = isNovice && rpe != null && rpe <= 7 ? 2 : 1
      const newW = roundIncrease(ladder, p.weightKg, params.incrementKg * boost)
      p.weightKg = newW
      p.stallStreak = 0
      p.sessionsAtWeight = 0
      const mult = boost === 2 ? ' (newbie boost)' : ''
      return {
        progress: p,
        instruction: instr(
          'increase',
          newW,
          p.repsRange,
          params.rpeTarget,
          `Hit ${reps}/${hi} — increase to ${w(newW)}${mult}. Aim for ${lo}–${hi} reps, ` +
            `RPE ~${params.rpeTarget}.`,
        ),
      }
    }
    p.sessionsAtWeight += 1
    return {
      progress: p,
      instruction: instr(
        'hold',
        p.weightKg,
        p.repsRange,
        params.rpeTarget,
        `Hit ${reps}/${hi} — confirm once more, then we increase.`,
      ),
    }
  }

  if (reps >= lo) {
    p.stallStreak = 0
    p.sessionsAtWeight += 1
    return {
      progress: p,
      instruction: instr(
        'hold',
        p.weightKg,
        p.repsRange,
        params.rpeTarget,
        `${reps} reps at ${w(p.weightKg)}. Keep working up to ${hi}; you progress at ${hi}+.`,
      ),
    }
  }

  if (isNovice && rpe != null && rpe <= 6 && reps >= lo - 1) {
    const newW = roundIncrease(ladder, p.weightKg, params.incrementKg)
    p.weightKg = newW
    p.stallStreak = 0
    p.sessionsAtWeight = 0
    return {
      progress: p,
      instruction: instr(
        'increase',
        newW,
        p.repsRange,
        params.rpeTarget,
        `Only ${reps} reps but it felt easy (RPE ${rpe}) — bump to ${w(newW)}.`,
      ),
    }
  }

  if (rangeChanged) {
    return {
      progress: p,
      instruction: instr(
        'hold',
        p.weightKg,
        p.repsRange,
        params.rpeTarget,
        `Rep goal changed to ${lo}–${hi}. Settle in — hit at least ${lo} next time.`,
      ),
    }
  }
  p.stallStreak += 1
  return {
    progress: p,
    instruction: instr(
      'hold',
      p.weightKg,
      p.repsRange,
      params.rpeTarget,
      `Only ${reps} reps — below your ${lo}-rep floor. Stay at ${w(p.weightKg)}, ` +
        `try to hit ${lo}.`,
    ),
  }
}

/**
 * What to show on the Today screen BEFORE a session: the standing target for
 * the next time this exercise comes up. Derived from carried progress + plan,
 * never mutates anything.
 */
export function currentTarget(
  progress: ExerciseProgress | undefined,
  effectiveRepsRange: [number, number],
  sets: number,
  params: AlgorithmParams,
  dateKey: string,
  isPerHand = false,
): Instruction {
  if (!progress) {
    return makeInstruction(
      'new',
      0,
      effectiveRepsRange,
      sets,
      params.rpeTarget,
      'First time — pick a weight and log your first set.',
    )
  }
  if (progress.deloadedAt && daysBetween(progress.deloadedAt, dateKey) <= 7) {
    return makeInstruction(
      'deload',
      progress.weightKg,
      progress.repsRange,
      sets,
      6,
      'Deload week — keep it light (RPE ~6), then rebuild.',
    )
  }
  if (progress.suggestDeload) {
    return makeInstruction(
      'deload-suggested',
      progress.weightKg,
      progress.repsRange,
      sets,
      params.rpeTarget,
      'Strength has dipped — consider a light week.',
      true,
    )
  }
  if (
    progress.lastSessionDate &&
    daysBetween(progress.lastSessionDate, dateKey) > params.gapDaysThreshold
  ) {
    return makeInstruction(
      're-acclimate',
      progress.weightKg,
      progress.repsRange,
      sets,
      params.rpeTarget,
      'Back after a break — same weight, smooth reps.',
    )
  }
  const w = (kg: number) => (isPerHand ? `${kg} kg per hand` : `${kg} kg`)
  return makeInstruction(
    'target',
    progress.weightKg,
    progress.repsRange,
    sets,
    params.rpeTarget,
    `Lift ${w(progress.weightKg)} for ${progress.repsRange[0]}–${progress.repsRange[1]} reps, ` +
      `RPE ~${params.rpeTarget}.`,
  )
}
