import type { MuscleGroup } from '../types/exercise'

interface BodyMapProps {
  active?: MuscleGroup[]
  view?: 'front' | 'back' | 'both'
  className?: string
}

/**
 * Muscle anatomy illustration using the professional Male-Musculature SVG.
 * When specific muscles are targeted, accent-colored overlays pulse over
 * the corresponding body regions to indicate activation.
 */

// Approximate overlay positions for each muscle group (x%, y%, width%, height%)
// These are percentages of the SVG viewBox (861 x 1675)
const MUSCLE_OVERLAYS: Record<string, { x: number; y: number; w: number; h: number }> = {
  chest:    { x: 22, y: 13, w: 56, h: 10 },
  shoulders:{ x: 12, y: 11, w: 76, h: 6 },
  biceps:   { x: 8, y: 16, w: 14, h: 12 },
  triceps:  { x: 8, y: 16, w: 14, h: 12 },
  forearms: { x: 5, y: 28, w: 14, h: 12 },
  back:     { x: 22, y: 13, w: 56, h: 10 },
  legs:     { x: 20, y: 42, w: 60, h: 22 },
  glutes:   { x: 25, y: 36, w: 50, h: 8 },
  calves:   { x: 22, y: 66, w: 56, h: 10 },
  core:     { x: 30, y: 22, w: 40, h: 14 },
  full:     { x: 5, y: 8, w: 90, h: 75 },
}

export default function BodyMap({ active, view = 'both', className }: BodyMapProps) {
  const hasActive = active && active.length > 0 && !active.includes('full')
  const isFull = !active || active.length === 0 || active.includes('full')

  return (
    <div className={`bodymap ${className ?? ''}`.trim()}>
      {(view === 'front' || view === 'both') && (
        <div className="bodymap-container">
          <img
            src={`${import.meta.env.BASE_URL}musculature.svg`}
            alt="Muscle anatomy"
            className={`bodymap-img ${isFull ? 'bodymap-full' : hasActive ? 'bodymap-dim' : 'bodymap-muted'}`}
            draggable={false}
          />
          {/* Accent overlays for active muscles */}
          {hasActive && active.filter((g) => g !== 'full').map((g) => {
            const pos = MUSCLE_OVERLAYS[g]
            if (!pos) return null
            return (
              <div
                key={g}
                className="bodymap-overlay"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: `${pos.w}%`,
                  height: `${pos.h}%`,
                }}
              />
            )
          })}
        </div>
      )}
      {hasActive && (
        <div className="bodymap-label">
          {active.filter((g) => g !== 'full').map((g) => (
            <span key={g} className="bodymap-label-chip">{g}</span>
          ))}
        </div>
      )}
    </div>
  )
}
