/**
 * AI-assisted analysis, done OUTSIDE the app workflow.
 *
 * The app exports a structured prompt containing the user's body metrics and
 * training data; the user pastes it into any AI of their choice and pastes the
 * AI's JSON response back. The app validates and stores it. Running multiple
 * rounds (and across AIs) reduces single-model bias. No AI is ever called from
 * inside the app.
 */

export interface AiMacros {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export interface AiRecommendation {
  area: string
  advice: string
}

export type FatigueLevel = 'low' | 'medium' | 'high'
export type ProgressRate = 'slow' | 'steady' | 'fast'

/** The validated shape the app accepts back from an external AI. */
export interface ParsedAiInsight {
  overall: string
  fatigue: FatigueLevel
  progressRate: ProgressRate
  strengths: string[]
  risks: string[]
  recommendations: AiRecommendation[]
  macros?: AiMacros
  deloadSuggested: boolean
  notes?: string
}

/** One stored round of external-AI analysis. */
export interface AiInsight {
  id: string
  createdAt: string
  /** User-entered label, e.g. "Claude · round 2". */
  source: string
  /** The raw response pasted back in (kept for reference/audit). */
  raw: string
  /** Parsed structure, present only if the response validated. */
  parsed?: ParsedAiInsight
  valid: boolean
}
