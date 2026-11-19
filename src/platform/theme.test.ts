import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCE, parsePreference, resolveTheme } from './theme'

describe('parsePreference', () => {
  it('keeps the three known choices', () => {
    expect(parsePreference('dark')).toBe('dark')
    expect(parsePreference('light')).toBe('light')
    expect(parsePreference('system')).toBe('system')
  })

  it('falls back to the default for anything else', () => {
    expect(parsePreference(null)).toBe(DEFAULT_PREFERENCE)
    expect(parsePreference('')).toBe(DEFAULT_PREFERENCE)
    expect(parsePreference('blue')).toBe(DEFAULT_PREFERENCE)
    expect(parsePreference('Dark')).toBe(DEFAULT_PREFERENCE)
  })

  it('shows Night by default, as before there was a choice', () => {
    expect(DEFAULT_PREFERENCE).toBe('dark')
  })
})

describe('resolveTheme', () => {
  it('uses a fixed choice whatever the phone says', () => {
    expect(resolveTheme('dark', true)).toBe('dark')
    expect(resolveTheme('light', false)).toBe('light')
  })

  it('follows the phone for "system"', () => {
    expect(resolveTheme('system', true)).toBe('light')
    expect(resolveTheme('system', false)).toBe('dark')
  })
})
