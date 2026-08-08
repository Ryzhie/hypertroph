/**
 * Inline SVG bar chart of daily training volume.
 * Pure component — no external charting library needed.
 */

import { motion } from 'framer-motion'
import type { WorkoutSession } from '../types/session'
import { toDisplayWeight } from '../utils/format'

interface Props {
  sessions: WorkoutSession[]
  unit: 'kg' | 'lb'
  days?: number
}

const W = 320
const H = 120
const PAD = { top: 14, right: 8, bottom: 24, left: 8 }

export default function VolumeChart({ sessions, unit, days = 30 }: Props) {
  // Build daily volume map for last N days
  const today = new Date()
  const dailyVol: { date: string; label: string; vol: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.getDate().toString()
    dailyVol.push({ date: key, label, vol: 0 })
  }

  // Sum volume per day
  for (const s of sessions) {
    if (s.status !== 'completed') continue
    const bucket = dailyVol.find((d) => d.date === s.dateKey)
    if (!bucket) continue
    for (const log of s.logs) {
      const sides = log.perHand ? 2 : 1
      for (const set of log.sets) bucket.vol += set.weightKg * sides * set.reps
    }
  }

  const values = dailyVol.map((d) => toDisplayWeight(d.vol, unit))
  const maxVol = Math.max(...values, 1)
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const barW = Math.max(1, Math.floor(plotW / dailyVol.length) - 1)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="volume-chart"
      role="img"
      aria-label={`Training volume over the last ${days} days`}
    >
      {/* Gridline at baseline */}
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={H - PAD.bottom}
        y2={H - PAD.bottom}
        className="chart-grid"
      />

      {/* Bars — grow in from the baseline, staggered, with a spring feel */}
      {dailyVol.map((d, i) => {
        const val = values[i]
        const barH = maxVol > 0 ? (val / maxVol) * plotH : 0
        const x = PAD.left + i * (plotW / dailyVol.length)
        const y = H - PAD.bottom - barH
        return (
          <motion.rect
            key={d.date}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={2}
            fill={val > 0 ? 'var(--accent)' : 'var(--body-idle)'}
            opacity={val > 0 ? 0.85 : 0.3}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{
              type: 'spring',
              bounce: 0.35,
              duration: 0.6,
              delay: i * 0.02,
            }}
            style={{ transformOrigin: `${x + barW / 2}px ${H - PAD.bottom}px` }}
          />
        )
      })}

      {/* X-axis labels (every 5th day) */}
      {dailyVol.map((d, i) => {
        if (i % 5 !== 0) return null
        const x = PAD.left + i * (plotW / dailyVol.length) + barW / 2
        return (
          <text key={d.date} x={x} y={H - 4} textAnchor="middle" className="chart-label">
            {d.label}
          </text>
        )
      })}

      {/* Max volume label */}
      {maxVol > 0 && (
        <text x={W - PAD.right} y={PAD.top + 2} textAnchor="end" className="chart-label">
          {fmtVol(maxVol)}
        </text>
      )}
    </svg>
  )
}

function fmtVol(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
  return `${Math.round(v)}`
}
