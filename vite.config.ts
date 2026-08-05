import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// The app lives at https://<user>.github.io/hypertroph/ so every asset needs
// this base prefix. Override it for a native (Capacitor) build with `./`.
// Keep the repo name in this ONE place.
const REPO_NAME = 'hypertroph'
const base = process.env.VITE_BASE_PATH ?? `/${REPO_NAME}/`

export default defineConfig({
  // base must be set BEFORE the PWA plugin config — the plugin reads it.
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'HyperTroph',
        short_name: 'HyperTroph',
        description:
          'Personal progressive-overload workout tracker. Tells you what to lift next, every session.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        // CRITICAL: start_url and scope must match the base path, not '/'.
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // index.html is served no-cache by GitHub Pages; precache-only is right.
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
