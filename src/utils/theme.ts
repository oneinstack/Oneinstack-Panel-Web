export type PageTheme = 'light' | 'dark'

export interface ThemeAccentPreset {
  name: string
  color: string
  description: string
  nameKey?: string
  descriptionKey?: string
}

export const DEFAULT_THEME_ACCENT = '#F97316'

export const THEME_ACCENT_PRESETS: ThemeAccentPreset[] = [
  { name: 'Vibrant orange', color: '#F97316', description: 'Default theme, warm and prominent', nameKey: 'setting.appearance.presets.orange.name', descriptionKey: 'setting.appearance.presets.orange.description' },
  { name: 'Tech blue', color: '#2563EB', description: 'Clear and steady, suitable for operations', nameKey: 'setting.appearance.presets.blue.name', descriptionKey: 'setting.appearance.presets.blue.description' },
  { name: 'Emerald green', color: '#059669', description: 'Natural and comfortable with clear status recognition', nameKey: 'setting.appearance.presets.green.name', descriptionKey: 'setting.appearance.presets.green.description' },
  { name: 'Aurora purple', color: '#7C3AED', description: 'Modern, vivid, and layered', nameKey: 'setting.appearance.presets.purple.name', descriptionKey: 'setting.appearance.presets.purple.description' },
  { name: 'Coral red', color: '#E11D48', description: 'High contrast for emphasized feedback', nameKey: 'setting.appearance.presets.red.name', descriptionKey: 'setting.appearance.presets.red.description' },
  { name: 'Deep cyan', color: '#0891B2', description: 'Calm and minimal for long sessions', nameKey: 'setting.appearance.presets.cyan.name', descriptionKey: 'setting.appearance.presets.cyan.description' }
]

export const normalizeThemeAccent = (value?: string | null) => {
  const color = String(value || '').trim()
  if (/^#[\da-f]{3}$/i.test(color)) {
    return `#${color
      .slice(1)
      .split('')
      .map(item => `${item}${item}`)
      .join('')}`.toUpperCase()
  }
  if (/^#[\da-f]{6}$/i.test(color)) return color.toUpperCase()
  return DEFAULT_THEME_ACCENT
}

const hexToRgb = (value: string) => {
  const color = normalizeThemeAccent(value).slice(1)
  return {
    r: Number.parseInt(color.slice(0, 2), 16),
    g: Number.parseInt(color.slice(2, 4), 16),
    b: Number.parseInt(color.slice(4, 6), 16)
  }
}

const rgbToHex = (red: number, green: number, blue: number) => {
  const channel = (value: number) => Math.round(value).toString(16).padStart(2, '0')
  return `#${channel(red)}${channel(green)}${channel(blue)}`.toUpperCase()
}

export const mixHexColor = (source: string, target: string, targetWeight: number) => {
  const from = hexToRgb(source)
  const to = hexToRgb(target)
  const ratio = Math.min(1, Math.max(0, targetWeight))
  return rgbToHex(
    from.r + (to.r - from.r) * ratio,
    from.g + (to.g - from.g) * ratio,
    from.b + (to.b - from.b) * ratio
  )
}

export const applyThemeAppearance = (
  theme: PageTheme,
  accentInput: string,
  root: HTMLElement = document.documentElement
) => {
  const accent = normalizeThemeAccent(accentInput)
  const rgb = hexToRgb(accent)
  const surface = theme === 'dark' ? '#111827' : '#FFFFFF'
  const darkColor = mixHexColor(accent, theme === 'dark' ? '#FFFFFF' : '#000000', theme === 'dark' ? 0.14 : 0.18)
  const lightColor = mixHexColor(accent, '#FFFFFF', 0.3)
  const menuHover = hexToRgb(mixHexColor(accent, surface, 0.9))

  root.classList.toggle('light', theme === 'light')
  root.classList.toggle('dark', theme === 'dark')
  root.style.setProperty('--primary-color', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
  root.style.setProperty('--primary-color-hex', accent)
  root.style.setProperty('--primary-color-dark', darkColor)
  root.style.setProperty('--primary-color-light', lightColor)
  root.style.setProperty('--primary-gradient-end', darkColor)
  root.style.setProperty('--focus-ring', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${theme === 'dark' ? 0.24 : 0.18})`)
  root.style.setProperty('--menu-item-bg-color-hover', `${menuHover.r}, ${menuHover.g}, ${menuHover.b}`)

  root.style.setProperty('--el-color-primary', accent)
  root.style.setProperty('--el-color-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
  root.style.setProperty('--el-color-primary-dark-2', darkColor)
  root.style.setProperty('--el-color-primary-light-3', mixHexColor(accent, surface, 0.3))
  root.style.setProperty('--el-color-primary-light-5', mixHexColor(accent, surface, 0.5))
  root.style.setProperty('--el-color-primary-light-7', mixHexColor(accent, surface, 0.7))
  root.style.setProperty('--el-color-primary-light-8', mixHexColor(accent, surface, 0.8))
  root.style.setProperty('--el-color-primary-light-9', mixHexColor(accent, surface, 0.9))

  return accent
}
