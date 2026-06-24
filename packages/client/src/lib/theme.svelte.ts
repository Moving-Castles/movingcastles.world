// Reactive day/night theme state. The active theme lives as `data-theme` on
// <html>; an inline script in app.html sets it before first paint (no flash),
// and this module keeps a reactive mirror for the toggle UI. Night is default.

export type Theme = 'night' | 'day'

const STORAGE_KEY = 'theme'
const THEME_COLOR: Record<Theme, string> = {night: '#000000', day: '#ffffff'}

let current = $state<Theme>('night')

function apply(next: Theme) {
  current = next
  document.documentElement.dataset.theme = next
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLOR[next])
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Private mode / storage disabled — the in-memory toggle still works.
  }
}

export const theme = {
  get current(): Theme {
    return current
  },

  // Adopt the value the inline head script already resolved. Called after
  // hydration so the toggle label matches what the user actually sees.
  sync() {
    if (typeof document === 'undefined') return
    current = document.documentElement.dataset.theme === 'day' ? 'day' : 'night'
  },

  toggle() {
    apply(current === 'night' ? 'day' : 'night')
  },
}
