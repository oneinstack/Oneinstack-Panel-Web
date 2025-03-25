import { EKey } from '@/enum/Enum'
import { clear } from 'console'
import { reactive } from 'vue'

export const sapp = reactive({
  load: () => {
    sapp.theme = Cookie.get(EKey.pageTheme) || 'light'
  },
  installDialogHasShown: false, // 新增属性
  websiteInfo: null as any,//新增插件信息状态
  theme: 'light' as 'light' | 'dark',
  layout:'grid' as 'grid' | 'list',
  setTheme(theme: 'light' | 'dark') {
    sapp.theme = theme
    Cookie.set(EKey.pageTheme, theme)
    document.documentElement.className = theme
  },
  setLayout(layout: 'grid' | 'list') {
    sapp.layout = layout
  },
  setWebsiteInfo(info: any) { //新增查看插件安装状态的方法
    sapp.websiteInfo = info
  },
  clearWebsiteInfo() {//退出登陆时清空插件状态信息
    sapp.websiteInfo = null
  }
})

export default sapp
