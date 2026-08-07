import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { ExerciseProgress } from '../types/progress'

/** All per-exercise progress as a map keyed by exerciseId. */
export function useProgress(): { progress: Record<string, ExerciseProgress> } {
  const raw = useLiveQuery(() => db.progress.toArray(), [])
  const all = Array.isArray(raw) ? raw : []
  const map: Record<string, ExerciseProgress> = {}
  for (const p of all) map[p.exerciseId] = p
  return { progress: map }
}
