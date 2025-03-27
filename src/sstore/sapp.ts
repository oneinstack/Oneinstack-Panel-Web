import { EKey } from '@/enum/Enum'
import { clear } from 'console'
import { reactive } from 'vue'

export const sapp = reactive({
  load: () => {
    sapp.theme = Cookie.get(EKey.pageTheme) || 'light'
  },
  websiteInfo: null as any,//新增插件信息状态网站
  mysqlInfo: null as any,//新增mysql信息状态
  isFirstLogin: false, // 新增首次登录状态
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
  setmysqlInfo(info: any) { //新增查看插件安装状态的方法
    sapp.mysqlInfo= info
  },
  clearWebsiteInfo() {//退出登陆时清空插件状态信息
    sapp.websiteInfo = null
    sapp.mysqlInfo = null
  },
  setFirstLogin(status: boolean) { // 新增设置首次登录状态的方法
    sapp.isFirstLogin = status
  }
})

export default sapp
