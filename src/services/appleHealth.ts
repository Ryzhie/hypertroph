import JSZip from 'jszip'
import type { BodyWeightPoint } from '../types/settings'

/**
 * Client-side Apple Health import.
 *
 * iOS: Settings → Health → "Export All Health Data" produces export.zip (which
 * contains export.xml). A web PWA cannot reach HealthKit directly — this is the
 * official, fully offline way to pull body-weight / height / body-fat history
 * into Hyphe's body profile. Accepts either export.xml or export.zip.
 */

export interface HealthImport {
  /** Latest measured body weight, canonical kg. */
  weightKg?: number
  /** Latest measured height, cm. */
  heightCm?: number
  /** Latest measured body fat, percent (e.g. 18 = 18%). */
  bodyFatPct?: number
  /** Body-weight trend, most recent first, one point per day. */
  weightHistory: BodyWeightPoint[]
}

const BODY_MASS = 'HKQuantityTypeIdentifierBodyMass'
const HEIGHT = 'HKQuantityTypeIdentifierHeight'
const BODY_FAT = 'HKQuantityTypeIdentifierBodyFatPercentage'

/** Keep the chart legible and the import bounded on big exports. */
const MAX_HISTORY = 400

const KG_TO_LB = 2.20462

/** Apple's dates look like "2024-01-01 10:00:00 -0800". */
function parseHealthDate(value: string | null): number {
  const t = value ? Date.parse(value) : NaN
  return Number.isNaN(t) ? 0 : t
}

function dateKeyOf(startDate: string | null): string {
  return (startDate ?? '').slice(0, 10)
}

/** Convert a record's value to the canonical unit for its type. */
function toCanonical(value: number, unit: string | null, base: 'kg' | 'cm'): number {
  const u = (unit ?? '').toLowerCase()
  if (base === 'kg' && u === 'lb') return value / KG_TO_LB
  if (base === 'cm' && u === 'm') return value * 100
  return value
}

/** Read export.xml out of a File (extracting it from export.zip when needed). */
async function readXml(file: File): Promise<string> {
  if (/\.zip$/i.test(file.name)) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer())
    const entry = zip.file('export.xml')
    if (!entry) throw new Error('This Health zip has no export.xml in it.')
    return entry.async('string')
  }
  return file.text()
}

/** Parse a Health export file into the body metrics Hyphe can use. */
export async function parseHealthFile(file: File): Promise<HealthImport> {
  const xml = await readXml(file)
  if (!xml.trim()) throw new Error('That file is empty.')

  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('That doesn’t look like a valid Health export (XML parse failed).')
  }

  const records = Array.from(doc.querySelectorAll('Record'))
  if (records.length === 0) throw new Error('No Health records found in this file.')

  // Latest value per measurement type.
  const latestOf = (type: string): { value: number; time: number; unit: string | null } | null => {
    let best: { value: number; time: number; unit: string | null } | null = null
    for (const r of records) {
      if (r.getAttribute('type') !== type) continue
      const value = parseFloat(r.getAttribute('value') ?? '')
      const time = parseHealthDate(r.getAttribute('startDate'))
      if (!Number.isFinite(value)) continue
      if (!best || time >= best.time) {
        best = { value, time, unit: r.getAttribute('unit') }
      }
    }
    return best
  }

  const weightRec = latestOf(BODY_MASS)
  if (!weightRec) {
    throw new Error(
      'No body-weight records found — Hyphe imports weight, height, and body fat from Apple Health.',
    )
  }

  const round = (n: number, places: number) => {
    const f = 10 ** places
    return Math.round(n * f) / f
  }

  const weightKg = round(toCanonical(weightRec.value, weightRec.unit, 'kg'), 2)

  const heightRec = latestOf(HEIGHT)
  const heightCm = heightRec
    ? round(toCanonical(heightRec.value, heightRec.unit, 'cm'), 1)
    : undefined

  // Apple stores body fat as a fraction (0.18 = 18%); guard against exports
  // that already carry a percentage so we never show "180%".
  const fatRec = latestOf(BODY_FAT)
  let bodyFatPct: number | undefined
  if (fatRec) {
    const asPct = fatRec.value * 100
    bodyFatPct = round(asPct > 70 ? fatRec.value : asPct, 1)
  }

  // Weight trend: newest first, one point per day (chart reads most-recent-first).
  const massPoints = records
    .filter((r) => r.getAttribute('type') === BODY_MASS)
    .map((r) => ({
      time: parseHealthDate(r.getAttribute('startDate')),
      date: dateKeyOf(r.getAttribute('startDate')),
      weightKg: round(
        toCanonical(parseFloat(r.getAttribute('value') ?? ''), r.getAttribute('unit'), 'kg'),
        2,
      ),
    }))
    .filter((p) => p.date && Number.isFinite(p.weightKg) && p.weightKg > 0)
    .sort((a, b) => b.time - a.time)

  const byDay = new Map<string, number>()
  for (const p of massPoints) if (!byDay.has(p.date)) byDay.set(p.date, p.weightKg)

  const weightHistory: BodyWeightPoint[] = Array.from(byDay, ([date, w]) => ({ date, weightKg: w }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_HISTORY)

  return { weightKg, heightCm, bodyFatPct, weightHistory }
}
