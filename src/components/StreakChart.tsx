/**
 * Training streak visualization — a horizontal row of dots showing
 * which days had training in the last 14 days. Simple, visual, motivating.
 */

import { motion } from 'framer-motion'
import type { WorkoutSession } from '../types/session'

interface Props {
  sessions: WorkoutSession[]
  days?: number
}

const W = 200
const H = 40
const DOT_R = 6

export default function StreakChart({ sessions, days = 14 }: Props) {
  const today = new Date()
  const dateSet = new Set(sessions.filter((s) => s.status === 'completed').map((s) => s.dateKey))

  const dots: { filled: boolean; label: string }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)
    dots.push({ filled: dateSet.has(key), label })
  }

  // Calculate streaks
  let currentStreak = 0
  let longestStreak = 0
  let streak = 0
  for (const dot of dots) {
    if (dot.filled) {
      streak++
      currentStreak = streak
    } else {
      longestStreak = Math.max(longestStreak, streak)
      streak = 0
    }
  }
  longestStreak = Math.max(longestStreak, streak)

  const spacing = (W - DOT_R * 2) / (dots.length - 1)

  return (
    <div className="streak-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="streak-svg">
        {dots.map((dot, i) => {
          const x = DOT_R + i * spacing
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={H / 2}
              r={DOT_R}
              fill={dot.filled ? 'var(--accent)' : 'var(--body-idle)'}
              opacity={dot.filled ? 0.9 : 0.3}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                bounce: 0.5,
                duration: 0.5,
                delay: i * 0.03,
              }}
              style={{ transformOrigin: `${x}px ${H / 2}px` }}
            />
          )
        })}
      </svg>
      <div className="streak-stats">
        <span className="streak-stat">
          <strong>{currentStreak}</strong> day streak
        </span>
        <span className="streak-stat">
          Best: <strong>{longestStreak}</strong> days
        </span>
      </div>
    </div>
  )
}
