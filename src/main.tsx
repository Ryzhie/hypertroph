import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { applyThemeVars, type ThemeName } from './themes'
import './tailwind.css'
import './styles/tokens.css'
import './styles/main.css'

// Apply saved theme + font size BEFORE first render.
// This runs synchronously so the CSS variables are set instantly.
// Enable shadcn dark theme.
document.documentElement.classList.add('dark')

try {
  const themeName = localStorage.getItem('overload-theme') as ThemeName | null
  const fontSize = localStorage.getItem('overload-font-size')

  if (fontSize) {
    document.documentElement.style.fontSize = `${fontSize}px`
  }

  if (themeName) {
    applyThemeVars(themeName)
  }
} catch { /* localStorage unavailable — use defaults */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
