import { apis } from '@/api/index'
import i18n, { langobj } from '@/lang'
import { reactive } from 'vue'
import { sutil } from './sutil'
const { appConfigurationV1, coinlist, gameType, languageList, walletlist } = apis
export const svalue = reactive({
  // 退出登录，重置数据
  reset() {
    svalue.coinlist = []
    svalue.showRedBag = true
    svalue.showServer = true
    svalue.gameTypeList = []
    svalue.getDefaultWalletPro = null
  },
  //系统配置
  configv1: {} as any,
  // 关闭/显示首页悬浮红包
  showRedBag: true,
  // 关闭/显示首页悬浮客户
  showServer: true,

  walletlist: [] as any[],

  /**
   * 获取最新用户钱包列表
   * @returns
   */
  async getWalletlist() {
    const { data } = await walletlist()
    svalue.walletlist = data
    return data
  },

  coinlist: [] as any[],
  /**
   * 获取币种汇率列表
   * @param force 是否强制刷新
   * @returns
   */
  async getCoinlist() {
    if (!svalue.coinlist.length) {
      const { data } = await coinlist()
      svalue.coinlist = data
    }
    return svalue.coinlist
  },

  getDefaultWalletPro: null as any,
  /**
   * 获取最新钱包数据，刷新用户余额
   * @returns
   */
  async getDefaultWallet() {
    if (svalue.getDefaultWalletPro) return await svalue.getDefaultWalletPro
    svalue.getDefaultWalletPro = new Promise(async (res) => {
      const sconfig = sutil.getStore('sconfig')
      let wlist = await svalue.getWalletlist()
      let clist = await svalue.getCoinlist()
      let defaultWalletId = sconfig.userInfo.defaultWalletId
      // 获取默认钱包对象
      let item = wlist.find((cur: any) => cur.id == defaultWalletId)
      // 没有默认钱包时，默认为第1个
      if(!item && wlist.length) item = wlist[0]
      // 获取默认钱包币种
      let coinItem = item ? clist.find((it: any) => it.coinCode == item.walletCoin) : {}
      let defaultWalletInfo = item
      if (coinItem) {
        defaultWalletInfo = {
          ...coinItem,
          ...item
        }
      }

      defaultWalletInfo.walletlist = wlist
      defaultWalletInfo.coinlist = clist

      //更新系统默认币种信息
      sconfig.systemWalletInfo = clist.find((item: any) => item.isDefault)
      //更新用户余额
      sconfig.money = parseFloat(defaultWalletInfo.walletMoney)
      //更新用户默认钱包信息
      sconfig.walletInfo = defaultWalletInfo

      res(defaultWalletInfo)

      svalue.getDefaultWalletPro = null
    })
    return await svalue.getDefaultWalletPro
  },

  // 获取系统信息
  async getAppConfiguration(load = false) {
    let _config = svalue.configv1 as any
    if(load) _config = {}
    if (!_config.app_logo) {
      const { data } = await appConfigurationV1()

      //将所有字符串的true和false转为布尔值
      for (const key in data) {
        if (typeof data[key] === 'string') {
          data[key] = data[key] === 'true' ? true : data[key] === 'false' ? false : data[key]
        }
      }
      _config = data

      svalue.configv1 = data
    }
    return _config
  },

  /** 判断页面是否可以访问 */
  async isOpen(key: string) {
    const config = await svalue.getAppConfiguration()
    if (!config[key]) {
      throw new Error('')
    }
  },

  languageList: [] as any[],
  // 获取当前语言信息
  async currentLanguage() {
    let _list = svalue.languageList
    if (!_list.length) {
      const { data } = await languageList({})
      _list = data
      svalue.languageList = data
    }
    let item = _list.find((x: any) => x.countryCode == langobj[i18n.locale])
    if (!item) item = _list.find((x: any) => x.countryCode == langobj['en-us'])
    return item
  },

  // 三方游戏跳转
  openGameMethod(pathUrl: string) {
    if (pathUrl.indexOf('http') != -1) {
      if (Cookie.get('gameMethod') && Cookie.get('gameMethod') == 1) {
        window.open(pathUrl, '_blank')
      } else {
        const sweb = sutil.getStore('sweb')
        sweb.open(pathUrl)
      }
    }
  },

  gameTypeList: [] as any[],
  async getGameType() {
    let _list = svalue.gameTypeList
    if (!_list.length) {
      const { data } = await gameType({})
      _list = data
      svalue.gameTypeList = data
    }
    return _list
  },

  sourceValueMap: {
    0: 'purchase',
    1: 'integral',
    2: 'activity',
    3: 'system'
  } as any,
  /**
   * 获取活动获取途径原始值
   * @param item
   * @returns
   */
  getSourceValue(val: number) {
    return i18n.t('source.' + svalue.sourceValueMap[val])
  }
})
