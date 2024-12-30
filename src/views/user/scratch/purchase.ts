import { svalue } from '@/sstore/svalue'
import { nextTick, onMounted, reactive } from 'vue'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import i18n from '@/lang'
import { apis } from '@/api'
import { useRoute } from 'vue-router'

export const index = ({ modalRefs }: any) => {
  const conf = reactive({
    scratch: {} as any,
    coinSymbol: '',
    coinTousdt: '',
    scratchTicketPrice: 0,
    currentWalletInfo: {} as any, //当前设置默认钱包
    id: '' as any,
    defaultCoinInfo: {} as any, //接口返回默认币种
    coinlistArr: [] as any[],
    walletMoney: '-',
    defaultWalletInfo: {} as any,
    getDefaultCoin(obj: any) {
      conf.currentWalletInfo = obj
      conf.coinSymbol = obj.coinSymbol || ''
      conf.coinTousdt = obj.coinTousdt || ''
      nextTick(() => {
        conf.getScratchTicketlDetail(conf.id)
      })
    },

    goPlay() {
      // let randomNums = "[{\"number\":19,\"bonus\":\"1000000\"},{\"number\":27,\"bonus\":\"1000\"},{\"number\":11,\"bonus\":20.0000},{\"number\":41,\"bonus\":\"30\"},{\"number\":37,\"bonus\":\"300000\"},{\"number\":95,\"bonus\":\"10\"},{\"number\":7,\"bonus\":\"100000\"},{\"number\":8,\"bonus\":\"300\"},{\"number\":67,\"bonus\":\"1000000\"},{\"number\":35,\"bonus\":\"200000\"},{\"number\":54,\"bonus\":\"10\"},{\"number\":36,\"bonus\":\"2000\"},{\"number\":3,\"bonus\":\"10\"},{\"number\":78,\"bonus\":\"2000\"},{\"number\":90,\"bonus\":\"20000\"}]"
      // let arr = JSON.parse(randomNums)
      let saleWinningNums = '[20]'
      let arr = [0, 10, 20, 30, 40, 50, 60, 70, 80, 100, 120, 130, 140, 150, 160]
      let saleRandomNums = arr.map((item) => {
        let number = 10 + item
        let money = 20 + item
        return {
          number,
          money
        }
      })
      // let saleRandomNums = arr.map(item => {
      // 	let tousdt = conf.getCoinTousdt(item.bonus,2)
      // 	let money = tousdt
      // 	if(tousdt.length == 4) money = tousdt.charAt(0) + 'K'
      // 	if(tousdt.length == 5) money = tousdt.charAt(0) + 'W'
      // 	if(tousdt.length == 6) money = tousdt.substr(0,2) + 'W'
      // 	if(tousdt.length == 7) money = tousdt.charAt(0) + 'M'
      // 	if(tousdt.length == 8) money = tousdt.substr(0,2) + 'M'
      // 	if(tousdt.length == 9) money = tousdt.charAt(0) + 'B'
      // 	if(tousdt.length == 10) money = tousdt.substr(0,2) + 'B'
      // 	if(tousdt.length == 11) money = tousdt.substr(0,3) + 'B'
      // 	return {
      // 		money,
      // 		...item
      // 	}
      // })
      let scratch = {
        saleRandomNums: JSON.stringify(saleRandomNums),
        saleWinningNums,
        id: '-1',
        isScratch: false
      }
      Cookie.set('scratch', scratch)
      System.router.push('/user/scratch/play')
    },
    changePurchase() {
      if (!sconfig.userInfo) return System.router.push('/login')
      modalRefs.value.open({
        title: i18n.t('scratch.nowPlay')
      })
    },
    confirm() {
      System.loading()
      apis.scratchTicketlPurchase({
        stId: conf.scratch.id,
        total: 1,
        walletCoinCode: conf.defaultWalletInfo.walletCoin,
        success: (res: any) => {
          let scratchData = res.data
          let arr = JSON.parse(scratchData.saleRandomNums)
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
          let scratch = {
            saleRandomNums: JSON.stringify(saleRandomNums),
            saleWinningNums: scratchData.saleWinningNums,
            id: scratchData.id,
            isScratch: false
          }
          Cookie.set('scratch', scratch)
          modalRefs.value.close()
          System.router.push('/user/scratch/play')
        },
        final: () => {
          System.loading(false)
        }
      })
    },
    getScratchTicketlDetail(scratchTicketId: any) {
      System.loading()
      apis.scratchTicketlDetail({
        scratchTicketId,
        success: (res: any) => {
          conf.scratch = res.data
          conf.scratch.newScratchTicketPrice = sutil.Mul(
            conf.currentWalletInfo.coinTousdt,
            conf.scratch.scratchTicketPrice
          )
          conf.scratch.newScratchTicketPrice = sutil.formatNumber(conf.scratch.newScratchTicketPrice)
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
    getCoinTousdt(num: any, type: any) {
      conf.coinSymbol = conf.coinSymbol || conf.defaultWalletInfo.coinSymbol
      let coinTousdt = conf.coinTousdt || conf.defaultWalletInfo.coinTousdt
      if (type == 2) {
        if (conf.coinSymbol == '$') return num
        if (coinTousdt) {
          return parseFloat(coinTousdt) * parseFloat(num)
        }
        return num
      } else {
        let number = parseFloat(num)
        if (conf.coinSymbol == '$') return number.toFixed(2)
        if (coinTousdt) {
          let n = parseFloat(coinTousdt) * parseFloat(num)
          return n.toFixed(2)
        }
        return number.toFixed(2)
      }
    },
    goHisTory() {
      if (sconfig.userInfo) {
        System.router.push('/user/scratch/history')
      } else {
        System.router.replace('/login')
      }
    }
  })
  const route = useRoute()
  onMounted(async () => {
    if (Cookie.get('scratch')) {
      Cookie.remove('scratch')
    }
    const routeParams = route.query

    routeParams.id && (conf.id = routeParams.id)
    if (!sconfig.userInfo) return (conf.walletMoney = '-')
    let item = await svalue.getDefaultWallet()
    conf.getDefaultCoin(item)
    conf.defaultWalletInfo = item
    if (item.hasOwnProperty('coinSymbol')) {
      conf.defaultWalletInfo = item
      let m = parseFloat(item.walletMoney)
      conf.walletMoney = (item.coinSymbol || '₹') + sutil.dataHandling(m)
    }
  })

  return conf
}
