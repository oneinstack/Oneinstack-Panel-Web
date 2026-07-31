import { describe, expect, it } from 'vitest'
import {
  DEFAULT_THEME_ACCENT,
  mixHexColor,
  normalizeThemeAccent
} from './theme'

describe('theme color helpers', () => {
  it('normalizes supported hex colors', () => {
    expect(normalizeThemeAccent('#2563eb')).toBe('#2563EB')
    expect(normalizeThemeAccent('#abc')).toBe('#AABBCC')
  })

  it('falls back to the default color for invalid input', () => {
    expect(normalizeThemeAccent('red')).toBe(DEFAULT_THEME_ACCENT)
    expect(normalizeThemeAccent('')).toBe(DEFAULT_THEME_ACCENT)
  })

  it('creates deterministic theme shades', () => {
    expect(mixHexColor('#000000', '#FFFFFF', 0.5)).toBe('#808080')
    expect(mixHexColor('#2563EB', '#FFFFFF', 0)).toBe('#2563EB')
    expect(mixHexColor('#2563EB', '#FFFFFF', 1)).toBe('#FFFFFF')
  })
})
