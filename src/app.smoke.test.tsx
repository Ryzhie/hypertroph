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
    const inputs = await within(card).findAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '60' } }) // weight
    fireEvent.change(inputs[1], { target: { value: '10' } }) // reps
    fireEvent.click(within(card).getAllByTitle('RPE 8')[0]) // top set, "Just right"
    fireEvent.click(screen.getByText('Finish workout'))

    expect(await screen.findByText(/Workout saved/)).toBeTruthy()
    expect(screen.getByText(/increase to 62.5 kg/i)).toBeTruthy()
  })
})
