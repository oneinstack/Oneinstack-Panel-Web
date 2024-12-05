import { apis } from '@/api/index'
import System from '@/utils/System'
import { reactive } from 'vue'
import { sutil } from './sutil'

export const sconfig = reactive({
  load: () => {
    sconfig.userInfo = Cookie.get('userInfo') || (null as any)
  },
  userInfo: null as any as { [key: string]: any; uid: string; email: string; userNickname: string; userName: string },
  money: '-',
  walletInfo: {} as any,
  systemWalletInfo: {} as any,

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

    // 是否跳转到登录页
    if (toLogin)
      setTimeout(() => {
        System.router.push('/user/login/login')
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
  },

  img: {
    loadEnum: 'imgLoad_',
    zIndexList: [] as any[],
    max: 4, //同屏最大加载数，控制即使没有做懒加载，也不会同时加载太多图片
    loadPro: {} as any,
    eventList: [] as any[],
    getLoadPro: (fun: (resolve: (value: boolean) => void) => void, zIndex?: any) => {
      const getPro = (_index: number) => {
        sconfig.img.loadPro[_index] = new Promise((_resolve) => {
          fun((value: boolean) => {
            sconfig.img.loadPro[_index] = null
            _resolve(value)
            for (let j = 0; j < sconfig.img.zIndexList.length; j++) {
              CEvent.emit(sconfig.img.loadEnum + sconfig.img.zIndexList[j])
            }
          })
        })
        return sconfig.img.loadPro[_index]
      }
      for (let i = 0; i < sconfig.img.max; i++) {
        if (!sconfig.img.loadPro[i]) return getPro(i)
      }
      if (!zIndex) zIndex = 0
      zIndex = Number(zIndex)

      //当出现zIndex大于0时，每个优先级使用max个
      if (zIndex > 0) {
        for (let i = sconfig.img.max * zIndex; i < sconfig.img.max * (zIndex + 1); i++) {
          if (!sconfig.img.loadPro[i]) return getPro(i)
        }
      }

      sconfig.img.zIndexList.push(zIndex)
      sconfig.img.zIndexList = sconfig.img.zIndexList.toSet()
      sconfig.img.zIndexList.sort((a, b) => b - a)

      const eid = CEvent.once(sconfig.img.loadEnum + zIndex, () => {
        sconfig.img.eventList.remove((v) => v == eid)
        sconfig.img.getLoadPro(fun, zIndex)
      })
      sconfig.img.eventList.push(eid)
    },
    clear: () => {
      CEvent.off(...sconfig.img.eventList)
      sconfig.img.loadPro = {}
      sconfig.img.zIndexList = []
    }
  }
})

export default sconfig
