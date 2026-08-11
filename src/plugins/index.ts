import { App } from 'vue'
import toolsJavascript from './tools-javascript'
import toolsVue3 from './tools-vue3'
import uivite from './uivite'

export const install = (app: App) => {
  app.use(toolsJavascript)
  app.use(toolsVue3)
  app.use(uivite)
}

export default {
  install
}
