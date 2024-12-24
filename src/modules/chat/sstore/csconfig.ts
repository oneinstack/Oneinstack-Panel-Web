import System from '@/utils/System'
import { reactive } from 'vue'

export const csconfig = reactive({
  userInfo: null! as cConfigParam,
  /**
   * 设置用户信息
   * @param userInfo 用户信息
   */
  setUserInfo: (userInfo?: cConfigParam) => {
    let chatInfo = userInfo as any
    if (!chatInfo) {
      //优先从url中获取
      const param = System.getRouterParams()
      if (param.url) {
        chatInfo = param
        Cookie.set('chatInfo', param, {
          expire: 3600
        })
      } else {
        chatInfo = Cookie.get('chatInfo') || {}
      }
    }
    csconfig.userInfo = chatInfo || {}

    //如果cookie有问题，则跳转至首页
    if (!chatInfo.url) {
      System.router.replace('/')
      return
    }
  },
  clearUserInfo: () => {
    csconfig.userInfo = null!
    Cookie.set('chatInfo', '', {
      expire: 1
    })
    System.router.replace('/')
  },
  /**
   * 基础配置
   */
  config: {
    /**
     * 聊天地址
     */
    wsUrl: '',
    /**
     * 接口地址
     */
    apiUrl: '',
    /**
     * 注册地址
     */
    registerUrl: ''
  },
  /**
   * 初始化配置
   */
  initConfig: (url?: string) => {
    if (!url) url = System.env.ChatUrl

    csconfig.config.wsUrl = url.replace('http', 'ws') + ':10001'
    csconfig.config.apiUrl = url + ':10002'
    csconfig.config.registerUrl = url + ':10008'

    csconfig.config.wsUrl = csconfig.config.wsUrl.replace('wss', 'ws')
  },
  /**
   * 加载配置
   */
  load: () => {}
})

export default csconfig
