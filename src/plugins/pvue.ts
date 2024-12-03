import System from '@/utils/System'
import { App } from 'vue'
import { InertiaScroller } from './pvue-com/InertiaScroller'

export const install = (app: App) => {
  /** 支持pc端滚动指令，对需要pc端滚动的元素添加此指令 v-scroll */
  app.directive('scroll', {
    mounted(el: HTMLDivElement) {
      if (System.isMobile) return
      new InertiaScroller(el)
    }
  })
}

export default {
  install
}
