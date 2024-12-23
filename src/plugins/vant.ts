import '@vant/touch-emulator'
import { Lazyload } from 'vant'
import { App } from 'vue'
export const install = (app: App) => {
  app.use(Lazyload, {
    lazyComponent: true
  })
}

export default {
  install
}
