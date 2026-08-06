import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTodayPlan } from '../hooks/useTodayPlan'
import { useSessions } from '../hooks/useSessions'
import { useProgress } from '../hooks/useProgress'
import { useSettings } from '../hooks/useSettings'
import { db } from '../db/db'
import { generateTips, type Tip } from '../services/tips'
import { computeTopSet } from '../services/overload'
import {
  formatWeightNumber,
  formatRepRange,
  formatRestSeconds,
  perHandSuffix,
  toDisplayWeight,
} from '../utils/format'
import { addDaysToKey, formatDateKey, weekdayIndex } from '../utils/date'
import { defaultParams } from '../algorithm/params'
import type { Instruction } from '../algorithm/progression'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function TodayScreen() {
  const plan = useTodayPlan()
  const { sessions } = useSessions()
  const { progress } = useProgress()
  const { settings } = useSettings()
  const exercises = useLiveQuery(() => db.exercises.toArray(), []) ?? []
  const params = settings?.params ?? defaultParams()
  const tips = useMemo(
    () =>
      generateTips({
        body: settings?.body,
        progress,
        sessions,
        exercises,
        params,
        today: plan.today,
      }),
    [settings?.body, progress, sessions, exercises, params, plan.today],
  )
  const unit = plan.targetWeightUnit

  const lastSession = sessions[0]
  const warned = plan.entries.some(
    (e) => e.target.mode === 'deload' || e.target.mode === 'deload-suggested',
  )

  return (
    <div className="screen today-screen">
      <header className="today-header">
        <div>
          <div className="faint small">
            {formatDateKey(plan.today)} · {plan.splitName ?? '—'}
          </div>
          <h2>
            {plan.isRestDay ? 'Rest day' : plan.dayName}{' '}
            <span className="faint">· {plan.weekdayName}</span>
          </h2>
        </div>
        <span className="chip">{DAY_LABELS[new Date().getDay()]}</span>
      </header>

      {tips.length > 0 && <TipsSection tips={tips} />}

      {plan.isRestDay ? (
        <>
          <RestDay plan={plan} />
          <BodyCard settings={settings} />
        </>
      ) : (
        <>
          {warned && (
            <div className="card warn-card">
              <span className="chip chip-warn">Deload week</span>
              <p className="small muted" style={{ marginTop: 8, marginBottom: 0 }}>
                Some lifts are flagged — keep the load light and let your body catch up.
              </p>
            </div>
          )}

          {plan.entries.map((e) => (
            <Link to="/log" key={e.exercise.id} className="card exercise-card">
              <div className="exercise-card-top">
                <span className="exercise-name">{e.exercise.name}</span>
                <span className={`chip chip-${chipFor(e.target.mode)}`}>
                  {modeLabel(e.target.mode)}
                </span>
              </div>

              {e.target.mode === 'new' ? (
                <div className="target-big faint">
                  Log your first set
                  <span className="target-sub">{e.eff.repsRange[0]}–{e.eff.repsRange[1]} reps · {e.eff.sets} sets</span>
                </div>
              ) : (
                <div className="target-big">
                  {e.target.weightKg > 0 ? (
                    <>
                      {formatWeightNumber(e.target.weightKg, unit)}
                      <span className="target-unit">
                        {unit}
                        {perHandSuffix(e.exercise.perHand)}
                      </span>
                      <span className="target-x"> × {formatRepRange(e.target.repsRange)}</span>
                    </>
                  ) : (
                    formatRepRange(e.target.repsRange) + ' reps'
                  )}
                  <span className="target-sub">
                    {e.eff.sets} sets · {formatRestSeconds(e.eff.restSeconds)} rest · RPE ≤ {e.target.rpeTarget}
                  </span>
                </div>
              )}

              <p className="small muted target-msg">{e.target.message}</p>

              <div className="exercise-card-foot">
                <span className="muted small">Tap to log</span>
                {lastSession && <LastResult exerciseId={e.exercise.id} lastSession={lastSession} unit={unit} />}
              </div>
            </Link>
          ))}

          <Link to="/log" className="btn btn-primary btn-block start-btn">
            Start workout
          </Link>
        </>
      )}
    </div>
  )
}

function RestDay({ plan }: { plan: ReturnType<typeof useTodayPlan> }) {
  const next = nextWorkout(plan)
  return (
    <div className="empty">
      <div className="empty-icon">😴</div>
      <h3>Rest day</h3>
      <p className="muted">
        Recovery is where the gains happen.
        {next && (
          <>
            <br />
            Next up: <strong>{next.name}</strong> on {formatDateKey(next.dateKey)}.
          </>
        )}
      </p>
      {plan.splitName && <span className="chip chip-accent">{plan.splitName}</span>}
    </div>
  )
}

/** The next scheduled (non-rest) day within the next 7 days. */
function nextWorkout(plan: ReturnType<typeof useTodayPlan>): { name: string; dateKey: string } | null {
  const split = plan.split
  if (!split) return null
  for (let offset = 1; offset <= 7; offset++) {
    const dateKey = addDaysToKey(plan.today, offset)
    const dayKey = split.schedule[weekdayIndex(dateKey)] ?? null
    if (dayKey) {
      const day = split.days[dayKey]
      if (day && !day.isRest) return { name: day.name, dateKey }
    }
  }
  return null
}

function LastResult({
  exerciseId,
  lastSession,
  unit,
}: {
  exerciseId: string
  lastSession: NonNullable<ReturnType<typeof useSessions>['sessions']>[number]
  unit: 'kg' | 'lb'
}) {
  const log = lastSession.logs.find((l) => l.exerciseId === exerciseId)
  if (!log || log.sets.length === 0) return null
  const top = computeTopSet(log.sets)
  if (!top) return null
  return (
    <span className="faint small">
      Last: {formatWeightNumber(top.weightKg, unit)} {unit} × {top.reps}
      {perHandSuffix(log.perHand)}
    </span>
  )
}

function TipsSection({ tips }: { tips: Tip[] }) {
  return (
    <div className="card tips-card">
      <div className="card-title">Tips</div>
      {tips.map((t) => (
        <div key={t.id} className="tip-row">
          <span className={`chip chip-${t.accent}`}>{t.accent}</span>
          <div className="tip-text">
            <span className="tip-headline">{t.headline}</span>
            {t.detail && <span className="tip-detail faint small">{t.detail}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function BodyCard({ settings }: { settings: ReturnType<typeof useSettings>['settings'] }) {
  const body = settings?.body
  const unit = settings?.weightUnit ?? 'kg'
  if (!body) {
    return (
      <div className="card tips-card">
        <div className="card-title">Your body</div>
        <p className="muted small">
          Add your body profile in{' '}
          <Link to="/settings" style={{ color: 'var(--accent)' }}>
            Settings
          </Link>{' '}
          to see your avatar and personalized recommendations.
        </p>
      </div>
    )
  }
  return (
    <div className="card tips-card">
      <div className="card-title">Your body</div>
      <div className="body-stats">
        <span>{body.sex}</span>
        <span>{body.ageYears} yrs</span>
        <span>{body.heightCm} cm</span>
        <span>
          {Math.round(toDisplayWeight(body.bodyWeightKg, unit) * 10) / 10} {unit}
        </span>
        {body.bodyFatPct != null && <span>{body.bodyFatPct}% fat</span>}
        <span>{body.activityLevel}</span>
      </div>
    </div>
  )
}

function chipFor(mode: Instruction['mode']): string {
  switch (mode) {
    case 'deload':
    case 'deload-suggested':
      return 'warn'
    case 're-acclimate':
      return 'accent'
    default:
      return 'accent'
  }
}

function modeLabel(mode: Instruction['mode']): string {
  switch (mode) {
    case 'deload':
      return 'Deload week'
    case 'deload-suggested':
      return 'Light week'
    case 're-acclimate':
      return 'Re-acclimate'
    case 'new':
      return 'First time'
    default:
      return 'On track'
  }
}
