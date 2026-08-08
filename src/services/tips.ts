/**
 * Rule-based recommendation engine. No AI — a bank of deterministic rules
 * that read body metrics + training history and emit actionable tips.
 * Each rule is a pure function over the shared `TipInput`; rules that don't
 * apply return null.
 */

import type { BodyProfile } from '../types/settings'
import type { ExerciseProgress } from '../types/progress'
import type { WorkoutSession } from '../types/session'
import type { Exercise, MuscleGroup } from '../types/exercise'
import type { AlgorithmParams } from '../types/settings'
import { MUSCLE_GROUP_LABELS } from '../types/exercise'

export interface TipInput {
  body?: BodyProfile
  progress: Record<string, ExerciseProgress>
  sessions: WorkoutSession[]
  exercises: Exercise[]
  params: AlgorithmParams
  today: string
}

export interface Tip {
  id: string
  /** Short headline shown as the primary text. */
  headline: string
  /** Longer context (optional). */
  detail?: string
  /** Accent chip: 'good' | 'warn' | 'accent' | 'info' */
  accent: 'good' | 'warn' | 'accent' | 'info'
}

const MAX_TIPS = 5

/** Return a short, prioritised list of tips. */
export function generateTips(input: TipInput): Tip[] {
  const tips: Tip[] = []
  for (const rule of RULES) {
    const t = rule(input)
    if (t) tips.push(t)
    if (tips.length >= MAX_TIPS) break
  }
  return tips
}

// -------------------------------------------------------------------
// Individual rules
// -------------------------------------------------------------------

const RULES: ((input: TipInput) => Tip | null)[] = [
  // 1. No body profile set → nudge
  (i) => {
    if (i.body) return null
    return {
      id: 'no-body',
      headline: 'Add your body profile',
      detail: 'Height, weight, and body fat help tailor recommendations and unlock the AI analysis prompt.',
      accent: 'accent',
    }
  },

  // 2. No workouts logged yet
  (i) => {
    if (i.sessions.length > 0) return null
    return {
      id: 'first-session',
      headline: 'Start your first session',
      detail: 'Head to Today and log your first workout. The engine will start tracking your progression.',
      accent: 'info',
    }
  },

  // 3. Stalled exercises
  (i) => {
    const stalled = Object.values(i.progress).filter(
      (p) => p.stallStreak >= i.params.sessionsBeforeDeload,
    )
    if (stalled.length === 0) return null
    const names = stalled.slice(0, 2).map((p) => exName(p.exerciseId, i.exercises)).join(', ')
    return {
      id: 'stalled',
      headline: `Stall detected on ${names}${stalled.length > 2 ? ` +${stalled.length - 2}` : ''}`,
      detail: 'The engine will automatically deload these — keep grinding.',
      accent: 'warn',
    }
  },

  // 4. Consider deload (e1rm drop)
  (i) => {
    const dips = Object.values(i.progress).filter((p) => p.suggestDeload)
    if (dips.length === 0) return null
    const names = dips.slice(0, 2).map((p) => exName(p.exerciseId, i.exercises)).join(', ')
    return {
      id: 'deload-suggest',
      headline: `e1RM dipped on ${names}`,
      detail: 'A light deload week may help you rebound stronger.',
      accent: 'warn',
    }
  },

  // 5. Consistency check (last 14 days)
  (i) => {
    if (i.sessions.length === 0) return null
    const cutoff = addDays(i.today, -14)
    const recent = i.sessions.filter((s) => s.dateKey >= cutoff && s.status === 'completed')
    const pct = Math.round((recent.length / 14) * 100)
    if (pct >= 50) {
      return {
        id: 'consistency-good',
        headline: `${pct}% consistency over the last 2 weeks`,
        detail: `${recent.length} sessions in 14 days — solid consistency.`,
        accent: 'good',
      }
    }
    return {
      id: 'consistency-low',
      headline: `${pct}% consistency — room to improve`,
      detail: `Only ${recent.length} sessions in the last 2 weeks. Aim for 3–5.`,
      accent: 'accent',
    }
  },

  // 6. Undertrained muscle groups
  (i) => {
    if (i.sessions.length === 0 || Object.keys(i.progress).length === 0) return null
    const cutoff = addDays(i.today, -14)
    const recent = i.sessions.filter((s) => s.dateKey >= cutoff)
    const trainedMuscles = new Set<MuscleGroup>()
    for (const s of recent) {
      for (const log of s.logs) {
        const ex = i.exercises.find((e) => e.id === log.exerciseId)
        for (const g of ex?.muscleGroups ?? []) trainedMuscles.add(g)
      }
    }
    const key: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'glutes']
    const missing = key.filter((g) => !trainedMuscles.has(g) && g !== 'full')
    if (missing.length === 0) return null
    const labels = missing.map((g) => MUSCLE_GROUP_LABELS[g]).join(', ')
    return {
      id: 'undertrained',
      headline: `Not trained recently: ${labels}`,
      detail: 'Aim to hit each major group at least once per week.',
      accent: 'accent',
    }
  },

  // 7. e1RM PR in last session
  (i) => {
    const prs = Object.values(i.progress).filter(
      (p) => p.e1rmBestDate === i.sessions[0]?.dateKey,
    )
    if (prs.length === 0) return null
    const ex = i.exercises.find((e) => e.id === prs[0].exerciseId)
    const ph = ex?.perHand === true
    return {
      id: 'pr',
      headline: `New e1RM best on ${ex?.name ?? prs[0].exerciseId}${prs.length > 1 ? ` +${prs.length - 1} more` : ''}.`,
      detail: `${fmtWeight(prs[0].e1rmBest, ph)} — keep pushing.`,
      accent: 'good',
    }
  },

  // 8. Bodyweight not logged recently
  (i) => {
    if (!i.body?.bodyWeightKg) return null
    // "Not logged recently" — if last session is >21 days ago we can't know.
    // Simple heuristic: if the profile was created recently, no issue.
    return null // skip for now — no bodyweight tracking history yet.
  },

  // 9. Reps below range last session
  (i) => {
    if (i.sessions.length === 0) return null
    const last = i.sessions[0]
    const issues: string[] = []
    for (const log of last.logs) {
      const p = i.progress[log.exerciseId]
      if (!p) continue
      const topSet = [...log.sets].sort((a, b) => b.weightKg - a.weightKg)[0]
      if (!topSet) continue
      if (topSet.reps < p.repsRange[0]) {
        issues.push(exName(log.exerciseId, i.exercises))
      }
    }
    if (issues.length === 0) return null
    return {
      id: 'reps-low',
      headline: `Below rep range: ${issues.join(', ')}`,
      detail: 'Reduce weight slightly next session to stay within your target range.',
      accent: 'warn',
    }
  },

  // 10. Body fat assessment
  (i) => {
    if (!i.body?.bodyFatPct || !i.body.goal) return null
    const { bodyFatPct, goal } = i.body
    if (goal === 'muscle-gain' && bodyFatPct > 25) {
      return {
        id: 'bf-high-muscle',
        headline: `Body fat ${bodyFatPct}% — consider a recomp`,
        detail: 'A small caloric deficit while maintaining high protein can build muscle while leaning out.',
        accent: 'accent',
      }
    }
    if (goal === 'lose-fat' && bodyFatPct < 15) {
      return {
        id: 'bf-low-cut',
        headline: `Body fat ${bodyFatPct}% — cutting may be unnecessary`,
        detail: 'You may already be at a healthy body fat level for your goal.',
        accent: 'good',
      }
    }
    return null
  },
]

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function exName(id: string, exercises: Exercise[]): string {
  return exercises.find((e) => e.id === id)?.name ?? id
}

function fmtWeight(e1rmKg: number, perHand = false): string {
  const v = Math.round(e1rmKg * 10) / 10
  const num = Number.isInteger(v) ? `${v} kg` : `${v.toFixed(1)} kg`
  return perHand ? `${num} per hand` : num
}

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}
