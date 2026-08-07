import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { HashRouter } from 'react-router-dom'
import { db } from './db/db'
import { seedIfNeeded } from './db/seed'

// Pin "today" to Monday 2026-08-03 so the default Bro Split shows Chest.
vi.mock('./utils/date', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils/date')>()
  return { ...actual, todayKey: vi.fn(() => '2026-08-03') }
})

import TodayScreen from './screens/TodayScreen'
import LoggingScreen from './screens/LoggingScreen'
import HistoryScreen from './screens/HistoryScreen'

afterEach(cleanup)

beforeEach(async () => {
  await db.delete()
  await db.open()
  await seedIfNeeded()
})

describe('app smoke', () => {
  it('renders today’s Chest workout on a Monday', async () => {
    render(
      <HashRouter>
        <TodayScreen />
      </HashRouter>,
    )
    expect(await screen.findByText('Barbell Bench Press')).toBeTruthy()
    expect(screen.getByText(/Start workout/i)).toBeTruthy()
  })

  it('logs a full workout and shows the updated next target', async () => {
    render(
      <HashRouter>
        <LoggingScreen />
      </HashRouter>,
    )

    const bench = await screen.findByText('Barbell Bench Press')
    const card = bench.closest('.card') as HTMLElement
    // Exercise cards are collapsed by default — click the header to expand.
    fireEvent.click(within(card).getByText('Barbell Bench Press'))
    const inputs = await within(card).findAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '60' } }) // weight
    fireEvent.change(inputs[1], { target: { value: '10' } }) // reps
    fireEvent.click(within(card).getAllByTitle('RPE 8')[0]) // top set, "Just right"
    fireEvent.click(screen.getByText('Finish workout'))

    expect(await screen.findByText(/Workout saved/)).toBeTruthy()
    expect(screen.getByText(/increase to 62.5 kg/i)).toBeTruthy()
  })

  it('lists a completed session and shows its e1RM progress', async () => {
    // Seed one completed session + its carried progress (data layer covered elsewhere).
    await db.progress.put({
      exerciseId: 'barbell-bench-press',
      weightKg: 60,
      repsRange: [6, 10],
      sessionsAtWeight: 1,
      stallStreak: 0,
      e1rmBest: 84,
      e1rmBestDate: '2026-08-10',
      e1rmHistory: [
        { date: '2026-08-03', e1rm: 80 },
        { date: '2026-08-10', e1rm: 84 },
      ],
      lastSessionDate: '2026-08-10',
      lastTopSet: { weightKg: 60, reps: 10, rpe: 8 },
      isNovice: true,
    })
    await db.sessions.add({
      id: 'hist-s1',
      dateKey: '2026-08-10',
      splitId: 'bro',
      splitName: 'Bro Split',
      dayKey: 'A',
      dayName: 'Chest',
      status: 'completed',
      startedAt: '2026-08-10T08:00:00.000Z',
      finishedAt: '2026-08-10T08:45:00.000Z',
      logs: [
        {
          exerciseId: 'barbell-bench-press',
          exerciseName: 'Barbell Bench Press',
          sets: [
            { weightKg: 60, reps: 10, rpe: 8 },
            { weightKg: 60, reps: 9, rpe: 8 },
          ],
        },
      ],
    })

    render(
      <HashRouter>
        <HistoryScreen />
      </HashRouter>,
    )

    // Sessions view: the latest card is open, showing the lift + volume (60×10 + 60×9 = 1140).
    expect(await screen.findByText('Barbell Bench Press')).toBeTruthy()
    expect(screen.getByText('Chest')).toBeTruthy()
    expect(screen.getAllByText('1140 kg·r')).toHaveLength(2) // stat tile + session footer

    // Progress view: per-exercise stats + chart + recent table with real top sets.
    fireEvent.click(screen.getByRole('button', { name: 'Progress' }))
    expect(await screen.findByText('Estimated 1RM · 2 sessions')).toBeTruthy()
    expect(screen.getByRole('img', { name: /estimated one-rep max over 2 sessions/i })).toBeTruthy()

    const bestTile = screen.getByText('e1RM best').closest('.stat-tile') as HTMLElement
    expect(within(bestTile).getByText('84 kg')).toBeTruthy()

    // The latest row's top set comes from the stored session (60 kg × 10, also
    // echoed in the footer); the older e1RM point (no session that day) shows a dash.
    expect(screen.getAllByText('60 kg × 10').length).toBeGreaterThan(0)
    expect(screen.getByText('80 kg')).toBeTruthy()
  })
})
