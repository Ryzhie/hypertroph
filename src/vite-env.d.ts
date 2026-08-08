/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/**
 * Minimal typing for Google Identity Services (loaded dynamically from
 * https://accounts.google.com/gsi/client). Only the parts Hyphe uses.
 */
interface GoogleIdentityService {
  accounts: {
    id: {
      initialize: (opts: {
        client_id: string
        callback: (response: { credential: string }) => void
      }) => void
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
    }
  }
}

interface Window {
  google?: GoogleIdentityService
}
