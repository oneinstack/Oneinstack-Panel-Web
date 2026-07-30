import System from '@/utils/System'
import { reactive } from 'vue'
import { sutil } from './sutil'

export const sconfig = reactive({
  load: () => {
    const saved = sessionStorage.getItem('oneinstack_user')
    const savedMenuAccess = sessionStorage.getItem('oneinstack_menu_access')
    try {
      sconfig.userInfo = saved ? JSON.parse(saved) : null
      sconfig.menuAccess = savedMenuAccess ? JSON.parse(savedMenuAccess) : {}
    } catch {
      sessionStorage.removeItem('oneinstack_user')
      sessionStorage.removeItem('oneinstack_menu_access')
      sconfig.userInfo = null as any
      sconfig.menuAccess = {}
    }
  },
  userInfo: null as any as any,
  menuAccess: {} as Record<string, boolean>,

  /**
   * 成功登录用户
   */
  login(info: any) {
    sutil.reset()

    sconfig.userInfo = info
    sessionStorage.setItem('oneinstack_user', JSON.stringify(info))
  },
  setMenuAccess(menu: Record<string, boolean>) {
    sconfig.menuAccess = menu || {}
    sessionStorage.setItem('oneinstack_menu_access', JSON.stringify(sconfig.menuAccess))
  },
  hasMenuAccess(key?: string) {
    if (!key) return true
    if (sconfig.userInfo?.user?.isAdmin || sconfig.userInfo?.user?.isSuperAdmin) return true
    return Boolean(sconfig.menuAccess?.[key])
  },
  /**
   * 退出登录
   */
  logout(toLogin = false) {
    sessionStorage.removeItem('oneinstack_user')
    sessionStorage.removeItem('oneinstack_menu_access')
    sutil.reset()
    sconfig.userInfo = null as any
    sconfig.menuAccess = {}

    // 是否跳转到登录页
    if (toLogin)
      setTimeout(() => {
        System.router.push('/login')
      }, 300)
  }
})

export default sconfig
