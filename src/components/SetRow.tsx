import RpePicker from './RpePicker'
import type { WeightUnit } from '../types/settings'

/** A set being entered. Weight/reps are raw input strings in the display unit. */
export interface DraftSet {
  weight: string
  reps: string
  rpe?: number
}

interface Props {
  index: number
  set: DraftSet
  unit: WeightUnit
  /** Dumbbells: weights are per hand — label the field accordingly. */
  perHand?: boolean
  onChange: (set: DraftSet) => void
  onRemove: () => void
}

export default function SetRow({ index, set, unit, perHand, onChange, onRemove }: Props) {
  return (
    <div className="set-row">
      <span className="set-index">{index}</span>
      <label className="set-field">
        <span className="set-field-label">
          {perHand ? `Weight/hand (${unit})` : `Weight (${unit})`}
        </span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          placeholder="0"
          value={set.weight}
          onChange={(e) => onChange({ ...set, weight: e.target.value })}
        />
      </label>
      <label className="set-field">
        <span className="set-field-label">Reps</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step="1"
          placeholder="0"
          value={set.reps}
          onChange={(e) => onChange({ ...set, reps: e.target.value })}
        />
      </label>
      <button
        type="button"
        className="set-remove"
        aria-label={`Remove set ${index}`}
        onClick={onRemove}
      >
        ✕
      </button>
      <RpePicker value={set.rpe} onChange={(rpe) => onChange({ ...set, rpe })} />
    </div>
  )
}
