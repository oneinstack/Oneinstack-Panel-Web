import { App } from 'vue'
import toolsJavascript from './tools-javascript'
import toolsVue3 from './tools-vue3'
import uivite from './uivite'
import vant from './vant'
export const install = (app: App) => {
  app.use(toolsJavascript)
  app.use(toolsVue3)
  app.use(uivite)
  app.use(vant)
}

export default {
  install
}
