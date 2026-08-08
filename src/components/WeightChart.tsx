/**
 * Inline SVG line chart of body-weight history (from the Apple Health import).
 * Pure component — mirrors VolumeChart's styling (chart-grid / chart-label).
 */

import type { BodyWeightPoint, WeightUnit } from '../types/settings'
import { toDisplayWeight } from '../utils/format'

interface Props {
  /** Most recent first (as the Health parser returns). */
  points: BodyWeightPoint[]
  unit: WeightUnit
}

const W = 320
const H = 120
const PAD = { top: 14, right: 34, bottom: 24, left: 8 }
/** Chart stays legible regardless of how much history was imported. */
const MAX_POINTS = 180

export default function WeightChart({ points, unit }: Props) {
  const ordered = [...points].reverse().slice(-MAX_POINTS) // oldest → newest
  if (ordered.length < 2) {
    return (
      <p className="muted small" style={{ padding: '6px 0' }}>
        Import at least two weight entries to see a trend.
      </p>
    )
  }

  const weights = ordered.map((p) => toDisplayWeight(p.weightKg, unit))
  let min = Math.min(...weights)
  let max = Math.max(...weights)
  if (max - min < 1) {
    min -= 1
    max += 1
  }
  const span = max - min
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const x = (i: number) => PAD.left + (i / (ordered.length - 1)) * plotW
  const y = (w: number) => PAD.top + (1 - (w - min) / span) * plotH

  const line = ordered
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(toDisplayWeight(p.weightKg, unit)).toFixed(1)}`)
    .join(' ')
  const area = `${line} L${x(ordered.length - 1).toFixed(1)},${H - PAD.bottom} L${x(0).toFixed(1)},${H - PAD.bottom} Z`

  const last = ordered[ordered.length - 1]
  const lastVal = toDisplayWeight(last.weightKg, unit)
  const lastLabel = Number.isInteger(lastVal) ? String(lastVal) : lastVal.toFixed(1)
  const first = ordered[0]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="volume-chart"
      role="img"
      aria-label="Body-weight trend"
    >
      {/* Baseline gridline */}
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={H - PAD.bottom}
        y2={H - PAD.bottom}
        className="chart-grid"
      />

      {/* Area + line */}
      <path d={area} fill="var(--accent)" opacity={0.12} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Latest point + value */}
      <circle cx={x(ordered.length - 1)} cy={y(lastVal)} r={3.5} fill="var(--accent)" />
      <text x={W - PAD.right} y={PAD.top + 2} textAnchor="end" className="chart-label">
        {lastLabel} {unit}
      </text>

      {/* First / last date */}
      <text x={x(0)} y={H - 4} textAnchor="start" className="chart-label">
        {first.date.slice(5)}
      </text>
      <text x={x(ordered.length - 1)} y={H - 4} textAnchor="end" className="chart-label">
        {last.date.slice(5)}
      </text>
    </svg>
  )
}
