import { db } from '../db/db'
import type { DraftSet } from '../components/SetRow'

/** Draft session stored for resume. */
export interface SessionDraft {
  id: string
  dayId: string
  drafts: Record<string, DraftSet[]>
  savedAt: string
}

/** Persist the current drafts for a day. */
export async function saveDraft(draft: { dayId: string; drafts: Record<string, DraftSet[]> }): Promise<void> {
  const now = new Date().toISOString()
  const existing = await db.drafts.get(draft.dayId)
  if (existing) {
    await db.drafts.update(draft.dayId, { drafts: draft.drafts, savedAt: now })
  } else {
    await db.drafts.add({ id: draft.dayId, dayId: draft.dayId, drafts: draft.drafts, savedAt: now })
  }
}

/** Load a saved draft for a day, or null if none. */
export async function loadDraft(dayId: string): Promise<SessionDraft | null> {
  const row = await db.drafts.get(dayId)
  return row ?? null
}

/** Delete a draft for a day. */
export async function clearDraft(dayId: string): Promise<void> {
  await db.drafts.delete(dayId)
}
