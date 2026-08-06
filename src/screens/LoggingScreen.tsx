import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTodayPlan } from '../hooks/useTodayPlan'
import { db, SETTINGS_ID } from '../db/db'
import { finishWorkout, type FinishedExercise } from '../services/overload'
import { fromDisplayWeight, formatWeightNumber } from '../utils/format'
import SetRow, { type DraftSet } from '../components/SetRow'
import type { WorkoutExerciseLog, WorkoutSet } from '../types/session'

export default function LoggingScreen() {
  const plan = useTodayPlan()
  const navigate = useNavigate()
  const unit = plan.targetWeightUnit

  const [drafts, setDrafts] = useState<Record<string, DraftSet[]>>({})
  const [result, setResult] = useState<FinishedExercise[] | null>(null)
  const [saving, setSaving] = useState(false)

  // (Re)build the draft once the day loads or changes.
  useEffect(() => {
    if (!plan.day) return
    const init: Record<string, DraftSet[]> = {}
    for (const e of plan.entries) {
      const w =
        e.progress && e.progress.weightKg > 0
          ? formatWeightNumber(e.progress.weightKg, unit)
          : ''
      init[e.exercise.id] = Array.from({ length: e.eff.sets }, () => ({
        weight: w,
        reps: '',
        rpe: undefined,
      }))
    }
    setDrafts(init)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.day?.id])

  if (plan.isRestDay) {
    return (
      <div className="screen">
        <div className="empty">
          <div className="empty-icon">😴</div>
          <p>No workout scheduled today.</p>
          <button className="btn" onClick={() => navigate('/')}>
            Back to Today
          </button>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="screen">
        <div className="topbar-title">Workout saved 💪</div>
        <p className="muted small">
          {plan.dayName} · {plan.weekdayName} · targets updated for next time
        </p>
        {result.map((r) => (
          <div key={r.exerciseId} className="card">
            <div className="card-title">
              <span>Next session</span>
              <span className={`chip chip-${chipFor(r.instruction.mode)}`}>{modeLabel(r.instruction.mode)}</span>
            </div>
            <p className="instruction-text">{r.instruction.message}</p>
            {r.instruction.weightKg > 0 && (
              <div className="next-weight">
                <span className="mono">{formatWeightNumber(r.instruction.weightKg, unit)}</span>
                <span className="faint small">{unit} next time</span>
              </div>
            )}
          </div>
        ))}
        <button className="btn btn-primary btn-block" onClick={() => navigate('/')}>
          Back to Today
        </button>
      </div>
    )
  }

  const hasData = plan.entries.some(
    (e) => (drafts[e.exercise.id] ?? []).some((s) => parseInt(s.reps) > 0),
  )

  async function handleFinish() {
    const logs: WorkoutExerciseLog[] = []
    for (const e of plan.entries) {
      const sets: WorkoutSet[] = []
      for (const row of drafts[e.exercise.id] ?? []) {
        const reps = parseInt(row.reps, 10)
        const weight = parseFloat(row.weight)
        if (Number.isNaN(reps) || reps < 1) continue
        if (Number.isNaN(weight) || weight < 0) continue
        sets.push({ weightKg: fromDisplayWeight(weight, unit), reps, rpe: row.rpe })
      }
      if (sets.length > 0) {
        logs.push({ exerciseId: e.exercise.id, exerciseName: e.exercise.name, sets })
      }
    }
    if (logs.length === 0 || !plan.splitId || !plan.day) return

    setSaving(true)
    try {
      const [exercises, settings, split] = await Promise.all([
        db.exercises.toArray(),
        db.settings.get(SETTINGS_ID),
        db.splits.get(plan.splitId),
      ])
      if (!settings || !split) return
      const { results } = await finishWorkout({
        split,
        day: plan.day,
        logs,
        exercises,
        settings,
        dateKey: plan.today,
      })
      setResult(results)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen logging-screen">
      <div className="topbar-title">
        {plan.dayName} <span className="faint small">· {plan.weekdayName}</span>
      </div>

      {plan.entries.map((e) => {
        const rows = drafts[e.exercise.id] ?? []
        return (
          <div key={e.exercise.id} className="card">
            <div className="exercise-head">
              <div>
                <div className="exercise-name">{e.exercise.name}</div>
                <div className="faint small">
                  {e.eff.sets} sets · {e.eff.repsRange[0]}–{e.eff.repsRange[1]} reps
                  {e.progress && e.progress.weightKg > 0
                    ? ` · ${formatWeightNumber(e.progress.weightKg, unit)} ${unit}`
                    : ''}
                </div>
              </div>
              {rows.length > 1 && (
                <button
                  type="button"
                  className="btn-ghost btn"
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  onClick={() =>
                    setDrafts((d) => ({
                      ...d,
                      [e.exercise.id]: [...d[e.exercise.id], { weight: '', reps: '', rpe: undefined }],
                    }))
                  }
                >
                  + set
                </button>
              )}
            </div>

            {rows.map((row, i) => (
              <SetRow
                key={i}
                index={i + 1}
                set={row}
                unit={unit}
                onChange={(next) =>
                  setDrafts((d) => {
                    const list = [...d[e.exercise.id]]
                    list[i] = next
                    return { ...d, [e.exercise.id]: list }
                  })
                }
                onRemove={() =>
                  setDrafts((d) => ({
                    ...d,
                    [e.exercise.id]: d[e.exercise.id].filter((_, j) => j !== i),
                  }))
                }
              />
            ))}

            {rows.length === 0 && (
              <button
                type="button"
                className="btn btn-block"
                onClick={() =>
                  setDrafts((d) => ({ ...d, [e.exercise.id]: [{ weight: '', reps: '', rpe: undefined }] }))
                }
              >
                + Add set
              </button>
            )}
          </div>
        )
      })}

      <button
        className="btn btn-primary btn-block finish-btn"
        disabled={!hasData || saving}
        onClick={handleFinish}
      >
        {saving ? 'Saving…' : 'Finish workout'}
      </button>
    </div>
  )
}

function chipFor(mode: string): string {
  switch (mode) {
    case 'increase':
    case 'range-bump':
      return 'good'
    case 'deload':
    case 'deload-suggested':
      return 'warn'
    case 'hold-high-rpe':
      return 'danger'
    default:
      return 'accent'
  }
}

function modeLabel(mode: string): string {
  switch (mode) {
    case 'increase':
    case 'range-bump':
      return 'Up next'
    case 'deload':
      return 'Deload'
    case 'deload-suggested':
      return 'Consider deload'
    case 'hold-high-rpe':
      return 'Hold'
    case 're-acclimate':
      return 'Re-acclimate'
    default:
      return 'Keep at it'
  }
}
