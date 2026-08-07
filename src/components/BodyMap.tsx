import type { MuscleGroup } from '../types/exercise'

interface BodyMapProps {
  active?: MuscleGroup[]
  view?: 'front' | 'back' | 'both'
  className?: string
}

/**
 * Muscle anatomy illustration using the professional Male-Musculature SVG.
 * Highlights muscles by transitioning from grayscale to full color.
 * When active groups are provided, the SVG becomes vivid; otherwise it's muted.
 */
export default function BodyMap({ active, view = 'both', className }: BodyMapProps) {
  const hasActive = active && active.length > 0 && !active.includes('full')
  const showFullColor = !active || active.length === 0 || active.includes('full')

  return (
    <div className={`bodymap ${className ?? ''}`.trim()}>
      {(view === 'front' || view === 'both') && (
        <img
          src={`${import.meta.env.BASE_URL}musculature.svg`}
          alt="Muscle anatomy — front"
          className={`bodymap-img ${showFullColor ? 'bodymap-full' : hasActive ? 'bodymap-highlight' : 'bodymap-muted'}`}
          draggable={false}
        />
      )}
      {view === 'back' && (
        <img
          src={`${import.meta.env.BASE_URL}musculature.svg`}
          alt="Muscle anatomy — back"
          className="bodymap-img bodymap-mirror bodymap-muted"
          draggable={false}
        />
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
