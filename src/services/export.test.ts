import { describe, it, expect } from 'vitest'
import { buildWorkoutCsv, buildWeightCsv, csvEscape } from '../services/export'
import type { WorkoutSession } from '../types/session'
import type { BodyWeightPoint } from '../types/settings'

describe('csvEscape', () => {
  it('escapes embedded quotes and commas', () => {
    expect(csvEscape('hello, world')).toBe('"hello, world"')
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""')
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"')
    expect(csvEscape('plain')).toBe('plain')
    expect(csvEscape(123)).toBe('123')
    expect(csvEscape(null)).toBe('')
    expect(csvEscape(undefined)).toBe('')
  })
})

describe('buildWorkoutCsv', () => {
  const sessions: WorkoutSession[] = [
    {
      id: 's1',
      dateKey: '2024-01-12',
      splitId: 'push',
      splitName: 'Push',
      dayKey: 'push-a',
      dayName: 'Push A',
      status: 'completed',
      startedAt: '2024-01-12T10:00:00Z',
      finishedAt: '2024-01-12T11:00:00Z',
      logs: [
        {
          exerciseId: 'bench',
          exerciseName: 'Bench Press',
          perHand: false,
          sets: [
            { weightKg: 80, reps: 8, rpe: 8 },
            { weightKg: 82.5, reps: 6, rpe: 9 },
          ],
        },
        {
          exerciseId: 'db-row',
          exerciseName: 'DB Row',
          perHand: true,
          sets: [
            { weightKg: 25, reps: 10, rpe: 8 },
          ],
        },
      ],
    },
    {
      id: 's0',
      dateKey: '2024-01-10',
      splitId: 'pull',
      splitName: 'Pull',
      dayKey: 'pull-a',
      dayName: 'Pull A',
      status: 'in-progress',
      startedAt: '2024-01-10T10:00:00Z',
      logs: [],
    },
  ]

  it('writes header + one row per set, newest session first', () => {
    const csv = buildWorkoutCsv(sessions)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('Date,Split,Day,Exercise,Per-hand,Set,Weight(kg),Reps,RPE,Volume(kg)')
    // only completed session (s1) appears
    expect(lines.length).toBe(4) // header + 3 sets
    // DB Row per-hand: volume = 25 * 2 * 10 = 500
    const dbRow = lines.find((l) => l.includes('DB Row'))
    expect(dbRow).toContain('yes') // Per-hand
    expect(dbRow).toContain('500') // Volume
    // Bench Press 82.5kg x 6 = 495
    const bench2 = lines.find((l) => l.includes('82.5') && l.includes('6'))
    expect(bench2).toContain('495')
  })

  it('skips in-progress sessions', () => {
    const csv = buildWorkoutCsv(sessions)
    // Pull session is in-progress → no rows from it
    expect(csv).not.toContain('Pull')
  })

  it('handles missing RPE', () => {
    const s: WorkoutSession = {
      ...sessions[0],
      logs: [{ exerciseId: 'x', exerciseName: 'X', perHand: false, sets: [{ weightKg: 100, reps: 5 }] }],
    }
    const csv = buildWorkoutCsv([s])
    expect(csv.split('\n')[1]).toContain(',,') // empty RPE field
  })
})

describe('buildWeightCsv', () => {
  const hist: BodyWeightPoint[] = [
    { date: '2024-01-12', weightKg: 81.8 },
    { date: '2024-01-10', weightKg: 82.5 },
  ]

  it('writes header + date/weight rows', () => {
    const csv = buildWeightCsv(hist)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('Date,Weight(kg)')
    expect(lines[1]).toBe('2024-01-12,81.8')
    expect(lines[2]).toBe('2024-01-10,82.5')
  })

  it('handles empty history', () => {
    const csv = buildWeightCsv([])
    expect(csv.trim()).toBe('Date,Weight(kg)')
  })
})