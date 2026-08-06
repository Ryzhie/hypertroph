import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSessions } from '../hooks/useSessions'
import { useProgress } from '../hooks/useProgress'
import { useSettings } from '../hooks/useSettings'
import { computeTopSet } from '../services/overload'
import { formatWeight, formatWeightNumber, toDisplayWeight } from '../utils/format'
import { daysBetween, formatDateKey, todayKey } from '../utils/date'
import type { WeightUnit } from '../types/settings'
import type { WorkoutSession, WorkoutSet } from '../types/session'
import type { E1rmPoint, ExerciseProgress } from '../types/progress'

type View = 'sessions' | 'progress'

export default function HistoryScreen() {
  const { sessions } = useSessions()
  const { settings } = useSettings()
  const unit = settings?.weightUnit ?? 'kg'
  const [view, setView] = useState<View>('sessions')

  return (
    <div className="screen history-screen">
      <h2 className="topbar-title">History</h2>

      <div className="segment view-toggle">
        <button className={view === 'sessions' ? 'selected' : ''} onClick={() => setView('sessions')}>
          Sessions
        </button>
        <button className={view === 'progress' ? 'selected' : ''} onClick={() => setView('progress')}>
          Progress
        </button>
      </div>

      {view === 'sessions' ? (
        <SessionsView sessions={sessions} unit={unit} />
      ) : (
        <ProgressView sessions={sessions} unit={unit} />
      )}
    </div>
  )
}

/* ---------- Sessions ---------- */

function SessionsView({ sessions, unit }: { sessions: WorkoutSession[]; unit: WeightUnit }) {
  if (sessions.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">📈</div>
        <h3>No workouts yet</h3>
        <p className="muted">Finish your first session from Today and it will show up here.</p>
      </div>
    )
  }

  const totalVolume = sessions.reduce((sum, s) => sum + sessionVolume(s), 0)

  return (
    <>
      <div className="stat-row">
        <StatTile label="Sessions" value={String(sessions.length)} />
        <StatTile label="Total volume" value={`${fmtNum(toDisplayWeight(totalVolume, unit))} ${unit}·r`} />
      </div>

      {sessions.map((s, i) => (
        <SessionCard key={s.id} session={s} unit={unit} defaultOpen={i === 0} />
      ))}
    </>
  )
}

function SessionCard({
  session,
  unit,
  defaultOpen,
}: {
  session: WorkoutSession
  unit: WeightUnit
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const volume = toDisplayWeight(sessionVolume(session), unit)
  const logged = session.logs.filter((l) => l.sets.length > 0)

  return (
    <div className="card session-card">
      <button type="button" className="session-toggle" onClick={() => setOpen((o) => !o)}>
        <span className="session-toggle-text">
          <span className="session-title">
            {formatDateKey(session.dateKey)}
            <span className="chip chip-accent">{session.dayName}</span>
          </span>
          <span className="faint small">{session.splitName}</span>
        </span>
        <span className="chevron" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>

      {!open ? (
        <ul className="session-summary">
          {logged.map((l, i) => (
            <li key={i}>
              <span className="muted small">{l.exerciseName}</span>
              <span className="mono small">{topSetLabel(l.sets, unit)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="session-detail">
          {logged.map((l, i) => (
            <div key={i} className="hist-exercise">
              <div className="hist-exercise-name">{l.exerciseName}</div>
              <div className="hist-sets">
                {l.sets.map((set, j) => (
                  <div key={j} className="hist-set">
                    <span className="set-index">{j + 1}</span>
                    <span className="mono">
                      {set.weightKg > 0 ? `${formatWeightNumber(set.weightKg, unit)} ${unit}` : ''}
                    </span>
                    <span className="mono faint">× {set.reps}</span>
                    {set.rpe != null && <span className="faint small">RPE {set.rpe}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="session-foot">
        <span className="muted small">Volume</span>
        <span className="mono">
          {fmtNum(volume)} {unit}·r
        </span>
      </div>
    </div>
  )
}

/* ---------- Progress ---------- */

function ProgressView({ sessions, unit }: { sessions: WorkoutSession[]; unit: WeightUnit }) {
  const { progress } = useProgress()
  const exercises = useLiveQuery(() => db.exercises.toArray(), []) ?? []

  // Exercises that actually have carried overload state.
  const withProgress = exercises.filter((e) => progress[e.id])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const active = withProgress.find((e) => e.id === selectedId) ?? withProgress[0]

  if (withProgress.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">📈</div>
        <h3>No strength data yet</h3>
        <p className="muted">Log a few sessions and the estimated one-rep max trend for each lift appears here.</p>
      </div>
    )
  }

  return (
    <>
      <div className="field progress-select">
        <label htmlFor="progress-exercise">Exercise</label>
        <select id="progress-exercise" value={active.id} onChange={(e) => setSelectedId(e.target.value)}>
          {withProgress.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      <ProgressDetail
        sessions={sessions}
        exerciseId={active.id}
        name={active.name}
        isBodyweight={active.isBodyweight === true}
        unit={unit}
      />
    </>
  )
}

function ProgressDetail({
  sessions,
  exerciseId,
  name,
  isBodyweight,
  unit,
}: {
  sessions: WorkoutSession[]
  exerciseId: string
  name: string
  isBodyweight: boolean
  unit: WeightUnit
}) {
  const { progress } = useProgress()
  const p = progress[exerciseId]
  if (!p) return null

  const status = statusChip(p)
  const recent = p.e1rmHistory.slice(-20).reverse()
  const lastTop = p.lastTopSet
  const topByDate = topSetByDate(sessions, exerciseId, unit)

  return (
    <div className="card progress-card">
      <div className="exercise-card-top">
        <span className="exercise-name">{name}</span>
        <span className={`chip chip-${status.cls}`}>{status.label}</span>
      </div>

      <div className="stat-row">
        {!isBodyweight ? (
          <StatTile
            label="Current target"
            value={
              p.weightKg > 0
                ? `${formatWeightNumber(p.weightKg, unit)} ${unit}`
                : 'Bodyweight'
            }
            sub={`${p.repsRange[0]}–${p.repsRange[1]} reps`}
          />
        ) : (
          <StatTile label="Current target" value={`${p.repsRange[0]}–${p.repsRange[1]}`} sub="reps" />
        )}
        <StatTile
          label="e1RM best"
          value={p.e1rmBest > 0 ? `${fmtNum(toDisplayWeight(p.e1rmBest, unit))} ${unit}` : '—'}
          sub={p.e1rmBestDate ? formatDateKey(p.e1rmBestDate) : undefined}
        />
        <StatTile label="At this weight" value={String(p.sessionsAtWeight)} sub={p.sessionsAtWeight === 1 ? 'session' : 'sessions'} />
        <StatTile
          label="Stall streak"
          value={String(p.stallStreak)}
          sub={p.stallStreak > 0 ? 'below target' : 'none'}
        />
      </div>

      {!isBodyweight && p.e1rmHistory.length > 0 && (
        <>
          <div className="card-title" style={{ marginTop: 8 }}>
            Estimated 1RM · {p.e1rmHistory.length} sessions
          </div>
          <E1rmChart history={p.e1rmHistory} unit={unit} />
        </>
      )}

      {recent.length > 0 && (
        <>
          <div className="card-title">Recent</div>
          <table className="hist-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Top set</th>
                <th className="num">e1RM</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((pt, i) => (
                <tr key={i}>
                  <td className="muted small">{formatDateKey(pt.date)}</td>
                  <td className="num mono small">{topByDate.get(pt.date) ?? '—'}</td>
                  <td className="num mono small">
                    {fmtNum(toDisplayWeight(pt.e1rm, unit))} {unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {lastTop && p.lastSessionDate && (
        <p className="muted small" style={{ margin: '10px 0 0' }}>
          Last session: {formatDateKey(p.lastSessionDate)} ·{' '}
          {topSetText(lastTop.weightKg, lastTop.reps, unit)}
          {lastTop.rpe != null ? ` · RPE ${lastTop.rpe}` : ''}
        </p>
      )}
    </div>
  )
}

function statusChip(p: ExerciseProgress): { cls: string; label: string } {
  if (p.suggestDeload) return { cls: 'warn', label: 'Consider deload' }
  if (p.deloadedAt && daysBetween(p.deloadedAt, todayKey()) <= 7) {
    return { cls: 'warn', label: 'Deload week' }
  }
  if (p.stallStreak > 0) return { cls: 'danger', label: 'Stalled' }
  return { cls: 'good', label: 'On track' }
}

/* ---------- Small bits ---------- */

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat-tile">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}

function sessionVolume(s: WorkoutSession): number {
  let v = 0
  for (const log of s.logs) for (const set of log.sets) v += set.weightKg * set.reps
  return v
}

/** Display text for a top set; bodyweight (weightKg 0) shows reps only. */
function topSetText(weightKg: number, reps: number, unit: WeightUnit): string {
  if (weightKg <= 0) return `× ${reps}`
  return `${formatWeight(weightKg, unit)} × ${reps}`
}

function topSetLabel(sets: WorkoutSet[], unit: WeightUnit): string {
  const top = computeTopSet(sets)
  if (!top) return '—'
  return topSetText(top.weightKg, top.reps, unit)
}

/**
 * The most recent session's top set, keyed by dateKey, for one exercise.
 * Sessions are newest-first, so the first write per date wins (latest of the day).
 */
function topSetByDate(
  sessions: WorkoutSession[],
  exerciseId: string,
  unit: WeightUnit,
): Map<string, string> {
  const m = new Map<string, string>()
  for (const s of sessions) {
    if (m.has(s.dateKey)) continue
    for (const log of s.logs) {
      if (log.exerciseId !== exerciseId) continue
      const top = computeTopSet(log.sets)
      if (top) m.set(s.dateKey, topSetText(top.weightKg, top.reps, unit))
    }
  }
  return m
}

function fmtNum(n: number): string {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

/* ---------- e1RM trend chart (single series, inline SVG) ---------- */

const CHART_W = 320
const CHART_H = 110
const PAD_LEFT = 36
const PAD_RIGHT = 6
const PAD_TOP = 16
const PAD_BOTTOM = 14

function E1rmChart({ history, unit }: { history: E1rmPoint[]; unit: WeightUnit }) {
  const n = history.length
  if (n === 0) return null

  const values = history.map((pt) => toDisplayWeight(pt.e1rm, unit))
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min -= 1
    max += 1
  }
  const span = max - min
  const plotW = CHART_W - PAD_LEFT - PAD_RIGHT
  const plotH = CHART_H - PAD_TOP - PAD_BOTTOM

  const x = (i: number) => (n === 1 ? PAD_LEFT + plotW / 2 : PAD_LEFT + (i * plotW) / (n - 1))
  const y = (v: number) => PAD_TOP + (1 - (v - min) / span) * plotH

  const pts = values.map((v, i) => [x(i), y(v)] as const)
  const line = pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ')
  const baseline = CHART_H - PAD_BOTTOM
  const maxY = y(max)
  const area =
    `M ${pts[0][0].toFixed(1)} ${baseline} ` +
    pts.map(([px, py]) => `L ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ') +
    ` L ${pts[n - 1][0].toFixed(1)} ${baseline} Z`

  const [lx, ly] = pts[n - 1]
  const endAnchor = lx > CHART_W - 46 ? 'end' : 'start'
  const endX = lx > CHART_W - 46 ? lx - 9 : lx + 9
  const lastValue = `${fmtNum(values[n - 1])} ${unit}`

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="e1rm-chart"
      role="img"
      aria-label={`Estimated one-rep max over ${n} sessions, latest ${lastValue}`}
    >
      <defs>
        <linearGradient id="e1rm-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Recessive y-scale: min/max hairlines with value labels, so the line
          reads against a scale instead of floating on the surface. */}
      <line x1={PAD_LEFT} x2={CHART_W - PAD_RIGHT} y1={maxY} y2={maxY} className="e1rm-grid" />
      <line x1={PAD_LEFT} x2={CHART_W - PAD_RIGHT} y1={baseline} y2={baseline} className="e1rm-grid" />
      <text x={2} y={maxY - 3} className="e1rm-axis-label">
        {fmtNum(max)}
      </text>
      <text x={2} y={baseline + 3} className="e1rm-axis-label">
        {fmtNum(min)}
      </text>

      <path d={area} fill="url(#e1rm-fill)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lx} cy={ly} r={4.5} fill="var(--accent)" stroke="var(--bg-elevated)" strokeWidth={2} />
      <text x={endX} y={ly - 9} textAnchor={endAnchor} className="e1rm-end-label">
        {lastValue}
      </text>
      <text x={PAD_LEFT} y={CHART_H - 2} className="e1rm-axis-label">
        {formatDateKey(history[0].date)}
      </text>
      <text x={CHART_W - PAD_RIGHT} y={CHART_H - 2} textAnchor="end" className="e1rm-axis-label">
        {formatDateKey(history[n - 1].date)}
      </text>
    </svg>
  )
}
