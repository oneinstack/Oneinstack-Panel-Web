import { apis } from '@/api/index'
import System from '@/utils/System'
import { reactive } from 'vue'
import { sutil } from './sutil'
import cConfig from '@/modules/chat/utils/cConfig'

export const sconfig = reactive({
  load: () => {
    sconfig.userInfo = Cookie.get('userInfo') || (null as any)
  },
  userInfo: null as any as { [key: string]: any; uid: string; email: string; userNickname: string; userName: string },
  money: '-',
  walletInfo: {} as any,
  systemWalletInfo: {} as any,

  async toChat(url: string = '/chat') {
    const _info = Cookie.get('chatInfo')

    if (_info) {
      console.log('info', _info)
      System.router.push(url)
      return
    }

    System.loading(true)
    let { data: info } = await apis.getToken({
      platform: 5,
      final(status, config, xhr) {
        System.loading(false)
      }
    })
    let urlStr = info.url.replace(/\s+/g, '')
    let urlList = urlStr.split(',')

    const getFastUrl = async (_list: any[]) => {
      return new Promise(async (resolve) => {
        await Promise.all(
          _list.map((u: any) =>
            HttpUtil.ping(u).then((time) => {
              resolve({ time, u })
              return { time, u }
            })
          )
        )
      })
    }

    System.loading(true)
    let resultUrl = await getFastUrl(urlList)
    System.loading(false)

    console.log('info', info)

    Cookie.set(
      'chatInfo',
      {
        ...info,
        url: resultUrl
      },
      {
        expire: 3600
      }
    )

    System.router.push(url)
  },

  /**
   * 成功登录用户
   */
  login(info: any) {
    // 清空token
    Cookie.clear()
    sutil.reset()

    sconfig.userInfo = info
    sconfig.saveUserInfo()
  },
  saveUserInfo() {
    Cookie.set('userInfo', sconfig.userInfo)
  },
  /**
   * 退出登录
   */
  logout(toLogin = false) {
    // 清空token
    Cookie.clear()
    sutil.reset()
    sconfig.userInfo = null as any

    //清理信息
    cConfig.isInit = false

    // 下线
    apis.offline()

    // 是否跳转到登录页
    if (toLogin)
      setTimeout(() => {
        System.router.push('/login')
      }, 300)
  },

  systemTime: 0,
  localTime: 0,
  getSystemTime: async () => {
    if (!sconfig.systemTime) {
      const time1 = Date.now()
      const res = await apis.getTime()
      sconfig.systemTime = res.data + (Date.now() - time1)
      sconfig.localTime = Date.now()
    }
    return sconfig.systemTime + (new Date().getTime() - sconfig.localTime)
  },
  /**
   * 获取实时系统时间-至少要请求一次getSystemTime，不然使用本地时间
   * @returns
   */
  nowTime: () => {
    if (!sconfig.systemTime) {
      sconfig.systemTime = Date.now()
      sconfig.localTime = Date.now()
    }
    return sconfig.systemTime + (new Date().getTime() - sconfig.localTime)
  }
})

export default sconfig
