import { createRouter, createWebHashHistory } from 'vue-router'

import System from '@/utils/System'
import prefetchRouteData from './prefetch'
import { CRouter } from 'tools-vue3'
import routes from './routes'
import sconfig from '@/sstore/sconfig'
import { Api } from '@/api/Api'
import { ElMessage } from 'element-plus'
import { canAccessPath, getFirstAccessiblePath, resolveMenuKeyByPath, resolveMenuLabelByKey } from '@/utils/access'
import { getPanelEntryStatus, isPanelEntryPathAllowed } from '@/utils/panel-entry'
import i18n from '@/lang'

const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}

export const initRouter = () => {
  const _routes = CRouter.init({
    modules: import.meta.glob('/src/views/**/*.vue'),
    theme: Cookie.get('pageTheme'),
    excludeReg: ['/com/', '/components/'],
    children: routes,
    init: [
      {
        path: '/',
        redirect: '/home'
      },
      {
        path: '/:matchOthers(.*)*',
        redirect: '/'
      }
    ],
    alias: {
      '/user/login/index': '/login',
      '/user/register/register': '/register'
    },
    pathHook(path) {
      return path.replace(/^\/pages/, '').replace(/\/index$/, '')
    },
  })

  console.log('routes', _routes)
  const _routesMap = {} as any
  ObjectUtil.getObjectByChildren(_routes, (obj) => {
    if (obj.component) _routesMap[obj.path] = obj
  })

  const router = createRouter({
    history: createWebHashHistory(),
    routes: _routes
  })

  const whiteList = ['/login', '/login/scan', '/not-found']
  router.beforeEach(async (to, from, next) => {
    let _name = (to.meta.name as any) || ''
    let _title = System.env.title
    if (_name) _title = _title + ' - ' + _name
    document.title = _title
    document.documentElement.scrollTop = 0
    const panelEntryStatus = await getPanelEntryStatus()
    if (!isPanelEntryPathAllowed(panelEntryStatus)) {
      if (to.path !== '/not-found') return next('/not-found')
      return next()
    }
    const authenticated = Boolean(sconfig.userInfo?.authenticated)
    const mustChangePassword = Boolean(sconfig.userInfo?.mustChangePassword)
    if (!authenticated && !whiteList.includes(to.path)) return next('/login')
    if (authenticated && mustChangePassword && to.path !== '/first-login')
      return next('/first-login')
    if (authenticated && !mustChangePassword && to.path === '/first-login')
      return next('/')
    if (authenticated && whiteList.includes(to.path)) return next('/')
    if (authenticated && !mustChangePassword && Object.keys(sconfig.menuAccess || {}).length === 0) {
      try {
        const matrixResponse = await Api.getAccessMatrix()
        sconfig.setAccessMatrix(matrixResponse?.data || {})
      } catch {
        sconfig.setAccessMatrix({})
      }
    }
    const menuKey = resolveMenuKeyByPath(to.path)
    if (authenticated && menuKey && !canAccessPath(to.path)) {
      ElMessage.warning(t('common.noMenuPermission', 'This account does not have permission for the {menu} menu', { menu: resolveMenuLabelByKey(menuKey) }))
      return next(from.path && from.path !== to.path ? from.path : getFirstAccessiblePath())
    }
    next()
  })

  router.afterEach((guard) => {
    const _arr = prefetchRouteData[guard.path]
    if (_arr) {
      _arr.forEach((v: string) => {
        if (_routesMap[v]) {
          _routesMap[v].component()
        }
      })
    }
  })

  System.router = router

  return router
}
