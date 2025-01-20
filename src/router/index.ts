import { createRouter, createWebHashHistory } from '@ionic/vue-router'

import sapp from '@/sstore/sapp'
import System from '@/utils/System'
import prefetchRouteData from './prefetch'
import privateRoutes from './routes/index'
import { routeTheme } from './theme'

export const initRouter = () => {
  // 传主题参数可设置主题（/home/home?theme=blue）
  const {theme} = StrUtil.getParam(location.href)
  if(theme && theme != Cookie.get('pageTheme')) Cookie.set('pageTheme', theme)

  routeTheme(privateRoutes, Cookie.get('pageTheme'))

  let _routes = privateRoutes as any[]
  const routes = [
    ..._routes,
    {
      path: '/:matchOthers(.*)*',
      redirect: '/'
    }
  ]

  const router = createRouter({
    history: createWebHashHistory(),
    routes
  })

  router.beforeEach(async (to, from, next) => {
    if (sapp.backbtn.run()) return
    let _name = (to.meta.name as any) || ''
    let _title = System.env.title
    if (_name) _title = _title + ' - ' + _name
    document.title = _title
    document.documentElement.scrollTop = 0
    next()
  })

  /**
   * 路由映射
   */
  const _routesMap = {} as any
  ObjectUtil.getObjectByChildren(_routes, (obj) => {
    if (obj.component) _routesMap[obj.path] = obj
  })
  router.afterEach((guard) => {
    /**
     * 预加载路由
     */
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
