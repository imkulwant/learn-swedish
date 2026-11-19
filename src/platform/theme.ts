// Night (dark) and Day (light) mode. The choice is a display setting of this
// phone, so it lives in `localStorage` and is read before the first paint,
// rather than in the database and its backups.

export const THEME_KEY = 'sfi.theme'

export type Theme = 'dark' | 'light'
export type ThemePreference = Theme | 'system'

/** What a new install shows: the look the app had before there was a choice. */
export const DEFAULT_PREFERENCE: ThemePreference = 'dark'

/** The page colour of each theme, for the browser's own bars. */
export const THEME_COLOR: Record<Theme, string> = {
  dark: '#142638',
  light: '#f3f6f9',
}

const LIGHT_QUERY = '(prefers-color-scheme: light)'

/** A stored value, or the default when it is missing or not a known choice. */
export function parsePreference(raw: string | null): ThemePreference {
  return raw === 'dark' || raw === 'light' || raw === 'system'
    ? raw
    : DEFAULT_PREFERENCE
}

export function resolveTheme(
  preference: ThemePreference,
  systemIsLight: boolean,
): Theme {
  if (preference === 'system') return systemIsLight ? 'light' : 'dark'
  return preference
}

const storage = (): Storage | undefined => {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

const systemQuery = () => globalThis.matchMedia?.(LIGHT_QUERY)

/** Never throws: blocked storage just gives the default. */
export function readPreference(): ThemePreference {
  try {
    return parsePreference(storage()?.getItem(THEME_KEY) ?? null)
  } catch {
    return DEFAULT_PREFERENCE
  }
}

/** Shows the theme for this choice, and returns the one it resolved to. */
export function applyTheme(preference: ThemePreference): Theme {
  const theme = resolveTheme(preference, systemQuery()?.matches ?? false)
  document.documentElement.dataset.theme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLOR[theme])
  return theme
}

/** Remembers the choice, if the browser lets it, and shows it at once. */
export function setPreference(preference: ThemePreference): void {
  try {
    storage()?.setItem(THEME_KEY, preference)
  } catch {
    // The choice still applies until the app is closed.
  }
  applyTheme(preference)
}

/** Applies the stored choice, and follows the phone while it is "system". */
export function initTheme(): void {
  applyTheme(readPreference())
  systemQuery()?.addEventListener('change', () => {
    if (readPreference() === 'system') applyTheme('system')
  })
}
