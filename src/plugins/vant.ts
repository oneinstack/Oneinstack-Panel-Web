import '@vant/touch-emulator'
import { App } from 'vue'
//#ifvar-dev
import Vant from 'vant'
import 'vant/lib/index.css'
//#endif
export const install = (app: App) => {
  //#ifvar-dev
  app.use(Vant)
  //#endif
}

export default {
  install
}
