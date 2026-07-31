import System from '@/utils/System'
import { reactive } from 'vue'
import { sutil } from './sutil'

export const sconfig = reactive({
  load: () => {
    const saved = sessionStorage.getItem('oneinstack_user')
    const savedMenuAccess = sessionStorage.getItem('oneinstack_menu_access')
    const savedScopeAccess = sessionStorage.getItem('oneinstack_scope_access')
    const savedActionAccess = sessionStorage.getItem('oneinstack_action_access')
    const savedPanelEntryAccess = localStorage.getItem('oneinstack_panel_entry_access')
    try {
      sconfig.userInfo = saved ? JSON.parse(saved) : null
      sconfig.menuAccess = savedMenuAccess ? JSON.parse(savedMenuAccess) : {}
      sconfig.scopeAccess = savedScopeAccess ? JSON.parse(savedScopeAccess) : {}
      sconfig.actionAccess = savedActionAccess ? JSON.parse(savedActionAccess) : {}
      sconfig.panelEntryAccess = savedPanelEntryAccess ? JSON.parse(savedPanelEntryAccess) : null
    } catch {
      sessionStorage.removeItem('oneinstack_user')
      sessionStorage.removeItem('oneinstack_menu_access')
      sessionStorage.removeItem('oneinstack_scope_access')
      sessionStorage.removeItem('oneinstack_action_access')
      localStorage.removeItem('oneinstack_panel_entry_access')
      sconfig.userInfo = null as any
      sconfig.menuAccess = {}
      sconfig.scopeAccess = {}
      sconfig.actionAccess = {}
      sconfig.panelEntryAccess = null
    }
  },
  userInfo: null as any as any,
  menuAccess: {} as Record<string, boolean>,
  scopeAccess: {} as Record<string, Record<string, boolean>>,
  actionAccess: {} as Record<string, boolean>,
  panelEntryAccess: null as null | { enabled: boolean; path: string },

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
  setScopeAccess(scopes: Record<string, Record<string, boolean>>) {
    sconfig.scopeAccess = scopes || {}
    sessionStorage.setItem('oneinstack_scope_access', JSON.stringify(sconfig.scopeAccess))
  },
  setActionAccess(actions: Record<string, boolean>) {
    sconfig.actionAccess = actions || {}
    sessionStorage.setItem('oneinstack_action_access', JSON.stringify(sconfig.actionAccess))
  },
  setAccessMatrix(matrix: any) {
    sconfig.setMenuAccess(matrix?.menu || {})
    sconfig.setScopeAccess(matrix?.scopes || {})
    sconfig.setActionAccess(matrix?.actions || {})
  },
  hasMenuAccess(key?: string) {
    if (!key) return true
    if (sconfig.userInfo?.user?.isAdmin || sconfig.userInfo?.user?.isSuperAdmin) return true
    return Boolean(sconfig.menuAccess?.[key])
  },
  hasScopeAccess(scope?: string, action?: string) {
    if (!scope || !action) return true
    if (sconfig.userInfo?.user?.isAdmin || sconfig.userInfo?.user?.isSuperAdmin) return true
    return Boolean(sconfig.scopeAccess?.[scope]?.[action])
  },
  hasActionAccess(key?: string) {
    if (!key) return true
    if (sconfig.userInfo?.user?.isAdmin || sconfig.userInfo?.user?.isSuperAdmin) return true
    return Boolean(sconfig.actionAccess?.[key])
  },
  setPanelEntryAccess(access: { enabled: boolean; path?: string }) {
    sconfig.panelEntryAccess = {
      enabled: Boolean(access.enabled),
      path: access.path || ''
    }
    localStorage.setItem('oneinstack_panel_entry_access', JSON.stringify(sconfig.panelEntryAccess))
  },
  /**
   * 退出登录
   */
  logout(toLogin = false) {
    sessionStorage.removeItem('oneinstack_user')
    sessionStorage.removeItem('oneinstack_menu_access')
    sessionStorage.removeItem('oneinstack_scope_access')
    sessionStorage.removeItem('oneinstack_action_access')
    sutil.reset()
    sconfig.userInfo = null as any
    sconfig.menuAccess = {}
    sconfig.scopeAccess = {}
    sconfig.actionAccess = {}

    // 是否跳转到登录页
    if (toLogin)
      setTimeout(() => {
        System.router.push('/login')
      }, 300)
  }
})

export default sconfig
