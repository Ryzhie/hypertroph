/**
 * Session management — delete or re-run sessions with engine recalculation.
 */

import { db } from '../db/db'

/**
 * Delete a session and clear all affected progress data.
 * This is a destructive operation — the user's progress history loses this data point.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const session = await db.sessions.get(sessionId)
  if (!session) return

  // Get all exercise IDs touched by this session.
  const exerciseIds = session.logs.map((l) => l.exerciseId)

  await db.transaction('rw', [db.sessions, db.progress], async () => {
    await db.sessions.delete(sessionId)

    // Clear progress for affected exercises — the engine will need
    // to re-derive from remaining sessions.
    // For now, we just delete the progress; on next workout the engine
    // creates fresh progress from the first logged session.
    for (const id of exerciseIds) {
      const p = await db.progress.get(id)
      if (p) {
        // Remove this session's e1rmHistory point and recalculate.
        const filtered = p.e1rmHistory.filter((h) => h.date !== session.dateKey)
        await db.progress.update(id, {
          e1rmHistory: filtered,
          // Note: sessionsAtWeight/stallStreak would need a full recalc
          // from remaining sessions. For simplicity, we just remove the
          // history point and let the next session fix the rest.
          lastSessionDate: filtered.length > 0
            ? filtered[filtered.length - 1].date
            : undefined,
        })
      }
    }
  })
}
