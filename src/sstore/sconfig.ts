import System from '@/utils/System'
import { reactive } from 'vue'
import { sutil } from './sutil'

export const sconfig = reactive({
  load: () => {
    const saved = sessionStorage.getItem('oneinstack_user')
    try {
      sconfig.userInfo = saved ? JSON.parse(saved) : null
    } catch {
      sessionStorage.removeItem('oneinstack_user')
      sconfig.userInfo = null as any
    }
  },
  userInfo: null as any as any,

  /**
   * 成功登录用户
   */
  login(info: any) {
    sutil.reset()

    sconfig.userInfo = info
    sessionStorage.setItem('oneinstack_user', JSON.stringify(info))
  },
  /**
   * 退出登录
   */
  logout(toLogin = false) {
    sessionStorage.removeItem('oneinstack_user')
    sutil.reset()
    sconfig.userInfo = null as any

    // 是否跳转到登录页
    if (toLogin)
      setTimeout(() => {
        System.router.push('/login')
      }, 300)
  }
})

export default sconfig
