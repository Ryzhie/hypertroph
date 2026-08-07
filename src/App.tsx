import { Component, type ReactNode, useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { registerSW } from 'virtual:pwa-register'
import { seedIfNeeded } from './db/seed'
import TodayScreen from './screens/TodayScreen'
import LoggingScreen from './screens/LoggingScreen'
import HistoryScreen from './screens/HistoryScreen'
import ExercisesScreen from './screens/ExercisesScreen'
import SplitsScreen from './screens/SplitsScreen'
import SettingsScreen from './screens/SettingsScreen'
import { Home, BarChart3, Dumbbell, Calendar, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Today', Icon: Home },
  { to: '/history', label: 'History', Icon: BarChart3 },
  { to: '/exercises', label: 'Exercises', Icon: Dumbbell },
  { to: '/plans', label: 'Plans', Icon: Calendar },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

/** Page transition animation variants */
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ flex: 1 }}
      >
        <Routes location={location}>
          <Route path="/" element={<TodayScreen />} />
          <Route path="/log" element={<LoggingScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/exercises" element={<ExercisesScreen />} />
          <Route path="/plans" element={<SplitsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<TodayScreen />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  const [needsRefresh, setNeedsRefresh] = useState(false)

  useEffect(() => { void seedIfNeeded() }, [])

  const updateSW = registerSW({
    onNeedRefresh() { setNeedsRefresh(true) },
    onOfflineReady() {},
  })

  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') updateSW() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [updateSW])

  return (
    <div className="app-shell">
      {/* Mobile: bottom tab bar */}
      <nav className="nav-bottom">
        {NAV_ITEMS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="nav-icon"><t.Icon size={22} strokeWidth={2} /></span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Desktop: side navigation */}
      <nav className="nav-side">
        <div className="nav-side-brand">
          <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="Hypertrophic" className="nav-side-logo" />
          <span>Hypertrophic</span>
        </div>
        {NAV_ITEMS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="nav-side-icon"><t.Icon size={20} strokeWidth={2} /></span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>

      {needsRefresh && (
        <div className="update-banner">
          <span>New version ready</span>
          <button className="btn btn-primary" onClick={() => updateSW(true)}>
            Reload
          </button>
        </div>
      )}

      <ErrorBoundary>
        <AnimatedRoutes />
      </ErrorBoundary>
    </div>
  )
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    console.error('[Hypertrophic ErrorBoundary]', error)
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="screen">
          <div className="empty">
            <div className="empty-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p className="muted small">{this.state.error.message}</p>
            <details style={{ textAlign: 'left', marginTop: 12, fontSize: '0.8rem' }}>
              <summary className="muted">Technical details</summary>
              <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-faint)' }}>
                {this.state.error.stack}
              </pre>
            </details>
            <button className="btn btn-primary" style={{ marginTop: 12 }}
              onClick={() => { this.setState({ error: null }); window.location.reload() }}>
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
