import { Fragment } from 'react'
import type { MuscleGroup } from '../types/exercise'
import { BODY_DECO, BODY_REGIONS, regionsFor, regionById, type BodyRegion } from '../data/body'

const VIEW_W = 240
const VIEW_H = 440
/** Mirror the authoring (left-half) region around the vertical center. */
const MIRROR = `translate(${VIEW_W} 0) scale(-1 1)`

interface BodyMapProps {
  /** Muscle groups to light up. Empty = plain figure. */
  active?: MuscleGroup[]
  view?: 'front' | 'back' | 'both'
  className?: string
}

/**
 * Front/back anatomical muscle map. Authoring is left-half-only; every region
 * is mirrored to the right side so the figure is symmetric by construction.
 */
export default function BodyMap({ active, view = 'both', className }: BodyMapProps) {
  const lit = regionsFor(active)
  const figures: ('front' | 'back')[] = view === 'both' ? ['front', 'back'] : [view]

  const figure = (v: 'front' | 'back') => {
    const inView = (r: BodyRegion) => r.view === v || r.view === 'both'
    const regions = BODY_REGIONS.filter((r) => inView(r) && !r.deco)
    const deco = BODY_DECO[v]
    return (
      <svg
        key={v}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={`bodymap-figure bodymap-${v}`}
        role="img"
        aria-label={`${v} view${lit.size > 0 ? ' — highlighted muscles' : ''}`}
      >
        {deco.map((id) => (
          <use key={id} href={`#${id}`} className="body-deco" />
        ))}
        {regions.map((r) => {
          const cls = lit.has(r.id) ? 'body-region on' : 'body-region'
          if (r.centered) {
            return <use key={r.id} href={`#${r.id}`} className={cls} />
          }
          return (
            <Fragment key={r.id}>
              <use href={`#${r.id}`} className={cls} />
              <use href={`#${r.id}`} transform={MIRROR} className={cls} />
            </Fragment>
          )
        })}
      </svg>
    )
  }

  return (
    <div className={`bodymap ${className ?? ''}`.trim()}>
      <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
        <defs>
          {BODY_REGIONS.map((r) => (
            <path key={r.id} id={r.id} d={r.d} />
          ))}
          {(() => {
            const foot = regionById('foot')
            return foot ? <path id="foot" d={foot.d} /> : null
          })()}
        </defs>
      </svg>
      {figures.map(figure)}
    </div>
  )
}
