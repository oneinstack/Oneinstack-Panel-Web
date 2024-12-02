import System from '@/utils/System'
import { reactive } from 'vue'
import sutil from './sutil'

export const sweb = reactive({
  lastUrl: undefined as any,
  open(url: string) {
    sweb.lastUrl = System.router.currentRoute.value.path
    System.router.push('/user/web/web?pathUrl=' + encodeURIComponent(url))
  },
  back() {
    if (!sweb.lastUrl) {
      sutil.pageBack()
      return
    }
    System.router.replace(sweb.lastUrl)
  }
})

export default sweb
