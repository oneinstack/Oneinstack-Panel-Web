import { apis } from '@/api'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    //默认充值金额列表
    gameList: [] as any[],
    coinArr: [] as any[],
    isLoading: false,
    currentCoinSymbol: '',
    coinCode: '',

    //返回
    goBack() {
      sutil.pageBack()
    },

    async handleClickIntoPage(obj: any) {
      if (conf.gameList.length < 2) return
      if (obj.walletMoney == -1) {
        System.loading()
        obj.loading = true
        const { data } = await apis.gameWalletForCenter({
          coinCode: sconfig.systemWalletInfo.coinCode,
          gamePlatformCode: obj.code,
          final: () => {
            System.loading(false)
            obj.loading = false
          }
        })
        obj.walletMoney = data.walletMoney
        obj.currentWalletMoney = data.currentWalletMoney
        let coin = conf.coinArr.find((c: any) => c.coinCode == obj.platformCoinCode)

        obj.coinSymbol = coin?.coinSymbol || ''

        //处理(W)
        obj.currentWalletMoney = sutil.dataHandling(obj.currentWalletMoney)
        return
      }
      System.router.push({ path: '/user/wallet/exchangeThird', query: { type: obj.code } })
    },

    async getWalletMoney() {
      conf.isLoading = true
      try {
        const wlist = sconfig.walletInfo.walletlist
        const clist = sconfig.walletInfo.coinlist
        let defaultWalletId = sconfig.userInfo.defaultWalletId
        wlist.forEach((item: any) => {
          if (item.id == defaultWalletId) {
            conf.coinArr = clist
            //第三方未接通 不调接口
            conf.getPayPlatformList(item.walletCoin)
          }
        })
      } catch (err) {
        conf.isLoading = false
        System.loading(false)
      }
    },

    //获取列表
    async getPayPlatformList(coinCode: string) {
      conf.gameList = []
      conf.coinCode = coinCode
      System.loading()
      apis.getPayPlatformList({
        coinCode,
        success: (res: any) => {
          if (res.code == 200) {
            res.data.forEach((item: any) => {
              let coin = conf.coinArr.find((c: any) => c.coinCode == item.platformCoinCode)
              item.coinSymbol = coin?.coinSymbol || ''
              //处理(W)
              item.currentWalletMoney = sutil.dataHandling(item.currentWalletMoney, 2, 2)
            })
            conf.currentCoinSymbol = res.data.find((v: any) => v.code == 'Current').coinSymbol
            conf.gameList = res.data
          } else {
            System.toast(i18n.t(`code.${res.code}`) || 'fail')
          }
        },
        complete: () => {
          System.loading(false)
          conf.isLoading = false
        }
      })
    },

    getTWoFiexd(num: string) {
      if (!num) return ''
      let number = parseFloat(num)
      return number.toFixed(2)
    }
  })

  onMounted(async () => {
    await svalue.getDefaultWallet()
    conf.getWalletMoney()
  })

  return conf
}
