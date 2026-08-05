import type { PlanDay, PlanSlot, Split } from '../types/split'

/** Weekday indices (Date.getDay): 0 = Sunday … 6 = Saturday. */
const WEEKDAY: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

/** Build a 7-element schedule array from a day-name → dayKey map. */
function week(mapping: Record<string, string | null>): (string | null)[] {
  const arr: (string | null)[] = Array(7).fill(null)
  for (const [day, key] of Object.entries(mapping)) {
    if (key !== null) arr[WEEKDAY[day]] = key
  }
  return arr
}

function buildDay(name: string, exerciseIds: string[]): PlanDay {
  return {
    id: crypto.randomUUID(),
    name,
    isRest: false,
    exercises: exerciseIds.map(
      (exerciseId, order): PlanSlot => ({ exerciseId, order }),
    ),
  }
}

function makeSplit(
  id: string,
  name: string,
  schedule: (string | null)[],
  days: PlanDay[],
): Split {
  return { id, name, template: true, schedule, days: Object.fromEntries(days.map((d) => [d.id, d])) }
}

/** 4 preset splits. These are editable starting templates, not locked-in plans. */
export const SPLIT_SEED: Split[] = [
  makeSplit(
    'bro',
    'Bro Split',
    week({ Mon: 'A', Tue: 'B', Wed: 'C', Thu: 'D', Fri: 'E' }),
    [
      buildDay('Chest', ['barbell-bench-press', 'incline-dumbbell-press', 'dumbbell-bench-press', 'cable-fly', 'push-up']),
      buildDay('Back', ['deadlift', 'barbell-row', 'lat-pulldown', 'seated-cable-row', 'face-pull']),
      buildDay('Legs', ['back-squat', 'romanian-deadlift', 'leg-press', 'leg-extension', 'leg-curl']),
      buildDay('Shoulders', ['overhead-press', 'dumbbell-shoulder-press', 'lateral-raise', 'rear-delt-fly']),
      buildDay('Arms', ['barbell-curl', 'hammer-curl', 'triceps-pushdown', 'overhead-triceps-extension', 'dips']),
    ],
  ),

  makeSplit(
    'ppl',
    'Push Pull Leg',
    week({ Mon: 'A', Tue: 'B', Wed: 'C', Thu: 'A', Fri: 'B', Sat: 'C' }),
    [
      buildDay('Push', ['barbell-bench-press', 'overhead-press', 'incline-dumbbell-press', 'lateral-raise', 'triceps-pushdown', 'dips']),
      buildDay('Pull', ['deadlift', 'barbell-row', 'lat-pulldown', 'face-pull', 'barbell-curl', 'hammer-curl']),
      buildDay('Legs', ['back-squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'standing-calf-raise']),
    ],
  ),

  makeSplit(
    'upper-lower',
    'Upper / Lower',
    week({ Mon: 'A', Tue: 'B', Thu: 'A', Fri: 'B' }),
    [
      buildDay('Upper', ['barbell-bench-press', 'barbell-row', 'overhead-press', 'lat-pulldown', 'barbell-curl', 'triceps-pushdown']),
      buildDay('Lower', ['back-squat', 'romanian-deadlift', 'leg-extension', 'leg-curl', 'standing-calf-raise']),
    ],
  ),

  makeSplit(
    'full-body',
    'Full Body',
    week({ Mon: 'A', Wed: 'A', Fri: 'A' }),
    [
      buildDay('Full Body', ['back-squat', 'barbell-bench-press', 'barbell-row', 'overhead-press', 'ab-wheel-rollout']),
    ],
  ),
]
