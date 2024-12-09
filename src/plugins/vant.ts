import '@vant/touch-emulator'
import { App } from 'vue'
// #ifvar-dev
import Vant from 'vant'
import 'vant/lib/index.css'
// #endvar
export const install = (app: App) => {
  // #ifvar-dev
  app.use(Vant)
  // #endvar
}

export default {
  install
}
