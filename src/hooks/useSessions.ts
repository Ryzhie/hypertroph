import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { WorkoutSession } from '../types/session'

/** Completed sessions, newest first. */
export function useSessions(): { sessions: WorkoutSession[] } {
  const sessions =
    useLiveQuery(() => db.sessions.orderBy('dateKey').reverse().toArray(), []) ?? []
  return { sessions }
}
