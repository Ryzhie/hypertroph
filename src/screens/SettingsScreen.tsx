import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { db } from '../db/db'
import { useSettings } from '../hooks/useSettings'
import { useProgress } from '../hooks/useProgress'
import { useSessions } from '../hooks/useSessions'
import { buildAiPrompt, parseAiResponse } from '../services/ai'
import { exportBackup, importBackup } from '../utils/exportImport'
import { fromDisplayWeight, toDisplayWeight } from '../utils/format'
import { formatDateKey } from '../utils/date'
import { applyThemeVars, THEMES, type ThemeName } from '../themes'
import type {
  ActivityLevel,
  BodyProfile,
  ExperienceLevel,
  Sex,
  TrainingGoal,
} from '../types/settings'

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very-active', label: 'Very active' },
]

const GOAL_OPTIONS: { value: TrainingGoal; label: string }[] = [
  { value: 'lose-fat', label: 'Lose fat' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'muscle-gain', label: 'Build muscle' },
]

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export default function SettingsScreen() {
  const { settings, update, setParams } = useSettings()
  const [profile, setProfile] = useState<Partial<BodyProfile> | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const unit = settings?.weightUnit ?? 'kg'
  const saved = settings?.body
  // Draft initialized from saved profile when it hasn't been touched yet.
  const draft = profile ?? saved ?? {}

  const set = (patch: Partial<BodyProfile>) => setProfile({ ...draft, ...patch })

  async function saveProfile() {
    const d = draft
    if (
      settings &&
      d.bodyWeightKg &&
      d.heightCm &&
      d.ageYears &&
      d.sex &&
      d.goal &&
      d.activityLevel &&
      d.experience
    ) {
      await update({ body: d as BodyProfile })
      setProfile(null)
    }
  }

  function clearProfile() {
    void update({ body: undefined })
    setProfile(null)
  }

  async function doExport() {
    const text = await exportBackup()
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `overload-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    // Defer revoke to avoid aborting the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  async function doImport(file: File) {
    try {
      const text = await file.text()
      await importBackup(text)
      setImportMsg('Backup restored — reloading…')
      window.setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : 'Import failed.')
    }
  }

  return (
    <div className="screen settings-screen">
      <h2 className="topbar-title">Settings</h2>

      <AppearanceSection />

      <div className="card settings-block">
        <div className="card-title">Display</div>
        <div className="field">
          <span className="field-label">Weight unit</span>
          <div className="segment">
            {(['kg', 'lb'] as const).map((u) => (
              <button
                key={u}
                className={unit === u ? 'selected' : ''}
                onClick={() => void update({ weightUnit: u })}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="field-label">Week starts on</span>
          <div className="segment">
            {(['sunday', 'monday'] as const).map((w) => (
              <button
                key={w}
                className={settings?.weekStart === w ? 'selected' : ''}
                onClick={() => void update({ weekStart: w })}
              >
                {w[0].toUpperCase() + w.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card settings-block">
        <div className="card-title">Body profile</div>
        <p className="muted small">
          These metrics power your dashboard body, training tips, and the AI-analysis export.
        </p>

        <div className="field">
          <span className="field-label">Sex</span>
          <div className="segment">
            {SEX_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={draft.sex === o.value ? 'selected' : ''}
                onClick={() => set({ sex: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Age (years)</span>
            <input
              type="number"
              min={13}
              value={draft.ageYears ?? ''}
              onChange={(e) => set({ ageYears: Number(e.target.value) })}
            />
          </label>
          <label className="field">
            <span className="field-label">Height (cm)</span>
            <input
              type="number"
              min={100}
              value={draft.heightCm ?? ''}
              onChange={(e) => set({ heightCm: Number(e.target.value) })}
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Body weight ({unit})</span>
            <input
              type="number"
              min={0}
              step="any"
              value={draft.bodyWeightKg != null ? Math.round(toDisplayWeight(draft.bodyWeightKg, unit) * 10) / 10 : ''}
              onChange={(e) => set({ bodyWeightKg: fromDisplayWeight(Number(e.target.value), unit) })}
            />
          </label>
          <label className="field">
            <span className="field-label">Body fat % (optional)</span>
            <input
              type="number"
              min={0}
              max={70}
              step="any"
              value={draft.bodyFatPct ?? ''}
              onChange={(e) => set({ bodyFatPct: Number(e.target.value) })}
            />
          </label>
        </div>

        <div className="field">
          <span className="field-label">Goal</span>
          <div className="segment">
            {GOAL_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={draft.goal === o.value ? 'selected' : ''}
                onClick={() => set({ goal: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Training experience</span>
          <div className="segment">
            {EXPERIENCE_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={draft.experience === o.value ? 'selected' : ''}
                onClick={() => set({ experience: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Daily activity (outside training)</span>
          <div className="segment">
            {ACTIVITY_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={draft.activityLevel === o.value ? 'selected' : ''}
                onClick={() => set({ activityLevel: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="exercise-detail-foot">
          {saved && (
            <button className="btn-ghost btn" onClick={clearProfile}>
              Clear
            </button>
          )}
          <button
            className="btn btn-primary"
            disabled={
              !draft.bodyWeightKg ||
              !draft.heightCm ||
              !draft.ageYears ||
              !draft.sex ||
              !draft.goal ||
              !draft.activityLevel ||
              !draft.experience
            }
            onClick={() => void saveProfile()}
          >
            Save profile
          </button>
        </div>
      </div>

      <div className="card settings-block">
        <div className="card-title">Overload engine</div>
        <p className="muted small">
          Weight increase per step ({unit === 'lb' ? `${settings?.params.incrementKg ? Math.round(settings.params.incrementKg * 2.20462 * 2) / 2 : '—'} lb` : `${settings?.params.incrementKg ?? '—'} kg`}).
        </p>
        <div className="segment">
          {[1.25, 2.5, 5].map((kg) => (
            <button
              key={kg}
              className={settings?.params.incrementKg === kg ? 'selected' : ''}
              onClick={() => void setParams({ incrementKg: kg })}
            >
              {unit === 'lb' ? `${Math.round(kg * 2.20462 * 2) / 2} lb` : `${kg} kg`}
            </button>
          ))}
        </div>
      </div>

      <div className="card settings-block">
        <div className="card-title">Backup</div>
        <p className="muted small">Everything lives on this device. Keep a copy safe.</p>
        <div className="exercise-detail-foot">
          <button className="btn" onClick={() => void doExport()}>
            Export
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void doImport(f)
              e.target.value = ''
            }}
          />
        </div>
        {importMsg && <p className="field-hint">{importMsg}</p>}
      </div>

      <AiAnalysisSection />
    </div>
  )
}

function AppearanceSection() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    try { return (localStorage.getItem('overload-theme') as ThemeName) || 'midnight' } catch { return 'midnight' }
  })
  const [fontSize, setFontSize] = useState<number>(() => {
    try { return Number(localStorage.getItem('overload-font-size')) || 16 } catch { return 16 }
  })

  function applyTheme(name: ThemeName) {
    setTheme(name)
    localStorage.setItem('overload-theme', name)
    // Cross-fade the color change instead of snapping it.
    document.documentElement.classList.add('theme-changing')
    applyThemeVars(name)
    window.setTimeout(
      () => document.documentElement.classList.remove('theme-changing'),
      320,
    )
  }

  function applyFontSize(size: number) {
    setFontSize(size)
    localStorage.setItem('overload-font-size', String(size))
    document.documentElement.style.fontSize = `${size}px`
  }

  // Theme/font are applied in main.tsx on startup.
  // applyTheme/applyFontSize below handle live changes from the UI.

  return (
    <motion.div
      className="card settings-block"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="card-title">Appearance</div>

      <div className="field">
        <span className="field-label">Theme</span>
        <div className="theme-grid">
          {(Object.keys(THEMES) as ThemeName[]).map((name) => (
            <button
              key={name}
              type="button"
              className={`theme-swatch ${theme === name ? 'active' : ''}`}
              onClick={() => applyTheme(name)}
            >
              <span className="theme-preview" style={{
                background: THEMES[name]['--bg'],
                borderColor: THEMES[name]['--accent'],
              }}>
                <span className="theme-accent" style={{ background: THEMES[name]['--accent'] }} />
              </span>
              <span className="theme-name">{name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Font size — {fontSize}px</span>
        <div className="segment">
          {[14, 15, 16, 17, 18].map((s) => (
            <button
              key={s}
              className={fontSize === s ? 'selected' : ''}
              onClick={() => applyFontSize(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function AiAnalysisSection() {
  const { settings } = useSettings()
  const { progress } = useProgress()
  const { sessions } = useSessions()
  const exercisesRaw = useLiveQuery(() => db.exercises.toArray(), [])
  const insightsRaw = useLiveQuery(() => db.aiInsights.orderBy('createdAt').reverse().toArray(), [])
  const exercises = Array.isArray(exercisesRaw) ? exercisesRaw : []
  const insights = Array.isArray(insightsRaw) ? insightsRaw : []
  const importRef = useRef<HTMLInputElement>(null)

  const [prompt, setPrompt] = useState<string | null>(null)
  const [pasted, setPasted] = useState('')
  const [source, setSource] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function genPrompt() {
    const text = buildAiPrompt({
      body: settings?.body,
      progress,
      sessions,
      exercises,
      weightUnit: settings?.weightUnit ?? 'kg',
    })
    setPrompt(text)
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setMsg('✓ Prompt copied — paste into any AI.')
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      setMsg('Copy failed — select and copy the text below.')
    })
  }

  async function submitResponse() {
    if (!pasted.trim()) return
    try {
      const parsed = parseAiResponse(pasted)
      await db.aiInsights.add({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        source: source.trim() || 'External AI',
        raw: pasted,
        parsed,
        valid: true,
      })
      setPasted('')
      setSource('')
      setMsg('✓ Analysis saved.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Invalid response format.')
    }
  }

  async function importJson(file: File) {
    try {
      const text = await file.text()
      setPasted(text)
      setSource(file.name.replace(/\.json$/i, ''))
      setMsg('JSON loaded — review and save.')
    } catch {
      setMsg('Failed to read file.')
    }
  }

  return (
    <div className="card settings-block">
      <div className="card-title">AI Training Analysis</div>
      <p className="muted small">
        Export your data → paste into any AI (Claude, GPT, Gemini, DeepSeek…) →
        get a structured response → paste it back here. Run on multiple AIs for
        more reliable results.
      </p>

      <div className="ai-step">
        <span className="ai-step-num">1</span>
        <div>
          <strong>Generate & copy prompt</strong>
          <p className="muted small" style={{ margin: '2px 0 0' }}>
            Creates a comprehensive data dump with mode selection (analysis / advice / plan).
          </p>
        </div>
      </div>
      <button className="btn btn-primary btn-block" onClick={genPrompt}>
        {copied ? '✓ Copied!' : 'Generate prompt & copy'}
      </button>

      {prompt && (
        <details className="prompt-preview">
          <summary className="muted small">Preview prompt ({Math.round(prompt.length / 1000)}k chars)</summary>
          <pre className="prompt-text">{prompt}</pre>
        </details>
      )}

      <div className="ai-step">
        <span className="ai-step-num">2</span>
        <div>
          <strong>Paste AI response</strong>
          <p className="muted small" style={{ margin: '2px 0 0' }}>
            The AI should respond with valid JSON matching the schema in the prompt.
          </p>
        </div>
      </div>

      <label className="field">
        <span className="field-label">AI source</span>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g. Claude · round 1"
        />
      </label>

      <textarea
        className="ai-textarea"
        rows={6}
        value={pasted}
        onChange={(e) => setPasted(e.target.value)}
        placeholder='Paste JSON response from your AI here…'
      />

      <div className="ai-actions">
        <button
          className="btn btn-primary"
          disabled={!pasted.trim()}
          onClick={() => void submitResponse()}
        >
          Save response
        </button>
        <button className="btn" onClick={() => importRef.current?.click()}>
          Import JSON
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void importJson(f)
            e.target.value = ''
          }}
        />
      </div>

      {msg && <p className="field-hint">{msg}</p>}

      {insights.length > 0 && (
        <>
          <div className="card-title" style={{ marginTop: 14 }}>Past analyses</div>
          {insights.map((ins) => (
            <div key={ins.id} className="insight-row">
              <span className="muted small">
                {formatDateKey(ins.createdAt.slice(0, 10))} · {ins.source}
                {ins.parsed?.fatigue && <span className="chip chip-accent">fatigue: {ins.parsed.fatigue}</span>}
                {ins.parsed?.progressRate && <span className="chip chip-accent">rate: {ins.parsed.progressRate}</span>}
                {ins.parsed?.deloadSuggested && <span className="chip chip-warn">deload suggested</span>}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
