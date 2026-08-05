import { useLiveQuery } from 'dexie-react-hooks'
import { db, SETTINGS_ID, type StoredSettings } from '../db/db'
import type { AlgorithmParams } from '../types/settings'

export function useSettings() {
  const settings = useLiveQuery(() => db.settings.get(SETTINGS_ID), [])

  const update = async (patch: Partial<StoredSettings>) => {
    if (!settings) return
    await db.settings.update(SETTINGS_ID, patch)
  }

  const setParams = async (patch: Partial<AlgorithmParams>) => {
    if (!settings) return
    await db.settings.update(SETTINGS_ID, { params: { ...settings.params, ...patch } })
  }

  return { settings, update, setParams }
}
