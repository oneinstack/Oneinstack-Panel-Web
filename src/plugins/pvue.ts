import System from '@/utils/System'
import { App } from 'vue'
export const install = (app: App) => {
  /** 支持pc端滚动指令，对需要pc端滚动的元素添加此指令 v-scroll */
  app.directive('scroll', {
    mounted(el: HTMLDivElement) {
      if (System.isMobile) return
      const touch = DomUtil.useTouch()
      el.addEventListener('mousedown', (e) => {
        touch.start(e)
        const scrollLeft = el.scrollLeft
        const scrollTop = el.scrollTop
        const mouseMove = (_e: MouseEvent) => {
          el.scrollLeft = scrollLeft - touch.conf.deltaX
          el.scrollTop = scrollTop - touch.conf.deltaY
          touch.move(_e)
          el.style.pointerEvents = 'none'
        }
        const mouseUp = (_e: MouseEvent) => {
          touch.reset()
          document.removeEventListener('mousemove', mouseMove)
          document.removeEventListener('mouseup', mouseUp)
          el.style.pointerEvents = 'all'
        }
        document.addEventListener('mousemove', mouseMove)
        document.addEventListener('mouseup', mouseUp)
      })
    }
  })
}

export default {
  install
}
