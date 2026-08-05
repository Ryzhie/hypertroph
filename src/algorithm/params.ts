import type { AlgorithmParams } from '../types/settings'
import { DEFAULT_PARAMS } from '../types/settings'

/** A fresh copy of the default parameters (never share a mutable reference). */
export function defaultParams(): AlgorithmParams {
  return { ...DEFAULT_PARAMS }
}

/**
 * Fill in missing fields from a partial params object (used when importing
 * backups from older versions). Unknown fields are dropped.
 */
export function sanitizeParams(partial: Partial<AlgorithmParams> | undefined): AlgorithmParams {
  return { ...defaultParams(), ...partial }
}
