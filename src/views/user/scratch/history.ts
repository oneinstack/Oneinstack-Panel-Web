import { apis } from '@/api'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    resultList: [] as any[],
    pageSize: 10,
    pageNum: 1,
    total: 0,
    coinSymbol: '',
    coinTousdt: '',
    isRefresh: false,
    isTips: false,
    statistics: {
      drawn: 0,
      expired: 0,
      lose: 0,
      winning: 0
    },
    clickTab: null,
    serviceHeiht: 300,
    defaultCoin: {} as any, //接口返回默认币种钱包
    coinlistArr: [] as any[],
    currentWalletInfo: {} as any,
    defaultWalletInfo: {} as any,
    walletMoney: '-',
    async getDefaultCoin(obj: any) {
      conf.defaultCoin = obj
      conf.coinSymbol = obj.coinSymbol || ''
      conf.coinTousdt = obj.coinTousdt || ''
      conf.currentWalletInfo = obj
      conf.coinlistArr = await svalue.getCoinlist()
      conf.getScratchOrder()
    },

    handleTabClick(val: any) {
      if (val == conf.clickTab) {
        conf.clickTab = null
      } else {
        conf.clickTab = val
      }
      conf.pageNum = 1
      conf.resultList = []
      conf.getScratchOrder()
    },
    getScratchOrder() {
      conf.isTips = false
      System.loading()
      apis.scratchTicketlOrder({
        current: conf.pageNum,
        size: conf.pageSize,
        stSaleStatus: conf.clickTab || '',
        success: (res: any) => {
          let hasPush = false
          res.data.records?.forEach((item: any) => {
            item.source = svalue.getSourceValue(item.source)
            let obj = null
            if (item.saleMoneyCoin) {
              obj = conf.coinlistArr.find((into) => into.coinCode == item.saleMoneyCoin)
            } else {
              obj = conf.coinlistArr.find((into) => into.isDefault)
              item.saleMoneyCoin = obj.coinCode
            }
            item.coinTousdt = obj?.coinTousdt
            item.coinSymbol = item.saleMoneyCoin == 'USDT' ? obj.coinSymbol + ' ' : obj.coinSymbol
            item.saleWinningAmount = item.saleWinningAmount || '0.00'
            item.saleMoney = conf.moneyHandling(item.saleMoney || 0)
            //下注钱包对应中奖金额
            let saleWalletWin = sutil.formatNumber(sutil.Mul(item.coinTousdt, item.saleWinningAmount))
            item.saleWalletWin = conf.moneyHandling(saleWalletWin)

            //当前默认钱包对应中奖金额
            let currentWalletWin = sutil.formatNumber(
              sutil.Mul(conf.currentWalletInfo.coinTousdt, item.saleWinningAmount)
            )
            item.currentWalletWin = conf.moneyHandling(currentWalletWin)

            //当前默认钱包对应购买金额
            let currentWalletSale = sutil.Mul(
              sutil.division(conf.currentWalletInfo.coinTousdt, item.coinTousdt, false),
              item.saleMoney
            )
            currentWalletSale = sutil.formatNumber(currentWalletSale)
            item.currentWalletSale = conf.moneyHandling(currentWalletSale)

            let index = conf.resultList?.findIndex((into) => into.id == item.id)
            index != -1 && (hasPush = true)
          })
          if (!hasPush) {
            conf.resultList = [...conf.resultList, ...res.data.records]
          }
          if (res.data.statistics) conf.statistics = res.data.statistics
          conf.total = res.data.total
          if (conf.pageSize * conf.pageNum >= conf.total) return (conf.isTips = true)
        },
        final: () => {
          System.loading(false)
        }
      })
    },
    // 时间戳转为时间格式
    getHour(timestamp: any) {
      if (!timestamp) return '-'
      let date = new Date(timestamp)
      let y = date.getFullYear()
      let m = ('0' + (date.getMonth() + 1)).slice(-2)
      let d = ('0' + date.getDate()).slice(-2)
      let hour = ('0' + date.getHours()).slice(-2)
      let minute = ('0' + date.getMinutes()).slice(-2)
      return y + '-' + m + '-' + d + ' ' + hour + ':' + minute
    },
    getFixed(num: any) {
      if (!num) return '-'
      let n = parseFloat(num)
      return n.toFixed(2)
    },
    goPlay(sale: any) {
      if (sale.stSaleStatus == 0) conf.isRefresh = true
      let arr = JSON.parse(sale.saleRandomNums)
      let saleRandomNums = arr.map((item: any) => {
        let moneyResult = sutil.Mul(item.bonus, conf.currentWalletInfo.coinTousdt)
        moneyResult = sutil.formatNumber(moneyResult)
        let money = null,
          moneyToFixed4 = null
        money = conf.moneyHandling(moneyResult)
        moneyToFixed4 = moneyResult
        return {
          money,
          moneyToFixed4,
          ...item
        }
      })
      let isScratch = sale.stSaleStatus == 0 ? false : true
      let scratch = {
        saleRandomNums: JSON.stringify(saleRandomNums),
        saleWinningNums: sale.saleWinningNums,
        id: sale.id,
        isScratch
      }
      Cookie.set('scratch', scratch)
      System.router.push('/user/scratch/play')
    },
    moreMessage() {
      if (conf.pageSize * conf.pageNum >= conf.total) return (conf.isTips = true)
      conf.pageNum++
      conf.getScratchOrder()
    },
    moneyHandling(num: any) {
      let amount = parseFloat(num)
      let newNum = null
      if (amount < 10000) {
        // 如果金额小于10,000，则直接显示原数值
        newNum = amount
      } else if (amount < 1000000) {
        // 如果金额在10,000到1,000,000之间，则显示为xxxx.xxW（万）
        newNum = amount / 1000 + 'K'
      } else if (amount < 1000000000) {
        // 如果金额在1,000,000到1,000,000,000之间，则显示为xxxx.xxM（百万）
        newNum = amount / 1000000 + 'M'
      } else {
        // 如果金额超过1,000,000,000，则显示为xxxx.xxB（十亿）
        newNum = amount / 1000000000 + 'B'
      }
      return newNum
    },
    multiple(number: any, multiple: any) {
      let len = number.length
      if (number.indexOf('.') >= 0) {
        len = number.indexOf('.')
      }
      let mLen = multiple.length - 1
      let result = ''
      let header = ''
      let index = 0
      let end = ''
      if (len > mLen) {
        index = len - mLen
        header = number.substring(0, index)
        end = number.substring(index)
        end = end.replace('.', '')
        result = header + '.' + end
      } else {
        header = '0.'
        index = mLen - len
        for (let i = 0; i < index; i++) {
          header += '0'
        }
        end = number.replace('.', '')
        result = header + end
      }
      result = result.substring(0, 4)
      if (result.indexOf('.') == result.length - 1) {
        result = result.replace('.', '')
      }
      return result
    },

    getCoinTousdt(num: any) {
      conf.coinSymbol = conf.coinSymbol || conf.defaultWalletInfo.coinSymbol
      let coinTousdt = conf.coinTousdt || conf.defaultWalletInfo.coinTousdt
      if (conf.coinSymbol == '$') return num
      if (coinTousdt) {
        let n = parseFloat(coinTousdt) * parseFloat(num)
        return n.toFixed(4)
      }
      return num
    },

    getCoinTousdtMoney(num: any) {
      let moneyResult = sutil.Mul(
        sutil.division(num, conf.defaultCoin.coinTousdt, false),
        conf.defaultWalletInfo.coinTousdt
      )
      moneyResult = sutil.formatNumber(moneyResult)
      let moneyToFixed4 = null
      if (conf.defaultWalletInfo.walletCoin == conf.defaultCoin.coinCode) {
        moneyToFixed4 = num
      } else {
        moneyToFixed4 = moneyResult
      }
      return sutil.dataHandling(moneyToFixed4)
    }
  })
  onMounted(async () => {
    if (!sconfig.userInfo) return (conf.walletMoney = '-')
    let item = await svalue.getDefaultWallet()
    conf.defaultWalletInfo = item
    if (item.hasOwnProperty('coinSymbol')) {
      conf.defaultWalletInfo = item
      let m = parseFloat(item.walletMoney)
      conf.walletMoney = (item.coinSymbol || '₹') + sutil.dataHandling(m)
    }
    conf.getDefaultCoin(item)
  })

  return conf
}
