import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSettings } from '../hooks/useSettings'
import type { PlanDay, Split } from '../types/split'
import type { Exercise } from '../types/exercise'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function SplitsScreen() {
  const { settings, update } = useSettings()
  const splits = useLiveQuery(() => db.splits.toArray(), []) ?? []
  const exercises = useLiveQuery(() => db.exercises.toArray(), []) ?? []
  const activeId = settings?.splitId

  const [editing, setEditing] = useState<string | null>(null) // dayKey
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')

  const split = splits.find((s) => s.id === activeId) ?? splits[0]
  if (!split) {
    return (
      <div className="screen">
        <h2 className="topbar-title">Plans</h2>
        <div className="empty">
          <div className="empty-icon">🗓️</div>
          <p className="muted">No split yet.</p>
        </div>
      </div>
    )
  }

  const day = editing ? split.days[editing] : undefined

  async function setActive(id: string) {
    await update({ splitId: id })
  }

  async function duplicate(s: Split) {
    const copy: Split = {
      ...s,
      id: `${s.id}-copy-${Date.now().toString(36)}`,
      name: `${s.name} (copy)`,
      template: false,
      days: Object.fromEntries(
        Object.entries(s.days).map(([k, d]) => [
          k,
          { ...d, exercises: d.exercises.map((sl) => ({ ...sl })) },
        ]),
      ),
    }
    await db.splits.add(copy)
    await update({ splitId: copy.id })
  }

  async function renameDay(dayKey: string, name: string) {
    await patchDay(split, dayKey, { name })
  }

  async function patchDay(s: Split, dayKey: string, patch: Partial<PlanDay>) {
    const cur = s.days[dayKey]
    if (!cur) return
    await db.splits.update(s.id, { days: { ...s.days, [dayKey]: { ...cur, ...patch } } })
  }

  async function commitExercises(dayKey: string, next: string[]) {
    const cur = split.days[dayKey]
    if (!cur) return
    const exercises = next.map((exerciseId, order) => ({ exerciseId, order }))
    await patchDay(split, dayKey, { exercises })
  }

  async function addExerciseToDay(dayKey: string, exerciseId: string) {
    const cur = split.days[dayKey]
    if (!cur || cur.exercises.some((s) => s.exerciseId === exerciseId)) return
    await commitExercises(dayKey, [...cur.exercises.map((s) => s.exerciseId), exerciseId])
  }

  async function move(dayKey: string, index: number, dir: -1 | 1) {
    const cur = split.days[dayKey]
    if (!cur) return
    const ids = cur.exercises.map((s) => s.exerciseId)
    const j = index + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[index], ids[j]] = [ids[j], ids[index]]
    await commitExercises(dayKey, ids)
  }

  const dayMuscles = useMemo(() => {
    if (!day) return new Set<string>()
    const set = new Set<string>()
    for (const slot of day.exercises) {
      const ex = exercises.find((e) => e.id === slot.exerciseId)
      for (const g of ex?.muscleGroups ?? []) set.add(g)
    }
    return set
  }, [day, exercises])

  const suggestions = useMemo(() => {
    if (!day) return []
    const q = query.trim().toLowerCase()
    const relevant: Exercise[] = []
    const rest: Exercise[] = []
    for (const e of exercises) {
      if (e.archived) continue
      if (q && !e.name.toLowerCase().includes(q)) continue
      if (day.exercises.some((s) => s.exerciseId === e.id)) continue
      if (e.muscleGroups.some((g) => dayMuscles.has(g))) relevant.push(e)
      else rest.push(e)
    }
    const byName = (a: Exercise, b: Exercise) => a.name.localeCompare(b.name)
    return [...relevant.sort(byName), ...rest.sort(byName)]
  }, [day, exercises, dayMuscles, query])

  return (
    <div className="screen splits-screen">
      <h2 className="topbar-title">Plans</h2>
      <p className="muted small">
        Active plan: <strong>{split.name}</strong>. Tap a day to change which exercises it
        includes.
      </p>

      <div className="split-switch">
        {splits.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`chip filter-chip ${s.id === split.id ? 'chip-active' : ''}`}
            onClick={() => void setActive(s.id)}
          >
            {s.name}
          </button>
        ))}
        <button
          type="button"
          className="btn-ghost btn"
          onClick={() => void duplicate(split)}
          style={{ marginLeft: 'auto' }}
        >
          + Copy
        </button>
      </div>

      {split.schedule.map((dayKey, wi) => {
        const d = dayKey ? split.days[dayKey] : undefined
        if (!d) {
          return (
            <div key={`rest-${wi}`} className="card day-card day-rest">
              <span className="faint small">{DAY_LABELS[wi]}</span>
              <span className="muted small">Rest</span>
            </div>
          )
        }
        return (
          <DayCard
            key={d.id}
            day={d}
            weekday={DAY_LABELS[wi]}
            exercises={exercises}
            open={editing === d.id}
            onToggle={() => setEditing((cur) => (cur === d.id ? null : d.id))}
            onRename={(name) => void renameDay(d.id, name)}
            onRemove={(index) =>
              void commitExercises(d.id, d.exercises.filter((_, i) => i !== index).map((s) => s.exerciseId))
            }
            onMove={(index, dir) => void move(d.id, index, dir)}
            onAdd={() => {
              setAdding(true)
              setQuery('')
            }}
          />
        )
      })}

      {day && adding && (
        <div className="card add-panel">
          <div className="card-title">Add exercise to {day.name}</div>
          <input
            className="search-box"
            type="search"
            placeholder="Search exercises…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="suggest-list">
            {suggestions.map((e) => (
              <button
                key={e.id}
                type="button"
                className="suggest-row"
                onClick={() => {
                  void addExerciseToDay(day.id, e.id)
                  setAdding(false)
                }}
              >
                <span className="exercise-name">{e.name}</span>
                <span className="faint small">{e.equipment ?? ''}</span>
              </button>
            ))}
            {suggestions.length === 0 && (
              <p className="muted small">No matching exercises. Add one in the Exercises tab first.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DayCard({
  day,
  weekday,
  exercises,
  open,
  onToggle,
  onRename,
  onRemove,
  onMove,
  onAdd,
}: {
  day: PlanDay
  weekday: string
  exercises: Exercise[]
  open: boolean
  onToggle: () => void
  onRename: (name: string) => void
  onRemove: (index: number) => void
  onMove: (index: number, dir: -1 | 1) => void
  onAdd: () => void
}) {
  const [name, setName] = useState(day.name)
  const slots = [...day.exercises].sort((a, b) => a.order - b.order)

  return (
    <div className="card day-card">
      <button type="button" className="session-toggle" onClick={onToggle}>
        <span className="session-toggle-text">
          <span className="session-title">
            {weekday}
            <span className="chip chip-accent">{day.name}</span>
          </span>
          <span className="faint small">{slots.length} exercises</span>
        </span>
        <span className="chevron" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>

      {!open && (
        <div className="day-preview">
          {slots.map((s) => {
            const ex = exercises.find((e) => e.id === s.exerciseId)
            return ex ? (
              <span key={s.exerciseId} className="chip">
                {ex.name}
              </span>
            ) : null
          })}
        </div>
      )}

      {open && (
        <div className="day-editor">
          <label className="field">
            <span className="field-label">Day name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => onRename(name.trim() || day.name)} />
          </label>

          <div className="slot-list">
            {slots.map((s, i) => {
              const ex = exercises.find((e) => e.id === s.exerciseId)
              return (
                <div key={s.exerciseId} className="slot-row">
                  <span className="slot-move">
                    <button
                      type="button"
                      className="btn-ghost"
                      aria-label="Move up"
                      disabled={i === 0}
                      onClick={() => onMove(i, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      aria-label="Move down"
                      disabled={i === slots.length - 1}
                      onClick={() => onMove(i, 1)}
                    >
                      ↓
                    </button>
                  </span>
                  <span className="slot-name">{ex?.name ?? s.exerciseId}</span>
                  <span className="slot-muscles faint small">
                    {ex?.muscleGroups.map((g) => MUSCLE_SHORT[g]).filter(Boolean).join(' · ')}
                  </span>
                  <button
                    type="button"
                    className="slot-remove"
                    aria-label={`Remove ${ex?.name ?? ''}`}
                    onClick={() => onRemove(i)}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>

          <button className="btn btn-block" onClick={onAdd}>
            + Add exercise
          </button>
        </div>
      )}
    </div>
  )
}

const MUSCLE_SHORT: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  legs: 'Legs',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
  full: 'Full',
}
