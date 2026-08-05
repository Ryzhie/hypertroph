import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import TodayScreen from './screens/TodayScreen'
import HistoryScreen from './screens/HistoryScreen'
import ExercisesScreen from './screens/ExercisesScreen'
import SplitsScreen from './screens/SplitsScreen'
import SettingsScreen from './screens/SettingsScreen'

const TABS = [
  { to: '/', label: 'Today', icon: '🏋️', end: true },
  { to: '/history', label: 'History', icon: '📊', end: false },
  { to: '/exercises', label: 'Exercises', icon: '📚', end: false },
  { to: '/plans', label: 'Plans', icon: '🗓️', end: false },
  { to: '/settings', label: 'Settings', icon: '⚙️', end: false },
]

export default function App() {
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const updateSW = registerSW({
    onNeedRefresh() {
      setNeedsRefresh(true)
    },
    onOfflineReady() {},
  })

  // iOS is lazy about checking for service-worker updates; recheck whenever
  // the app comes back into the foreground.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') updateSW()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [updateSW])

  return (
    <div className="app-shell">
      {needsRefresh && (
        <div className="update-banner">
          <span>New version ready</span>
          <button
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.9rem' }}
            onClick={() => updateSW(true)}
          >
            Reload
          </button>
        </div>
      )}

      <Routes>
        <Route path="/" element={<TodayScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/exercises" element={<ExercisesScreen />} />
        <Route path="/plans" element={<SplitsScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<TodayScreen />} />
      </Routes>

      <nav className="nav-bottom">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="nav-icon">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
