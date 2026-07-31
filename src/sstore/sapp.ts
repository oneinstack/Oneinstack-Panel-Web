import { EKey } from '@/enum/Enum'
import { reactive } from 'vue'
import {
  applyThemeAppearance,
  DEFAULT_THEME_ACCENT,
  normalizeThemeAccent,
  type PageTheme
} from '@/utils/theme'

export const sapp = reactive({
  load: () => {
    const storedTheme = Cookie.get(EKey.pageTheme)
    const theme: PageTheme = storedTheme === 'dark' ? 'dark' : 'light'
    const accentColor = normalizeThemeAccent(Cookie.get(EKey.pageThemeColor))
    sapp.theme = theme
    sapp.accentColor = accentColor
    applyThemeAppearance(theme, accentColor)
  },
  theme: 'light' as PageTheme,
  accentColor: DEFAULT_THEME_ACCENT,
  setTheme(theme: PageTheme) {
    sapp.theme = theme
    Cookie.set(EKey.pageTheme, theme)
    applyThemeAppearance(theme, sapp.accentColor)
  },
  setAccentColor(color: string) {
    const accentColor = normalizeThemeAccent(color)
    sapp.accentColor = accentColor
    Cookie.set(EKey.pageThemeColor, accentColor)
    applyThemeAppearance(sapp.theme, accentColor)
  },
  resetAppearance() {
    sapp.theme = 'light'
    sapp.accentColor = DEFAULT_THEME_ACCENT
    Cookie.set(EKey.pageTheme, sapp.theme)
    Cookie.set(EKey.pageThemeColor, sapp.accentColor)
    applyThemeAppearance(sapp.theme, sapp.accentColor)
  }
})

export default sapp
