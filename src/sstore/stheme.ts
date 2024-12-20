import StatusBarConfig from '@/utils/StatusBarConfig'
import { reactive } from 'vue'
import sutil from './sutil'

export const stheme = reactive({
  theme: {
    blue: {
      headerBgColor: () => {
        const sh = sutil.px2rem(StatusBarConfig.statusHeight)
        return `url(/static/theme/blue/bg-square.webp) 336rem -${104 - sh}rem / 523rem auto no-repeat,linear-gradient(to right, rgba(0, 111, 255) 0%, rgba(16, 127, 253) 100%)`
      }
    }
  }
})

export default stheme
