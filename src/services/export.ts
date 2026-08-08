import type { WorkoutSession } from '../types/session'
import type { BodyWeightPoint } from '../types/settings'

/**
 * Human-readable exports (CSV) + device sharing.
 *
 * Hyphe is fully offline, so "email export" is delivered through the Web Share
 * API — on mobile that opens the native share sheet (Mail, WhatsApp, Files…)
 * with the file attached. On desktop, or where sharing is unsupported, it
 * falls back to a plain download.
 */

/** Quote a CSV field if it needs it; escape embedded double quotes. */
export function csvEscape(value: string | number | boolean | null | undefined): string {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

/**
 * One row per set for every completed session. Volume mirrors the dashboard:
 * weight × reps × sides (per-hand lifts count both sides).
 */
export function buildWorkoutCsv(sessions: WorkoutSession[]): string {
  const header = ['Date', 'Split', 'Day', 'Exercise', 'Per-hand', 'Set', 'Weight(kg)', 'Reps', 'RPE', 'Volume(kg)']
  const rows: string[][] = [header]

  const ordered = [...sessions].sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  for (const s of ordered) {
    if (s.status !== 'completed') continue
    for (const log of s.logs) {
      const sides = log.perHand ? 2 : 1
      log.sets.forEach((set, i) => {
        const volume = set.weightKg * sides * set.reps
        rows.push([
          s.dateKey,
          s.splitName,
          s.dayName,
          log.exerciseName,
          log.perHand ? 'yes' : '',
          String(i + 1),
          csvEscape(set.weightKg),
          String(set.reps),
          set.rpe != null ? String(set.rpe) : '',
          csvEscape(Math.round(volume * 10) / 10),
        ])
      })
    }
  }

  return rows.map((r) => r.map(csvEscape).join(',')).join('\n')
}

/** Body-weight trend, most recent first. */
export function buildWeightCsv(history: BodyWeightPoint[]): string {
  const header = ['Date', 'Weight(kg)']
  const rows = history.map((p) => [p.date, csvEscape(p.weightKg)] as string[])
  return [header, ...rows].map((r) => r.join(',')).join('\n')
}

/** Trigger a browser download for a file (blob URL + revoke after 10s). */
export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * Share a file through the OS share sheet when available (mobile → email it),
 * otherwise download it. Resolves 'shared' / 'downloaded'; throws if the user
 * cancels the share sheet.
 */
export async function shareFile(file: File): Promise<'shared' | 'downloaded'> {
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file] })
    return 'shared'
  }
  downloadFile(file)
  return 'downloaded'
}
