/** Hyphe appearance themes. Single source of truth — imported by both
 *  main.tsx (startup application) and SettingsScreen (live switching).
 *
 *  Every value is a plain CSS custom property set on <html>. Colors are
 *  rgba/hex only — no color-mix() or relative-color syntax, which break on
 *  older mobile browsers. Each theme also carries an `--accent-glow` used
 *  for shadows so press/primary styling follows the accent instead of
 *  hardcoding amber.
 */
export interface HypheTheme {
  '--bg': string
  '--bg-elevated': string
  '--bg-card': string
  '--border': string
  '--accent': string
  '--accent-strong': string
  '--accent-glow': string
  '--text-dim': string
  '--text-faint': string
}

export type ThemeName = keyof typeof THEMES

export const THEMES = {
  midnight: {
    '--bg': '#0f1218',
    '--bg-elevated': '#171c24',
    '--bg-card': '#1a1f29',
    '--border': '#252d3a',
    '--accent': '#f59e0b',
    '--accent-strong': '#fbbf24',
    '--accent-glow': 'rgba(245, 158, 11, 0.35)',
    '--text-dim': '#a0aec0',
    '--text-faint': '#6b7a90',
  },
  slate: {
    '--bg': '#0e1117',
    '--bg-elevated': '#151a24',
    '--bg-card': '#1a2030',
    '--border': '#2a3444',
    '--accent': '#60a5fa',
    '--accent-strong': '#93c5fd',
    '--accent-glow': 'rgba(96, 165, 250, 0.35)',
    '--text-dim': '#94b4d8',
    '--text-faint': '#6889ad',
  },
  ocean: {
    '--bg': '#0b1120',
    '--bg-elevated': '#131c30',
    '--bg-card': '#182240',
    '--border': '#2a3a5a',
    '--accent': '#38bdf8',
    '--accent-strong': '#7dd3fc',
    '--accent-glow': 'rgba(56, 189, 248, 0.35)',
    '--text-dim': '#8ec5d8',
    '--text-faint': '#5f9ab8',
  },
  forest: {
    '--bg': '#0e1510',
    '--bg-elevated': '#162018',
    '--bg-card': '#1c2a1e',
    '--border': '#2d3f30',
    '--accent': '#4ade80',
    '--accent-strong': '#86efac',
    '--accent-glow': 'rgba(74, 222, 128, 0.35)',
    '--text-dim': '#8bc4a0',
    '--text-faint': '#5f9a76',
  },
  violet: {
    '--bg': '#12101a',
    '--bg-elevated': '#1a1724',
    '--bg-card': '#201d2e',
    '--border': '#342f44',
    '--accent': '#a78bfa',
    '--accent-strong': '#c4b5fd',
    '--accent-glow': 'rgba(167, 139, 250, 0.35)',
    '--text-dim': '#b0a8cc',
    '--text-faint': '#8078a0',
  },
} satisfies Record<string, HypheTheme>

/** Apply a theme's variables to <html>. */
export function applyThemeVars(name: ThemeName): void {
  const vars = THEMES[name]
  if (!vars) return
  for (const [k, v] of Object.entries(vars)) {
    document.documentElement.style.setProperty(k, v)
  }
}
