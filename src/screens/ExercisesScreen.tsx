import { ChevronUpIcon, ChevronDownIcon } from '../components/Icons'
import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import BodyMap from '../components/BodyMap'
import { MUSCLE_INFO } from '../data/body'
import {
  MUSCLE_GROUP_LABELS,
  SECTION_LABELS,
  type Exercise,
  type ExerciseCategory,
  type ExerciseSection,
  type MuscleGroup,
} from '../types/exercise'

type Filter = MuscleGroup | 'all'

const MUSCLE_ORDER = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]
const SECTIONS: ExerciseSection[] = ['weights', 'calisthenics', 'cardio', 'sport']
const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Other']

export default function ExercisesScreen() {
  const raw = useLiveQuery(() => db.exercises.orderBy('name').toArray(), [])
  const exercises = Array.isArray(raw) ? raw : []

  const [section, setSection] = useState<ExerciseSection>('weights')
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises.filter((e) => {
      if (e.archived) return false
      if ((e.section ?? 'weights') !== section) return false
      if (filter !== 'all' && !e.muscleGroups.includes(filter)) return false
      if (q && !e.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [exercises, section, filter, query])

  const archived = exercises.filter((e) => e.archived)

  if (raw === undefined) {
    return <div className="screen exercises-screen" />
  }

  return (
    <div className="screen exercises-screen">
      <h2 className="topbar-title">Exercises</h2>

      {/* Section tabs: Weights / Calisthenics / Cardio / Sports */}
      <div className="segment section-tabs">
        {SECTIONS.map((s) => (
          <button
            key={s}
            className={section === s ? 'selected' : ''}
            onClick={() => { setSection(s); setFilter('all'); setExpanded(null) }}
          >
            {SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      <input
        className="search-box"
        type="search"
        placeholder="Search exercises…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="filter-chips">
        <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
        {MUSCLE_ORDER.map((g) => (
          <FilterChip
            key={g}
            label={MUSCLE_GROUP_LABELS[g]}
            active={filter === g}
            onClick={() => setFilter(g)}
          />
        ))}
      </div>

      {filtered.map((e) => (
        <ExerciseCard
          key={e.id}
          exercise={e}
          open={expanded === e.id}
          onToggle={() => setExpanded((cur) => (cur === e.id ? null : e.id))}
        />
      ))}

      {filtered.length === 0 && (
        <div className="empty">
          <div className="empty-icon">🔍</div>
          <p className="muted">No exercises in this section.</p>
        </div>
      )}

      {archived.length > 0 && (
        <details className="card archived-box">
          <summary className="muted small">Archived ({archived.length})</summary>
          {archived.map((e) => (
            <div key={e.id} className="archived-row">
              <span className="muted small">{e.name}</span>
              <button
                className="btn-ghost btn"
                onClick={() => void db.exercises.update(e.id, { archived: false })}
              >
                Restore
              </button>
            </div>
          ))}
        </details>
      )}

      {adding ? (
        <AddExerciseForm onDone={() => setAdding(false)} section={section} />
      ) : (
        <button className="btn btn-block" onClick={() => setAdding(true)}>
          + {section === 'sport' ? 'Add sport' : 'Add exercise'}
        </button>
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`chip filter-chip ${active ? 'chip-active' : ''}`} onClick={onClick}>
      {label}
    </button>
  )
}

function ExerciseCard({
  exercise,
  open,
  onToggle,
}: {
  exercise: Exercise
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="card exercise-card">
      <button type="button" className="exercise-toggle" onClick={onToggle}>
        <span className="exercise-toggle-text">
          <span className="exercise-name">{exercise.name}</span>
          <span className="faint small">
            {exercise.equipment ?? '—'} · {exercise.category} ·{' '}
            {exercise.isBodyweight
              ? `${exercise.defaultRepsRange[0]}–${exercise.defaultRepsRange[1]} reps`
              : `${exercise.defaultSets}×${exercise.defaultRepsRange[0]}–${exercise.defaultRepsRange[1]}`}
            {exercise.perHand ? ' · per hand' : ''}
          </span>
        </span>
        <span className="chevron" aria-hidden>
          {open ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
        </span>
      </button>

      {open && <ExerciseDetail exercise={exercise} />}
    </div>
  )
}

function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(exercise.name)
  const [equipment, setEquipment] = useState(exercise.equipment ?? '')
  const [category, setCategory] = useState<ExerciseCategory>(exercise.category)
  const [sets, setSets] = useState(exercise.defaultSets)
  const [repsMin, setRepsMin] = useState(exercise.defaultRepsRange[0])
  const [repsMax, setRepsMax] = useState(exercise.defaultRepsRange[1])
  const [rest, setRest] = useState(exercise.defaultRestSeconds)

  async function save() {
    await db.exercises.update(exercise.id, {
      name: name.trim() || exercise.name,
      equipment: equipment || undefined,
      category,
      defaultSets: sets,
      defaultRepsRange: [repsMin, repsMax],
      defaultRestSeconds: rest,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="exercise-detail">
        <label className="field">
          <span className="field-label">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="field-row">
          <label className="field">
            <span className="field-label">Equipment</span>
            <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
              {EQUIPMENT_OPTIONS.map((eq) => <option key={eq}>{eq}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as ExerciseCategory)}>
              <option value="compound">Compound</option>
              <option value="isolation">Isolation</option>
            </select>
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span className="field-label">Sets</span>
            <input type="number" min={1} value={sets} onChange={(e) => setSets(Number(e.target.value))} />
          </label>
          <label className="field">
            <span className="field-label">Reps min</span>
            <input type="number" min={1} value={repsMin} onChange={(e) => setRepsMin(Number(e.target.value))} />
          </label>
          <label className="field">
            <span className="field-label">Reps max</span>
            <input type="number" min={1} value={repsMax} onChange={(e) => setRepsMax(Number(e.target.value))} />
          </label>
          <label className="field">
            <span className="field-label">Rest (s)</span>
            <input type="number" min={0} step={15} value={rest} onChange={(e) => setRest(Number(e.target.value))} />
          </label>
        </div>
        <div className="exercise-detail-foot">
          <button className="btn-ghost btn" onClick={() => setEditing(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => void save()}>
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="exercise-detail">
      <div className="muscle-chips">
        {exercise.muscleGroups.map((g) => (
          <span key={g} className="chip chip-accent">
            {MUSCLE_GROUP_LABELS[g]}
          </span>
        ))}
      </div>
      <BodyMap active={exercise.muscleGroups} view="both" />

      {exercise.muscleGroups.length > 0 && (() => {
        const info = MUSCLE_INFO[exercise.muscleGroups[0]]
        if (!info) return null
        return (
          <div className="muscle-info">
            <div className="muscle-info-row">
              <span className="muscle-info-label">Form cue</span>
              <span className="muscle-info-text">{info.cue}</span>
            </div>
            <div className="muscle-info-row">
              <span className="muscle-info-label">Tip</span>
              <span className="muscle-info-text">{info.tip}</span>
            </div>
            <div className="muscle-info-row">
              <span className="muscle-info-label">Also try</span>
              <span className="muscle-info-text">
                {info.exercises.filter((e) => e !== exercise.name).slice(0, 3).join(', ')}
              </span>
            </div>
          </div>
        )
      })()}

      <div className="exercise-detail-foot">
        <span className="muted small">
          Rest {formatRest(exercise.defaultRestSeconds)} · {exercise.defaultSets} sets
        </span>
        <span>
          <button className="btn-ghost btn" style={{ marginRight: 8 }} onClick={() => setEditing(true)}>
            Edit
          </button>
          <button
            className="btn-ghost btn"
            onClick={() => void db.exercises.update(exercise.id, { archived: true })}
          >
            Archive
          </button>
        </span>
      </div>
    </div>
  )
}

interface ExerciseForm {
  name: string
  muscleGroups: MuscleGroup[]
  section: ExerciseSection
  equipment: string
  category: ExerciseCategory
  sets: number
  repsMin: number
  repsMax: number
  rest: number
  isBodyweight: boolean
  perHand: boolean
}

function AddExerciseForm({ onDone, section }: { onDone: () => void; section: ExerciseSection }) {
  const [f, setF] = useState<ExerciseForm>({
    name: '',
    muscleGroups: [],
    section,
    equipment: section === 'calisthenics' ? 'Bodyweight' : 'Dumbbell',
    category: 'compound',
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    rest: 90,
    isBodyweight: section === 'calisthenics',
    perHand: false,
  })
  const set = (patch: Partial<ExerciseForm>) => setF((cur) => ({ ...cur, ...patch }))

  async function submit() {
    const name = f.name.trim()
    if (!name || f.muscleGroups.length === 0) return
    const slug = slugify(name) || `exercise-${Date.now().toString(36)}`
    const taken = await db.exercises.get(slug)
    const finalId = taken ? `${slug}-${Date.now().toString(36)}` : slug
    await db.exercises.add({
      id: finalId,
      name,
      muscleGroups: f.muscleGroups,
      section: f.section,
      category: f.category,
      equipment: f.equipment,
      defaultSets: f.sets,
      defaultRepsRange: [f.repsMin, f.repsMax],
      defaultRestSeconds: f.rest,
      isBodyweight: f.isBodyweight,
      perHand: f.perHand,
      tracksDuration: f.section === 'sport' || f.section === 'cardio',
      defaultDuration: f.section === 'sport' || f.section === 'cardio' ? f.rest : undefined,
      createdAt: new Date().toISOString(),
    })
    onDone()
  }

  const toggleGroup = (g: MuscleGroup) =>
    set({
      muscleGroups: f.muscleGroups.includes(g)
        ? f.muscleGroups.filter((x) => x !== g)
        : [...f.muscleGroups, g],
    })

  return (
    <div className="card add-exercise">
      <div className="card-title">New {section === 'sport' ? 'sport' : 'exercise'}</div>
      <label className="field">
        <span className="field-label">Name</span>
        <input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Nordic Curl" />
      </label>

      <label className="field">
        <span className="field-label">Muscles trained</span>
        <div className="filter-chips">
          {MUSCLE_ORDER.map((g) => (
            <FilterChip
              key={g}
              label={MUSCLE_GROUP_LABELS[g]}
              active={f.muscleGroups.includes(g)}
              onClick={() => toggleGroup(g)}
            />
          ))}
        </div>
      </label>

      <div className="field-row">
        <label className="field">
          <span className="field-label">Equipment</span>
          <select value={f.equipment} onChange={(e) => set({ equipment: e.target.value })}>
            {EQUIPMENT_OPTIONS.map((eq) => (
              <option key={eq}>{eq}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Category</span>
          <select
            value={f.category}
            onChange={(e) => set({ category: e.target.value as ExerciseCategory })}
          >
            <option value="compound">Compound</option>
            <option value="isolation">Isolation</option>
          </select>
        </label>
      </div>

      <div className="field-row">
        {f.section === 'sport' || f.section === 'cardio' ? (
          <>
            <label className="field">
              <span className="field-label">Default duration (min)</span>
              <input
                type="number"
                min={1}
                value={f.rest}
                onChange={(e) => set({ rest: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <span className="field-label">Sets</span>
              <input
                type="number"
                min={0}
                value={f.sets}
                onChange={(e) => set({ sets: Number(e.target.value) })}
              />
            </label>
          </>
        ) : (
          <>
            <label className="field">
              <span className="field-label">Sets</span>
              <input
                type="number"
                min={1}
                value={f.sets}
                onChange={(e) => set({ sets: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <span className="field-label">Reps min</span>
              <input
                type="number"
                min={1}
                value={f.repsMin}
                onChange={(e) => set({ repsMin: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <span className="field-label">Reps max</span>
              <input
                type="number"
                min={1}
                value={f.repsMax}
                onChange={(e) => set({ repsMax: Number(e.target.value) })}
              />
            </label>
          </>
        )}
        <label className="field">
          <span className="field-label">Rest (s)</span>
          <input
            type="number"
            min={0}
            step={15}
            value={f.rest}
            onChange={(e) => set({ rest: Number(e.target.value) })}
          />
        </label>
      </div>

      <div className="check-row">
        <label className="check">
          <input
            type="checkbox"
            checked={f.isBodyweight}
            onChange={(e) => set({ isBodyweight: e.target.checked })}
          />
          Bodyweight
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={f.perHand}
            onChange={(e) => set({ perHand: e.target.checked })}
          />
          Per hand (dumbbells)
        </label>
      </div>

      <div className="exercise-detail-foot">
        <button className="btn-ghost btn" onClick={onDone}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          disabled={!f.name.trim() || f.muscleGroups.length === 0}
          onClick={() => void submit()}
        >
          Add {section === 'sport' ? 'sport' : 'exercise'}
        </button>
      </div>
    </div>
  )
}

function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m}m` : `${m}:${String(s).padStart(2, '0')}`
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
