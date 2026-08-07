import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './tailwind.css'
import './styles/tokens.css'
import './styles/main.css'

// Apply saved theme + font size BEFORE first render.
// This runs synchronously so the CSS variables are set instantly.
// Enable shadcn dark theme.
document.documentElement.classList.add('dark')

try {
  const themeName = localStorage.getItem('overload-theme')
  const fontSize = localStorage.getItem('overload-font-size')

  if (fontSize) {
    document.documentElement.style.fontSize = `${fontSize}px`
  }

  if (themeName) {
    // Import themes from Settings — same values, defined once.
    const THEMES: Record<string, Record<string, string>> = {
      midnight: {
        '--bg': '#0f1218', '--bg-elevated': '#171c24', '--bg-card': '#1a1f29',
        '--border': '#252d3a', '--accent': '#f59e0b', '--accent-strong': '#fbbf24',
      },
      slate: {
        '--bg': '#0e1117', '--bg-elevated': '#151a24', '--bg-card': '#1a2030',
        '--border': '#2a3444', '--accent': '#60a5fa', '--accent-strong': '#93c5fd',
      },
      ocean: {
        '--bg': '#0b1120', '--bg-elevated': '#131c30', '--bg-card': '#182240',
        '--border': '#2a3a5a', '--accent': '#38bdf8', '--accent-strong': '#7dd3fc',
      },
      forest: {
        '--bg': '#0e1510', '--bg-elevated': '#162018', '--bg-card': '#1c2a1e',
        '--border': '#2d3f30', '--accent': '#4ade80', '--accent-strong': '#86efac',
      },
      violet: {
        '--bg': '#12101a', '--bg-elevated': '#1a1724', '--bg-card': '#201d2e',
        '--border': '#342f44', '--accent': '#a78bfa', '--accent-strong': '#c4b5fd',
      },
    }
    const vars = THEMES[themeName]
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        document.documentElement.style.setProperty(k, v)
      }
    }
  }
} catch { /* localStorage unavailable — use defaults */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
