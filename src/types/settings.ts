export type WeightUnit = 'kg' | 'lb'
export type WeekStart = 'sunday' | 'monday'

/**
 * All knobs of the progressive-overload engine. Weights are canonical kg;
 * `weightUnit` is purely a display/input conversion.
 */
export interface AlgorithmParams {
  /** Weight increase when the top of the rep range is hit (kg). Also the ladder step. */
  incrementKg: number
  /** Consecutive top-of-range hits required before increasing (default 1). */
  hitsToProgress: number
  /** Consecutive poor sessions before an automatic deload week. */
  sessionsBeforeDeload: number
  /** How much to cut weight for a deload (fraction, e.g. 0.1 = 10%). */
  deloadPct: number
  /** Sets rated at/above this RPE block an increase ("grinder" gate). */
  minRpeForStall: number
  /** Target RPE shown in instructions. */
  rpeTarget: number
  /** E1RM-drop deload nudge threshold (fraction of windowed best). */
  e1rmDropDeloadPct: number
  /** Sessions to average for the smoothed E1RM signal. */
  e1rmSmoothingWindow: number
  /** Sessions considered for the rolling E1RM best. */
  e1rmBestWindow: number
  /** Days without a session before the gap guard resets the stall streak. */
  gapDaysThreshold: number
  /** Newbie boost: double the increase when the top set was easy. */
  isNovice: boolean
}

export interface Settings {
  splitId: string
  weekStart: WeekStart
  params: AlgorithmParams
}

export const DEFAULT_PARAMS: AlgorithmParams = {
  incrementKg: 2.5,
  hitsToProgress: 1,
  sessionsBeforeDeload: 2,
  deloadPct: 0.1,
  minRpeForStall: 9,
  rpeTarget: 8,
  e1rmDropDeloadPct: 0.05,
  e1rmSmoothingWindow: 3,
  e1rmBestWindow: 8,
  gapDaysThreshold: 10,
  isNovice: true,
}
