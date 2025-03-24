import { EKey } from '@/enum/Enum'
import { reactive } from 'vue'

export const sapp = reactive({
  load: () => {
    sapp.theme = Cookie.get(EKey.pageTheme) || 'light'
  },
  installDialogHasShown: false, // 新增属性
  theme: 'light' as 'light' | 'dark',
  layout:'grid' as 'grid' | 'list',
  setTheme(theme: 'light' | 'dark') {
    sapp.theme = theme
    Cookie.set(EKey.pageTheme, theme)
    document.documentElement.className = theme
  },
  setLayout(layout: 'grid' | 'list') {
    sapp.layout = layout
  }
})

export default sapp
