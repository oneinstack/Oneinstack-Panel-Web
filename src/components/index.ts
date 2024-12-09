import { App } from 'vue'
import img from './img/index.vue'
import loadImg from './loadImg/index.vue'
import noData from './noData/index.vue'
import page from './page/index.vue'
import routeEvent from './routeEvent/index.vue'
import statusbar from './statusbar/index.vue'
import navigationbar from './navigationbar/index.vue'
import tabbar from './tabbar/index.vue'
import imgAni from './imgAni/index.vue'
import tabs from './tabs/index.vue'
import log from './log/index.vue'
export const install = (app: App) => {
  app.component('xTabbar', tabbar)
  app.component('xStatusbar', statusbar)
  app.component('xNavigationbar', navigationbar)
  app.component('xRouteEvent', routeEvent)
  app.component('xPage', page)
  app.component('xNoData', noData)
  app.component('xImg', img)
  app.component('xLoadImg', loadImg)
  app.component('xImgAni', imgAni)
  app.component('xTabs', tabs)
  app.component('xLog', log)
}

export default {
  install
}
