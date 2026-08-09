import { useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { formatRestSeconds } from '../utils/format'

interface RestTimerProps {
  /** Target rest duration in seconds. */
  durationSeconds: number
  /** Exercise name (shown in the timer card). */
  exerciseName: string
  /** Called when the timer finishes or is dismissed. */
  onDone: () => void
}

/**
 * Floating countdown timer. Auto-starts on mount, counts down every second,
 * shows a progress ring + mm:ss. Dismiss/skip button calls onDone.
 * Honors prefers-reduced-motion (no ring animation).
 */
export default function RestTimer({ durationSeconds, exerciseName, onDone }: RestTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const doneRef = useRef(false)

  const dismiss = useCallback(() => {
    doneRef.current = true
    if (intervalRef.current) clearInterval(intervalRef.current)
    onDone()
  }, [onDone])

  useEffect(() => {
    setRemaining(durationSeconds)
    doneRef.current = false
  }, [durationSeconds])

  useEffect(() => {
    if (remaining <= 0) {
      if (!doneRef.current) {
        doneRef.current = true
        // Vibrate if available (mobile feedback)
        if (navigator.vibrate) navigator.vibrate(200)
        // Auto-dismiss after a brief "done" flash
        const t = setTimeout(onDone, 1200)
        return () => clearTimeout(t)
      }
      return
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [remaining <= 0, onDone]) // eslint-disable-line react-hooks/exhaustive-deps

  const progress = durationSeconds > 0 ? remaining / durationSeconds : 0
  const isDone = remaining <= 0
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const timeStr = `${m}:${String(s).padStart(2, '0')}`

  // SVG ring — 120px diameter, 6px stroke
  const size = 120
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  return (
    <AnimatePresence>
      <motion.div
        className="rest-timer-overlay"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className={`rest-timer-card ${isDone ? 'rest-timer-done' : ''}`}>
          <div className="rest-timer-ring">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth={stroke}
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={isDone ? 'var(--good)' : 'var(--accent)'}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
            </svg>
            <div className="rest-timer-time">
              <span className="rest-timer-digits">{timeStr}</span>
              <span className="rest-timer-label">{isDone ? 'Go!' : 'rest'}</span>
            </div>
          </div>
          <div className="rest-timer-info">
            <span className="rest-timer-exercise">{exerciseName}</span>
            <span className="rest-timer-target">{formatRestSeconds(durationSeconds)} target</span>
          </div>
          <button
            type="button"
            className="rest-timer-dismiss"
            onClick={dismiss}
            aria-label="Dismiss timer"
          >
            {isDone ? 'Done' : 'Skip'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
