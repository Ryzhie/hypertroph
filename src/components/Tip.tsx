import { useState } from 'react'

/** A small "?" icon that shows a popover explanation on tap/hover. */
export default function Tip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="tip-wrap">
      <button
        type="button"
        className="tip-trigger"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label="More info"
      >
        ?
      </button>
      {open && <span className="tip-bubble">{children}</span>}
    </span>
  )
}

export const GLOSSARY: Record<string, string> = {
  e1rm: 'Estimated 1-Rep Max — the heaviest weight you could lift for one rep, calculated from your actual sets using the Epley formula.',
  rpe: 'Rate of Perceived Exertion — how hard a set felt on a scale of 6-10. RPE 8 = "Just right" (2 reps in reserve).',
  volume: 'Total weight x reps moved across all sets. A measure of total training work.',
  'rest-day': 'A scheduled day without training, essential for muscle recovery and growth.',
  deload: 'A planned reduction in training load to allow recovery — usually 10% less weight for a week.',
  perhand: 'Weight is per side (dumbbells). Volume counts both sides.',
  progression: 'Gradually increasing weight, reps, or volume over time to drive strength gains.',
}
