import { RPE_PRESETS } from '../types/progress'

interface Props {
  value?: number
  onChange: (rpe?: number) => void
}

/** One-tap effort rating. Tap again to clear. Maps to RPE 7/8/9/10. */
export default function RpePicker({ value, onChange }: Props) {
  return (
    <div className="segment rpe-picker">
      {RPE_PRESETS.map((p) => (
        <button
          key={p.rpe}
          type="button"
          className={value === p.rpe ? 'selected' : ''}
          onClick={() => onChange(value === p.rpe ? undefined : p.rpe)}
          title={`RPE ${p.rpe}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
