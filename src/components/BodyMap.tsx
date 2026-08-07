import { Fragment } from 'react'
import type { MuscleGroup } from '../types/exercise'
import { BODY_DECO, BODY_OUTLINE, BODY_REGIONS, regionsFor, type BodyRegion } from '../data/body'

const VIEW_W = 240
const VIEW_H = 420
const MIRROR = `translate(${VIEW_W} 0) scale(-1 1)`

interface BodyMapProps {
  active?: MuscleGroup[]
  view?: 'front' | 'back' | 'both'
  className?: string
}

/**
 * Anatomical muscle map with body silhouette outline for context.
 * Regions are authored left-half and mirrored for symmetry.
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
        {/* Body silhouette outline — gives context to the muscle regions */}
        <path d={BODY_OUTLINE} className="body-silhouette" />

        {/* Decorative elements (head, neck) */}
        {deco.map((id) => (
          <use key={id} href={`#${id}`} className="body-deco" />
        ))}

        {/* Muscle regions — left + mirrored right */}
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
          {/* Head path for deco rendering */}
          <path id="head" d="M120 8 a18 22 0 1 0 0.01 0 Z" />
        </defs>
      </svg>
      {figures.map(figure)}
    </div>
  )
}
