import { svalue } from '@/sstore/svalue'
import { onMounted, reactive } from 'vue'
import System from '@/utils/System'
import { apis } from '@/api'
import sutil from '@/sstore/sutil'
import sconfig from '@/sstore/sconfig'
import StatusBarConfig from '@/utils/StatusBarConfig'

export const index = () => {
  const conf = reactive({
    price: '',
    prizeAsc: 0 as any,
    priceAsc: null as any,
    priceType: 0,
    scratchList: [] as any[],
    coinSymbol: '',
    typeList: [] as any[],
    defaultCoin: {} as any,
    defaultWalletInfo: {} as any,
    walletMoney: '-',
    sTop: '--sTop: 104rem',
    winData: [] as any[],
    goPurchase(item: any) {
      System.router.push('/user/scratch/purchase?id=' + item.id)
    },
    changePrice(num: any) {
      conf.price = num
      conf.getScratchTicketlList()
    },
    changeType(type: any) {
      conf.priceType = type
      if (type == 0) {
        conf.priceAsc = null
        conf.prizeAsc == 0 ? (conf.prizeAsc = 1) : (conf.prizeAsc = 0)
      }
      if (type == 1) {
        conf.prizeAsc = null
        conf.priceAsc == 0 ? (conf.priceAsc = 1) : (conf.priceAsc = 0)
      }
      conf.getScratchTicketlList()
    },
    getScratchTicketlList() {
      System.loading()
      apis.scratchTicketlList({
        price: conf.price,
        priceAsc: conf.priceAsc,
        prizeAsc: conf.prizeAsc,
        success: (res: any) => {
          conf.scratchList = res.data
          conf.coinSymbol = conf.defaultWalletInfo.coinSymbol
          conf.scratchList?.forEach((item: any) => {
            if (conf.defaultCoin.coinCode != conf.defaultWalletInfo.walletCoin) {
              let moneyResult = sutil.division(
                sutil.Mul(item.scratchTicketPrice, conf.defaultWalletInfo.coinTousdt),
                conf.defaultCoin.coinTousdt,
                false
              )
              let num = parseFloat(moneyResult)
              item.newScratchTicketPrice = sutil.formatNumber(num)
            } else {
              item.newScratchTicketPrice = parseFloat(item.scratchTicketPrice)
            }
          })

          if (!conf.price) {
            conf.typeList = conf.scratchList
          }
        },
        final: () => {
          System.loading(false)
        }
      })
    },
    getFixed(num: any) {
      if (!num) return '-'
      let n = parseFloat(num)
      return n.toFixed(2)
    },
    goHisTory() {
      let userInfo = sconfig.userInfo
      if (userInfo && userInfo.userId) {
        System.router.push('/user/scratch/history')
      } else {
        System.router.replace('/login')
      }
    },

    /** 获取刮刮乐虚拟数据 */
    async loadVirtualData() {
      const res = await apis.getStatistics({
        dataType: '11'
      })
      conf.winData = res.data['11']
    },
  })
  onMounted(async () => {
    conf.sTop = `--sTop:${(sutil.rem2px(104) + StatusBarConfig.statusHeight)}px`
    
    let coinlist = await svalue.getCoinlist()
    conf.defaultCoin = coinlist.find((item: any) => item.isDefault)

    if (!sconfig.userInfo) return (conf.walletMoney = '-')
    let item = await svalue.getDefaultWallet()
    conf.defaultWalletInfo = item
    if (item.hasOwnProperty('coinSymbol')) {
      conf.defaultWalletInfo = item
      let m = parseFloat(item.walletMoney)
      conf.walletMoney = (item.coinSymbol || '₹') + sutil.dataHandling(m)
    }
    conf.getScratchTicketlList()
    conf.loadVirtualData()
  })

  return conf
}
