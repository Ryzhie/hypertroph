import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { MoonIcon } from '../components/Icons'
import { useTodayPlan } from '../hooks/useTodayPlan'
import { useSessions } from '../hooks/useSessions'
import { useProgress } from '../hooks/useProgress'
import { useSettings } from '../hooks/useSettings'
import { db } from '../db/db'
import { generateTips, type Tip as TipType } from '../services/tips'
import { computeTopSet } from '../services/overload'
import VolumeChart from '../components/VolumeChart'
import StreakChart from '../components/StreakChart'
import { formatWeightNumber, formatRepRange, formatRestSeconds, perHandSuffix } from '../utils/format'
import Tip, { GLOSSARY } from '../components/Tip'
import { addDaysToKey, formatDateKey, weekdayIndex } from '../utils/date'
import { defaultParams } from '../algorithm/params'
import type { Instruction } from '../algorithm/progression'

// Animation helpers — explicit tween (no spring overshoot on y), under 300ms,
// honoring reduced-motion by fading only.
const EASE = [0.23, 1, 0.32, 1] as const
const staggerContainer = { animate: { transition: { staggerChildren: 0.05 } } }
const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
}

export default function TodayScreen() {
  const plan = useTodayPlan()
  const { sessions } = useSessions()
  const { progress } = useProgress()
  const { settings } = useSettings()
  const exercisesRaw = useLiveQuery(() => db.exercises.toArray(), [])
  const exercises = Array.isArray(exercisesRaw) ? exercisesRaw : []
  const params = settings?.params ?? defaultParams()
  const reduceMotion = useReducedMotion()
  const tips = useMemo(
    () => generateTips({ body: settings?.body, progress, sessions, exercises, params, today: plan.today }),
    [settings?.body, progress, sessions, exercises, params, plan.today],
  )
  const unit = plan.targetWeightUnit
  const lastSession = sessions[0]
  const warned = plan.entries.some((e) => e.target.mode === 'deload' || e.target.mode === 'deload-suggested')

  return (
    <div className="space-y-5 p-4 md:p-8 max-w-4xl mx-auto">
      {/* Hero header */}
      <motion.header
        initial={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.2 : 0.28, ease: [0.23, 1, 0.32, 1] }}
      >
        <p className="text-sm text-muted-foreground mb-1">{formatDateKey(plan.today)} · {plan.splitName}</p>
        <h1 className="hero-title text-3xl md:text-4xl font-extrabold tracking-tight">
          {plan.isRestDay ? 'Rest day' : plan.dayName}
        </h1>
      </motion.header>

      {/* Tips */}
      {tips.length > 0 && <TipsSection tips={tips} />}

      {/* Streak + Volume charts — two columns on desktop */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Streak · 14 days</p>
            <StreakChart sessions={sessions} />
          </motion.div>
          <motion.div className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Volume · 30 days</p>
            <VolumeChart sessions={sessions} unit={unit} />
          </motion.div>
        </div>
      )}

      {/* Workout or Rest */}
      {plan.isRestDay ? (
        <div className="space-y-4">
          <RestDay plan={plan} />
          <BodyCard settings={settings} />
        </div>
      ) : (
        <div className="space-y-3">
          {warned && (
            <motion.div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-400 bg-yellow-400/15 rounded-full px-2.5 py-0.5">Deload week</span>
              <p className="text-sm text-yellow-300/80 mt-2">Some lifts are flagged — keep the load light and let your body catch up.</p>
            </motion.div>
          )}

          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {plan.entries.map((e) => (
              <motion.div key={e.exercise.id} variants={staggerItem}>
                <Link to="/log" className="block glass-card hover:border-accent/40 transition-colors duration-200 mb-3">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold tracking-tight">{e.exercise.name}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      e.target.mode === 'increase' ? 'bg-emerald-500/15 text-emerald-400' :
                      e.target.mode === 'deload' || e.target.mode === 'deload-suggested' ? 'bg-amber-500/15 text-amber-400' :
                      e.target.mode === 'hold-high-rpe' ? 'bg-red-500/15 text-red-400' :
                      'bg-accent/15 text-accent'
                    }`}>
                      {modeLabel(e.target.mode)}
                    </span>
                  </div>

                  {e.target.mode === 'new' ? (
                    <div className="text-2xl font-bold text-muted-foreground mb-2">
                      Log your first set
                      <span className="block text-sm font-medium text-muted-foreground mt-1">{e.eff.repsRange[0]}–{e.eff.repsRange[1]} reps · {e.eff.sets} sets</span>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <span className="text-3xl font-extrabold tracking-tight">
                        {e.target.weightKg > 0
                          ? `${formatWeightNumber(e.target.weightKg, unit)} ${unit}${perHandSuffix(e.exercise.perHand)}`
                          : formatRepRange(e.target.repsRange) + ' reps'}
                      </span>
                      <span className="text-accent font-bold ml-2">× {formatRepRange(e.target.repsRange)}</span>
                      <span className="block text-sm text-muted-foreground mt-1">
                        {e.eff.sets} sets · {formatRestSeconds(e.eff.restSeconds)} rest · RPE ≤ {e.target.rpeTarget} <Tip>{GLOSSARY.rpe}</Tip>
                      </span>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground/70 mb-3">{e.target.message}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                    <span className="text-xs text-muted-foreground/60">Tap to log</span>
                    {lastSession && <LastResult exerciseId={e.exercise.id} lastSession={lastSession} unit={unit} />}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(plan.entries.length * 0.04, 0.3), duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          >
            <Link to="/log" className="block w-full text-center py-3.5 rounded-xl font-bold text-accent-foreground bg-accent hover:bg-accent/90 active:scale-[0.97] transition-all shadow-[0_4px_16px_var(--accent-glow)]">
              Start workout
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function RestDay({ plan }: { plan: ReturnType<typeof useTodayPlan> }) {
  const next = nextWorkout(plan)
  return (
    <motion.div className="glass-card rest-card text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
      <div className="text-5xl mb-4 opacity-70"><MoonIcon size={48} /></div>
      <h3 className="text-xl font-bold mb-2">Rest day</h3>
      <p className="text-sm text-muted-foreground">
        Recovery is where the gains happen.
        {next && <><br />Next up: <strong className="text-foreground">{next.name}</strong> on {formatDateKey(next.dateKey)}.</>}
      </p>
      {plan.splitName && <span className="inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-full bg-accent/15 text-accent">{plan.splitName}</span>}
    </motion.div>
  )
}

function BodyCard({ settings }: { settings: ReturnType<typeof useSettings>['settings'] }) {
  const body = settings?.body
  const unit = settings?.weightUnit ?? 'kg'
  if (!body) {
    return (
      <motion.div className="glass-card text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
        <p className="text-sm text-muted-foreground">
          Add your body profile in <Link to="/settings" className="text-accent hover:underline">Settings</Link> to unlock personalized recommendations.
        </p>
      </motion.div>
    )
  }
  return (
    <motion.div className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Your body</p>
      <div className="flex flex-wrap gap-2">
        {[`${body.sex}`, `${body.ageYears} yrs`, `${body.heightCm} cm`, `${Math.round(body.bodyWeightKg * 10) / 10} ${unit}`, body.bodyFatPct != null && `${body.bodyFatPct}% fat`, body.activityLevel].filter(Boolean).map((v, i) => (
          <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-muted-foreground font-medium">{v}</span>
        ))}
      </div>
    </motion.div>
  )
}

function LastResult({ exerciseId, lastSession, unit }: { exerciseId: string; lastSession: NonNullable<ReturnType<typeof useSessions>['sessions']>[number]; unit: 'kg' | 'lb' }) {
  const log = lastSession.logs.find((l) => l.exerciseId === exerciseId)
  if (!log || log.sets.length === 0) return null
  const top = computeTopSet(log.sets)
  if (!top) return null
  return (
    <span className="text-xs text-muted-foreground/60">
      Last: {formatWeightNumber(top.weightKg, unit)} {unit} × {top.reps}{perHandSuffix(log.perHand)}
    </span>
  )
}

function TipsSection({ tips }: { tips: TipType[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('hyphe-dismissed-tips') ?? '[]')) } catch { return new Set() }
  })
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem('hyphe-tips-hidden') === 'true' } catch { return false }
  })

  const dismiss = (id: string) => {
    const next = new Set(dismissed); next.add(id)
    setDismissed(next)
    localStorage.setItem('hyphe-dismissed-tips', JSON.stringify([...next]))
  }
  const hideAll = () => { setHidden(true); localStorage.setItem('hyphe-tips-hidden', 'true') }
  const showAll = () => { setHidden(false); setDismissed(new Set()); localStorage.removeItem('hyphe-tips-hidden'); localStorage.removeItem('hyphe-dismissed-tips') }

  const visible = tips.filter((t) => !dismissed.has(t.id))
  if (hidden || visible.length === 0) return (
    <button type="button" className="w-full text-xs text-muted-foreground/60 hover:text-foreground py-2 transition-colors" onClick={showAll}>
      Show tips
    </button>
  )

  return (
    <motion.div className="glass-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tips</p>
        <button type="button" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors" onClick={hideAll}>Hide</button>
      </div>
      {visible.slice(0, 3).map((t, i) => (
        <div key={t.id} className={`flex items-start gap-3 py-2.5 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            t.accent === 'warn' ? 'bg-amber-500/15 text-amber-400' :
            t.accent === 'good' ? 'bg-emerald-500/15 text-emerald-400' :
            'bg-accent/15 text-accent'
          }`}>{t.accent}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t.headline}</p>
            {t.detail && <p className="text-xs text-muted-foreground/70 mt-0.5">{t.detail}</p>}
          </div>
          <button type="button" className="text-muted-foreground/40 hover:text-foreground text-lg leading-none" onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </motion.div>
  )
}

function nextWorkout(plan: ReturnType<typeof useTodayPlan>): { name: string; dateKey: string } | null {
  const split = plan.split
  if (!split) return null
  for (let offset = 1; offset <= 7; offset++) {
    const dateKey = addDaysToKey(plan.today, offset)
    const dayKey = split.schedule[weekdayIndex(dateKey)] ?? null
    if (dayKey) {
      const day = split.days[dayKey]
      if (day && !day.isRest) return { name: day.name, dateKey }
    }
  }
  return null
}

function modeLabel(mode: Instruction['mode']): string {
  switch (mode) {
    case 'deload': return 'Deload'
    case 'deload-suggested': return 'Light week'
    case 're-acclimate': return 'Re-acclimate'
    case 'new': return 'First time'
    default: return 'On track'
  }
}
