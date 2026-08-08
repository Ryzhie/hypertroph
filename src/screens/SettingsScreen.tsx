import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { db } from '../db/db'
import { useSettings } from '../hooks/useSettings'
import { useProgress } from '../hooks/useProgress'
import { useSessions } from '../hooks/useSessions'
import { buildAiPrompt, parseAiResponse } from '../services/ai'
import { parseHealthFile, type HealthImport } from '../services/appleHealth'
import {
  buildWeightCsv,
  buildWorkoutCsv,
  downloadFile,
  shareFile,
} from '../services/export'
import WeightChart from '../components/WeightChart'
import { ShareIcon, UploadIcon } from '../components/Icons'
import { exportBackup, importBackup } from '../utils/exportImport'
import { formatWeight, fromDisplayWeight, toDisplayWeight } from '../utils/format'
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

      <ShareExportSection />
      <HealthDataSection />
      <GoogleSignInSection />

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

function ShareExportSection() {
  const { sessions } = useSessions()
  const { settings } = useSettings()
  const unit = settings?.weightUnit ?? 'kg'
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  function workoutsFile(): File {
    const csv = buildWorkoutCsv(sessions)
    const stamp = new Date().toISOString().slice(0, 10)
    return new File([csv], `hyphe-workouts-${stamp}.csv`, { type: 'text/csv' })
  }

  async function shareWorkouts() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await shareFile(workoutsFile())
      setMsg(res === 'shared' ? 'Shared — pick Mail or another app.' : 'CSV downloaded.')
    } catch (err) {
      // User dismissing the share sheet isn't an error worth showing.
      if (!(err instanceof Error && err.name === 'AbortError')) {
        setMsg(err instanceof Error ? err.message : 'Sharing failed.')
      }
    } finally {
      setBusy(false)
    }
  }

  function downloadWorkouts() {
    downloadFile(workoutsFile())
    setMsg('CSV downloaded.')
  }

  function downloadBodyWeight() {
    const history = settings?.body?.bodyWeightHistory ?? []
    const csv = buildWeightCsv(history)
    const file = new File([csv], `hyphe-body-weight-${new Date().toISOString().slice(0, 10)}.csv`, {
      type: 'text/csv',
    })
    downloadFile(file)
    setMsg('Body-weight CSV downloaded.')
  }

  return (
    <div className="card settings-block">
      <div className="card-title">Share & export</div>
      <p className="muted small">
        Send your training history anywhere — email, Messages, AirDrop, or save it to Files
        ({unit} column values are canonical; use the app to see your display unit).
      </p>
      <div className="exercise-detail-foot">
        <button className="btn btn-primary" disabled={busy} onClick={() => void shareWorkouts()}>
          <ShareIcon size={16} /> Email / share workouts
        </button>
        <button className="btn" onClick={downloadWorkouts}>
          Download CSV
        </button>
      </div>
      {(settings?.body?.bodyWeightHistory?.length ?? 0) > 0 && (
        <div className="exercise-detail-foot" style={{ marginTop: 8 }}>
          <button className="btn" onClick={downloadBodyWeight}>
            Body-weight CSV
          </button>
        </div>
      )}
      {msg && <p className="field-hint">{msg}</p>}
    </div>
  )
}

function HealthDataSection() {
  const { settings, update } = useSettings()
  const unit = settings?.weightUnit ?? 'kg'
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<HealthImport | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const history = settings?.body?.bodyWeightHistory ?? []

  async function onFile(f: File) {
    setBusy(true)
    setMsg(null)
    setPreview(null)
    try {
      const parsed = await parseHealthFile(f)
      setPreview(parsed)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not read that file.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function applyImport() {
    if (!preview) return
    const patch: Partial<BodyProfile> = {}
    if (preview.weightKg != null) patch.bodyWeightKg = preview.weightKg
    if (preview.heightCm != null) patch.heightCm = preview.heightCm
    if (preview.bodyFatPct != null) patch.bodyFatPct = preview.bodyFatPct
    if (preview.weightHistory.length > 0) patch.bodyWeightHistory = preview.weightHistory
    await update({ body: { ...settings?.body, ...patch } as BodyProfile })
    setPreview(null)
    setMsg('✓ Applied to your body profile.')
  }

  function clearHistory() {
    const body = settings?.body
    if (!body?.bodyWeightHistory) return
    const next: BodyProfile = { ...body }
    delete next.bodyWeightHistory
    void update({ body: next })
    setMsg('Weight history cleared.')
  }

  return (
    <div className="card settings-block">
      <div className="card-title">Health data</div>
      <p className="muted small">
        Import your body metrics from Apple Health. On your iPhone: Settings → Health →
        “Export All Health Data”, then drop the <code>export.zip</code> (or extracted{' '}
        <code>export.xml</code>) here. Weight, height, and body fat are pulled from your
        Health records — nothing is uploaded anywhere.
      </p>

      <div className="exercise-detail-foot">
        <button className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>
          <UploadIcon size={16} /> {busy ? 'Reading…' : 'Import from Apple Health'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".zip,.xml"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onFile(f)
          }}
        />
      </div>

      {preview && (
        <div className="health-preview">
          <div className="health-preview-metrics">
            {preview.weightKg != null && (
              <span className="chip chip-accent">Weight · {formatWeight(preview.weightKg, unit)}</span>
            )}
            {preview.heightCm != null && (
              <span className="chip chip-accent">Height · {preview.heightCm} cm</span>
            )}
            {preview.bodyFatPct != null && (
              <span className="chip chip-accent">Body fat · {preview.bodyFatPct}%</span>
            )}
            {preview.weightHistory.length > 0 && (
              <span className="chip chip-accent">{preview.weightHistory.length} weight records</span>
            )}
          </div>
          <div className="exercise-detail-foot">
            <button className="btn btn-primary" onClick={() => void applyImport()}>
              Apply to profile
            </button>
            <button className="btn" onClick={() => setPreview(null)}>
              Discard
            </button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <WeightChart points={history} unit={unit} />
          <div className="exercise-detail-foot" style={{ marginTop: 8 }}>
            <button className="btn" onClick={clearHistory}>
              Clear imported history
            </button>
          </div>
        </div>
      )}

      {msg && <p className="field-hint">{msg}</p>}
    </div>
  )
}

/** Decode the JWT payload Google returns (base64url → JSON). */
function decodeJwt(token: string): { name?: string; email?: string; picture?: string } {
  const payload = token.split('.')[1]
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json) as { name?: string; email?: string; picture?: string }
}

/** Inject the Google Identity Services script once. */
function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load Google sign-in.'))
    document.head.appendChild(s)
  })
}

interface GoogleUser {
  name: string
  email: string
  picture?: string
}

function GoogleSignInSection() {
  const [draftId, setDraftId] = useState(() => {
    try { return localStorage.getItem('hyphe-google-client-id') ?? '' } catch { return '' }
  })
  const [persistedId, setPersistedId] = useState(draftId)
  const [user, setUser] = useState<GoogleUser | null>(() => {
    try {
      const raw = localStorage.getItem('hyphe-google-user')
      return raw ? (JSON.parse(raw) as GoogleUser) : null
    } catch { return null }
  })
  const [msg, setMsg] = useState<string | null>(null)
  const btnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!persistedId || user) return
    let cancelled = false
    loadGis()
      .then(() => {
        if (cancelled || !btnRef.current || !window.google) return
        btnRef.current.innerHTML = '' // avoid stacking a new button per save
        window.google.accounts.id.initialize({
          client_id: persistedId,
          callback: (resp) => {
            try {
              const payload = decodeJwt(resp.credential)
              const u: GoogleUser = {
                name: payload.name ?? 'Google user',
                email: payload.email ?? '',
                picture: payload.picture,
              }
              setUser(u)
              localStorage.setItem('hyphe-google-user', JSON.stringify(u))
            } catch {
              setMsg('Could not read the sign-in response.')
            }
          },
        })
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
        })
      })
      .catch((err: unknown) => {
        if (!cancelled) setMsg(err instanceof Error ? err.message : 'Could not load Google sign-in.')
      })
    return () => { cancelled = true }
  }, [persistedId, user])

  function saveClientId() {
    localStorage.setItem('hyphe-google-client-id', draftId.trim())
    setPersistedId(draftId.trim())
    setMsg(draftId.trim() ? 'Client ID saved.' : null)
  }

  function signOut() {
    localStorage.removeItem('hyphe-google-user')
    setUser(null)
    setMsg('Signed out — all data stays on this device.')
  }

  return (
    <div className="card settings-block">
      <div className="card-title">Sign in with Google</div>
      <p className="muted small">
        Optional identity — shows your account here. Everything stays on this device; sign-in
        is cosmetic until a sync backend exists.
      </p>

      {user ? (
        <div className="google-profile">
          {user.picture && <img className="google-avatar" src={user.picture} alt="" />}
          <div className="google-id">
            <strong>{user.name}</strong>
            {user.email && <span className="muted small">{user.email}</span>}
          </div>
          <button className="btn" onClick={signOut}>Sign out</button>
        </div>
      ) : (
        <>
          <label className="field">
            <span className="field-label">Google OAuth Client ID</span>
            <input
              type="text"
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
              placeholder="1234567890-xxxx.apps.googleusercontent.com"
            />
          </label>
          <div className="exercise-detail-foot">
            <button className="btn" onClick={saveClientId}>Save Client ID</button>
          </div>
          <p className="muted small" style={{ marginTop: 6 }}>
            Get one in Google Cloud Console → APIs & Services → Credentials → OAuth Client ID
            (Web). Add your app URL (e.g. <code>https://ryzhie.github.io/hypertroph</code>) to
            the authorized JavaScript origins.
          </p>
          {persistedId && (
            <div ref={btnRef} style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }} />
          )}
        </>
      )}

      {msg && <p className="field-hint">{msg}</p>}
    </div>
  )
}
