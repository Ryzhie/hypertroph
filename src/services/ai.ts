/**
 * AI-assisted analysis — export a prompt, import the response.
 * NO AI is called from inside the app. The user copies the prompt into any
 * AI of their choice, gets the structured JSON back, and pastes it here.
 */

import type { BodyProfile } from '../types/settings'
import type { ExerciseProgress } from '../types/progress'
import type { WorkoutSession } from '../types/session'
import type { Exercise } from '../types/exercise'
import type { ParsedAiInsight } from '../types/ai'
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from '../types/exercise'

export interface AiPromptInput {
  body?: BodyProfile
  progress: Record<string, ExerciseProgress>
  sessions: WorkoutSession[]
  exercises: Exercise[]
  weightUnit: 'kg' | 'lb'
}

/** Build the structured markdown prompt the user pastes into an AI. */
export function buildAiPrompt(input: AiPromptInput): string {
  const { body, progress, sessions, exercises, weightUnit } = input
  const recent14 = sessions.filter(
    (s) => s.status === 'completed' && s.dateKey >= daysAgo(14),
  )

  const lines: string[] = []
  lines.push('# HyperTroph AI Analysis Prompt\n')
  lines.push('Analyze the following training data and respond with ONLY a JSON object matching the schema below.\n')

  if (body) {
    lines.push('## Body Profile')
    lines.push(`- Sex: ${body.sex}`)
    lines.push(`- Age: ${body.ageYears} years`)
    lines.push(`- Height: ${body.heightCm} cm`)
    lines.push(`- Body weight: ${body.bodyWeightKg} kg`)
    if (body.bodyFatPct != null) lines.push(`- Body fat: ${body.bodyFatPct}%`)
    lines.push(`- Activity level: ${body.activityLevel}`)
    lines.push(`- Goal: ${body.goal}`)
    lines.push(`- Experience: ${body.experience}`)
    lines.push('')
  }

  // Recent sessions summary
  if (recent14.length > 0) {
    lines.push('## Recent Sessions (last 14 days)')
    lines.push('| Date | Day | Exercises |')
    lines.push('|------|-----|-----------|')
    for (const s of recent14.slice(0, 10)) {
      const exNames = s.logs.map((l) => l.exerciseName).join(', ')
      lines.push(`| ${s.dateKey} | ${s.dayName} | ${exNames} |`)
    }
    lines.push('')
  }

  // Per-exercise progress table
  const withProgress = Object.values(progress)
  if (withProgress.length > 0) {
    lines.push('## Exercise Progress')
    lines.push('| Exercise | Current | At Weight | Streak | e1RM Best | Last Date |')
    lines.push('|----------|---------|-----------|--------|-----------|-----------|')
    for (const p of withProgress) {
      const ex = exercises.find((e) => e.id === p.exerciseId)
      const name = ex?.name ?? p.exerciseId
      const cur = `${p.weightKg} ${weightUnit}`
      lines.push(
        `| ${name} | ${cur} | ${p.sessionsAtWeight} | ${p.stallStreak} | ${p.e1rmBest.toFixed(1)} | ${p.lastSessionDate ?? '—'} |`,
      )
    }
    lines.push('')
  }

  // Top-set / e1RM bests per exercise from history
  if (withProgress.length > 0) {
    lines.push('## e1RM History (recent)')
    for (const p of withProgress) {
      const ex = exercises.find((e) => e.id === p.exerciseId)
      const name = ex?.name ?? p.exerciseId
      const last5 = p.e1rmHistory.slice(-5).map((h) => `${h.date}: ${h.e1rm.toFixed(1)}`)
      if (last5.length > 0) {
        lines.push(`- ${name}: ${last5.join(', ')}`)
      }
    }
    lines.push('')
  }

  // Training volume per muscle group
  const muscleVol: Record<MuscleGroup, number> = {
    chest: 0, back: 0, shoulders: 0, biceps: 0, triceps: 0,
    forearms: 0, legs: 0, glutes: 0, calves: 0, core: 0, full: 0,
  }
  for (const s of recent14) {
    for (const log of s.logs) {
      const ex = exercises.find((e) => e.id === log.exerciseId)
      const sides = log.perHand ? 2 : 1
      const vol = log.sets.reduce((sum, set) => sum + set.weightKg * sides * set.reps, 0)
      for (const g of ex?.muscleGroups ?? []) muscleVol[g] += vol
    }
  }
  const volLines = Object.entries(muscleVol)
    .filter(([, v]) => v > 0)
    .map(([g, v]) => `  - ${MUSCLE_GROUP_LABELS[g as MuscleGroup]}: ${v.toFixed(0)} ${weightUnit}·r`)
  if (volLines.length > 0) {
    lines.push('## Training Volume by Muscle (14 days)')
    lines.push(volLines.join('\n'))
    lines.push('')
  }

  lines.push('---\n')
  lines.push('## Response Schema')
  lines.push('```json')
  lines.push(JSON.stringify(RESPONSE_SCHEMA_EXAMPLE, null, 2))
  lines.push('```')
  lines.push('')
  lines.push('Respond with ONLY the JSON object — no markdown fences, no extra text.')

  return lines.join('\n')
}

/** Validate raw pasted text into a parsed insight, or throw with reason. */
export function parseAiResponse(text: string): ParsedAiInsight {
  const trimmed = text.trim()
  // Strip markdown fences if user pasted with them.
  const stripped = trimmed.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
  let obj: unknown
  try {
    obj = JSON.parse(stripped)
  } catch {
    throw new Error('Not valid JSON.')
  }
  if (typeof obj !== 'object' || obj === null) throw new Error('Expected a JSON object.')
  const o = obj as Record<string, unknown>
  if (typeof o.overall !== 'string') throw new Error('Missing "overall" string.')
  if (!['low', 'medium', 'high'].includes(o.fatigue as string))
    throw new Error('"fatigue" must be low, medium, or high.')
  if (!['slow', 'steady', 'fast'].includes(o.progressRate as string))
    throw new Error('"progressRate" must be slow, steady, or fast.')
  if (!Array.isArray(o.strengths) || !Array.isArray(o.risks))
    throw new Error('"strengths" and "risks" must be arrays.')
  if (!Array.isArray(o.recommendations))
    throw new Error('"recommendations" must be an array of {area, advice}.')

  return {
    overall: o.overall as string,
    fatigue: o.fatigue as 'low' | 'medium' | 'high',
    progressRate: o.progressRate as 'slow' | 'steady' | 'fast',
    strengths: o.strengths as string[],
    risks: o.risks as string[],
    recommendations: o.recommendations as ParsedAiInsight['recommendations'],
    macros:
      o.macros && typeof o.macros === 'object'
        ? (o.macros as ParsedAiInsight['macros'])
        : undefined,
    deloadSuggested: o.deloadSuggested === true,
    notes: typeof o.notes === 'string' ? o.notes : undefined,
  }
}

const RESPONSE_SCHEMA_EXAMPLE = {
  overall: 'Brief assessment of training status',
  fatigue: 'low',
  progressRate: 'steady',
  strengths: ['Consistent bench press progression'],
  risks: ['Shoulders may need more volume for balance'],
  recommendations: [
    { area: 'training', advice: 'Add one more back session per week' },
    { area: 'nutrition', advice: 'Increase protein to 2g/kg' },
  ],
  macros: { calories: 2600, proteinG: 164, carbsG: 325, fatG: 87 },
  deloadSuggested: false,
  notes: '',
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
