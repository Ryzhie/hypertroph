/**
 * AI-assisted analysis — export a structured prompt, import the response.
 * NO AI is called from inside the app. The user copies the prompt into any
 * AI (Claude, GPT, Gemini…), gets structured JSON back, and pastes it here.
 * The prompt asks the AI what mode the user wants: analysis, advice, or
 * structured workout plan generation.
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

/**
 * Build the full structured prompt the user pastes into an AI.
 * Includes interactive mode selection so the AI knows what to output.
 */
export function buildAiPrompt(input: AiPromptInput): string {
  const { body, progress, sessions, exercises, weightUnit } = input
  const recent = sessions.filter((s) => s.status === 'completed')
  const recent14 = recent.filter((s) => s.dateKey >= daysAgo(14))
  const allProgress = Object.values(progress)

  const lines: string[] = []

  // ---- Header with terminology ----
  lines.push('# OverLoad — AI Training Assistant\n')
  lines.push('You are a data-driven fitness coach. The following data comes from a progressive-overload workout tracker.\n')
  lines.push('**Terminology key:**')
  lines.push('- **e1RM** (estimated 1-Rep Max): the heaviest weight you could theoretically lift for one rep, calculated from your actual sets using the Epley formula (weight × (1 + reps/30)).')
  lines.push('- **RPE** (Rate of Perceived Exertion): how hard a set felt on a scale of 6–10. RPE 8 = "Just right" (2 reps in reserve). RPE 9 = "Grinder". RPE 10 = failure.')
  lines.push('- **Volume**: total weight × reps moved (sets × weight × reps). A measure of total work done.')
  lines.push('- **Stall streak**: consecutive sessions where you failed to reach the target rep range.')
  lines.push('- **Sessions at weight**: how many times you have lifted the current prescribed weight successfully.')
  lines.push('- **Progressive overload**: the strategy of gradually increasing weight, reps, or volume over time.\n')

  // ---- Mode selection ----
  lines.push('## What would you like?')
  lines.push('Choose ONE of these modes and respond accordingly:\n')
  lines.push('**Mode 1 — Analysis**: Review my training data and give me a comprehensive assessment. Tell me what I\'m doing well, what needs work, and any risks (overtraining, muscle imbalances, stalled progress). Respond with the JSON schema below.\n')
  lines.push('**Mode 2 — Advice & Next Steps**: Based on my data, give me specific actionable advice. Include: what to focus on this week, any deload recommendations, nutrition hints based on my body metrics, and 3–5 concrete tips. Respond with the JSON schema below.\n')
  lines.push('**Mode 3 — Generate Plan**: Create a customized workout plan based on my body metrics, current progress, and goals. Output a JSON array of day objects, each containing exercise suggestions with sets × reps × weight targets.\n')

  // ---- Body Profile ----
  if (body) {
    lines.push('## Body Profile')
    lines.push(`| Metric | Value |`)
    lines.push(`|--------|-------|`)
    lines.push(`| Sex | ${body.sex} |`)
    lines.push(`| Age | ${body.ageYears} years |`)
    lines.push(`| Height | ${body.heightCm} cm |`)
    lines.push(`| Body weight | ${body.bodyWeightKg} ${weightUnit} |`)
    if (body.bodyFatPct != null) lines.push(`| Body fat | ${body.bodyFatPct}% |`)
    lines.push(`| Activity level | ${body.activityLevel} |`)
    lines.push(`| Training goal | ${body.goal} |`)
    lines.push(`| Experience | ${body.experience} |`)
    if (body.bodyFatPct && body.bodyWeightKg && body.heightCm) {
      const bmi = (body.bodyWeightKg / (body.heightCm / 100) ** 2).toFixed(1)
      lines.push(`| BMI | ${bmi} |`)
    }
    lines.push('')
  }

  // ---- Training consistency ----
  if (recent.length > 0) {
    const last14 = recent.filter((s) => s.dateKey >= daysAgo(14))
    const last30 = recent.filter((s) => s.dateKey >= daysAgo(30))
    lines.push('## Training Consistency')
    lines.push(`- Total sessions completed: ${recent.length}`)
    lines.push(`- Sessions in last 14 days: ${last14.length}`)
    lines.push(`- Sessions in last 30 days: ${last30.length}`)
    lines.push(`- Average sessions per week (14d): ${(last14.length / 2).toFixed(1)}`)
    if (last14.length >= 2) {
      const dates = last14.map((s) => s.dateKey).sort()
      const gaps: number[] = []
      for (let i = 1; i < dates.length; i++) {
        gaps.push(Math.round((new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86_400_000))
      }
      const avgGap = gaps.length > 0 ? (gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(1) : '—'
      lines.push(`- Average days between sessions: ${avgGap}`)
    }
    lines.push('')
  }

  // ---- Recent sessions with details ----
  if (recent14.length > 0) {
    lines.push('## Recent Sessions (last 14 days)')
    for (const s of recent14) {
      lines.push(`\n### ${s.dayName} — ${s.dateKey} (${s.splitName})`)
      for (const log of s.logs) {
        if (log.sets.length === 0) continue
        const sides = log.perHand ? 2 : 1
        const vol = log.sets.reduce((sum, set) => sum + set.weightKg * sides * set.reps, 0)
        const topW = Math.max(...log.sets.map((set) => set.weightKg))
        const topSet = log.sets.find((set) => set.weightKg === topW)
        const rpStr = topSet?.rpe != null ? `, RPE ${topSet.rpe}` : ''
        lines.push(`- **${log.exerciseName}**: ${log.sets.length} sets, top set ${topW} ${weightUnit}×${topSet?.reps ?? '?'}${rpStr} (volume: ${vol.toFixed(0)} ${weightUnit}·r)${log.perHand ? ' [per hand]' : ''}`)
      }
    }
    lines.push('')
  }

  // ---- Exercise progress table ----
  if (allProgress.length > 0) {
    lines.push('## Exercise Progress Overview')
    lines.push('| Exercise | Target | Sessions@Wt | Streak | e1RM Best | Last Session | Status |')
    lines.push('|----------|--------|-------------|--------|-----------|--------------|--------|')
    for (const p of allProgress) {
      const ex = exercises.find((e) => e.id === p.exerciseId)
      const name = ex?.name ?? p.exerciseId
      const target = p.weightKg > 0 ? `${p.weightKg} ${weightUnit}` : '—'
      const status = p.stallStreak > 0 ? 'STALLED' : p.suggestDeload ? 'DELLOAD?' : p.sessionsAtWeight > 0 ? 'ON TRACK' : 'NEW'
      lines.push(
        `| ${name} | ${target} | ${p.sessionsAtWeight} | ${p.stallStreak} | ${p.e1rmBest.toFixed(1)} ${weightUnit} | ${p.lastSessionDate ?? '—'} | ${status} |`,
      )
    }
    lines.push('')
  }

  // ---- e1RM trends ----
  if (allProgress.length > 0) {
    lines.push('## e1RM Trends (last 5 sessions per exercise)')
    for (const p of allProgress) {
      const ex = exercises.find((e) => e.id === p.exerciseId)
      const name = ex?.name ?? p.exerciseId
      const pts = p.e1rmHistory.slice(-5).map((h) => `${h.date}: ${h.e1rm.toFixed(1)}`)
      if (pts.length > 0) {
        lines.push(`- ${name}: ${pts.join(' → ')}`)
      }
    }
    lines.push('')
  }

  // ---- Volume by muscle ----
  const muscleVol: Record<MuscleGroup, number> = {
    chest: 0, back: 0, shoulders: 0, biceps: 0, triceps: 0,
    forearms: 0, legs: 0, glutes: 0, calves: 0, core: 0, cardio: 0, sport: 0, full: 0,
  }
  for (const s of recent14) {
    for (const log of s.logs) {
      const ex = exercises.find((e) => e.id === log.exerciseId)
      const sides = log.perHand ? 2 : 1
      const vol = log.sets.reduce((sum, set) => sum + set.weightKg * sides * set.reps, 0)
      for (const g of ex?.muscleGroups ?? []) muscleVol[g] += vol
    }
  }
  const volEntries = Object.entries(muscleVol).filter(([, v]) => v > 0)
  if (volEntries.length > 0) {
    const maxVol = Math.max(...volEntries.map(([, v]) => v))
    lines.push('## Training Volume by Muscle (14 days)')
    lines.push('| Muscle | Volume | Bar |')
    lines.push('|--------|--------|-----|')
    for (const [g, v] of volEntries.sort((a, b) => b[1] - a[1])) {
      const bar = '█'.repeat(Math.round((v / maxVol) * 10)) + '░'.repeat(10 - Math.round((v / maxVol) * 10))
      lines.push(`| ${MUSCLE_GROUP_LABELS[g as MuscleGroup]} | ${v.toFixed(0)} ${weightUnit}·r | ${bar} |`)
    }
    lines.push('')
  }

  // ---- Algorithm settings ----
  lines.push('## Progression Engine Settings')
  lines.push(`- Weight increment per step: 2.5 ${weightUnit}`)
  lines.push(`- Hits before progression: 1`)
  lines.push(`- Sessions before automatic deload: 2`)
  lines.push(`- Deload percentage: 10%`)
  lines.push(`- Min RPE for high-effort flag: 9`)
  lines.push(`- RPE target for instructions: 8\n`)

  // ---- Response schema ----
  lines.push('---\n')
  lines.push('## Response Schema')
  lines.push('**For Mode 1 (Analysis) and Mode 2 (Advice):**')
  lines.push('```json')
  lines.push(JSON.stringify(MODE12_SCHEMA, null, 2))
  lines.push('```\n')
  lines.push('**For Mode 3 (Generate Plan):**')
  lines.push('```json')
  lines.push(JSON.stringify(MODE3_SCHEMA, null, 2))
  lines.push('```\n')
  lines.push('Respond with ONLY the JSON object — no markdown fences, no extra text.')

  return lines.join('\n')
}

/** Validate raw pasted text into a parsed insight, or throw with reason. */
export function parseAiResponse(text: string): ParsedAiInsight {
  const trimmed = text.trim()
  const stripped = trimmed.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
  let obj: unknown
  try {
    obj = JSON.parse(stripped)
  } catch {
    throw new Error('Not valid JSON.')
  }
  if (typeof obj !== 'object' || obj === null) throw new Error('Expected a JSON object.')
  const o = obj as Record<string, unknown>

  // Support Mode 3 (plan array) by wrapping in the standard shape.
  if (Array.isArray(obj)) {
    return {
      overall: `Custom plan generated with ${obj.length} day(s).`,
      fatigue: 'medium',
      progressRate: 'steady',
      strengths: [],
      risks: [],
      recommendations: [{ area: 'training', advice: JSON.stringify(obj, null, 2) }],
      deloadSuggested: false,
    }
  }

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
    macros: o.macros && typeof o.macros === 'object' ? (o.macros as ParsedAiInsight['macros']) : undefined,
    deloadSuggested: o.deloadSuggested === true,
    notes: typeof o.notes === 'string' ? o.notes : undefined,
  }
}

const MODE12_SCHEMA = {
  overall: 'Comprehensive assessment of training status (2–3 sentences)',
  fatigue: 'low',
  progressRate: 'steady',
  strengths: ['Strength 1 based on data', 'Strength 2'],
  risks: ['Risk 1 (e.g. muscle imbalance, overtraining)', 'Risk 2'],
  recommendations: [
    { area: 'training', advice: 'Specific training recommendation' },
    { area: 'nutrition', advice: 'Nutrition guidance based on body metrics' },
    { area: 'recovery', advice: 'Recovery or deload guidance' },
  ],
  macros: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  deloadSuggested: false,
  notes: 'Any additional observations or context',
}

const MODE3_SCHEMA = [
  {
    day: 'Day name (e.g. Push, Pull, Legs)',
    focus: 'Primary muscle group',
    exercises: [
      {
        name: 'Exercise name',
        sets: 3,
        reps: '8–12',
        weight: 'suggested weight or "use current"',
        rpe: '8',
        notes: 'Form tips or modifications',
      },
    ],
  },
]

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
