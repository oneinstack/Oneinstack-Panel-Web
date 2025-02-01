import { apis } from '@/api'
import { onMounted, reactive, ref } from 'vue'
import i18n from '@/lang'
import slottery from '@/sstore/slottery'
import { getOdds } from './winGoDataOdds'
import { Scope } from 'tools-vue3'
import { svalue } from '@/sstore/svalue'
import sutil from '@/sstore/sutil'

export const index = () => {
  const timer = Scope.Timer()
  const lottery = slottery.lotteryBox({
    timer: timer,
    success: (onetime: any, status: any, results: any) => {
      //设置开奖信息
      // results.forEach((item: any, index: number) => {})
      //处理游戏和刷新结果
      conf.loop.action(results.map((v: any) => v.num))
      conf.page.change(1)
    },
    updateCountDown: (time: any) => {
      if (time[3] <= 0) {
        conf.loop.runAni()
      }
      conf.betting.popup.autoClose(time[3])
    },
    resultSize: 5,
    showBox: () => {}
  })
  const conf = reactive({
    gameType: 'Trx_Win_Go',
    layout: {
      ref: null as any,
      setRef: (el: any) => {
        if (el) conf.layout.ref = el
        else conf.layout.ref = null as any
      }
    },
    /**
     * 开奖处理
     */
    loop: {
      // 开奖结果信息
      openCode: ['B', 'A', 'E', 'A', '4'],
      autoplay: false,
      resuleIndex: null as any,
      /**
       * 开始开奖动画
       */
      runAni: () => {
        conf.loop.autoplay = true
        let arr = Array.from({ length: 26 }, (_, index) => String.fromCharCode('A'.charCodeAt(0) + index))
        conf.loop.openCode.forEach((item: any, index) => {
          const num = Math.floor(Math.random() * 26)
          conf.loop.openCode[index] = arr[num]
        })
        setTimeout(() => {
          if (conf.loop.autoplay) {
            conf.loop.runAni()
          }
        }, 100)
      },
      action: (res: any) => {
        conf.loop.autoplay = false
        const val = res[0]
        let openCode = conf.loop.toUpperCase(val.slice(val.length - 5, val.length))
        conf.loop.openCode = Array.from(openCode)
        let regex = /^[0-9]*$/ // 匹配数字
        conf.loop.resuleIndex = null
        conf.loop.openCode.forEach((item, itemIndex) => {
          if (regex.test(item)) {
            conf.loop.resuleIndex = itemIndex
            conf.loop.openCode[itemIndex] = item
          }
        })
      },
      // 使用正则表达式匹配字符串中的所有字母，并将其转换为大写
      toUpperCase(str: any) {
        return str.replace(/[a-z]/g, function (letter: any) {
          return letter.toUpperCase()
        })
      },
      //匹配开奖结果最后一个数字的位置
      findLastDigitIndex(str: any) {
        const matches = str.match(/\d(?!.*\d)/)
        const index = matches ? str.search(/\d(?!.*\d)/) : -1
        return index
      }
    },
    /**
     * 功能控制菜单
     */
    operation: {
      active: 'result',
      list: [
        {
          label: i18n.t('game.resultHistory'),
          value: 'result'
        },
        {
          label: i18n.t('winGo.Chart'),
          value: 'chart'
        },
        {
          label: i18n.t('game.rule'),
          value: 'rule'
        },
        {
          label: i18n.t('game.myOrder'),
          value: 'myOrder'
        }
      ],
      change: (item: any) => {
        conf.operation.active = item.value
        conf.page.reset()
        conf.page.change(1)
      }
    },
    /**
     * 下注信息
     */
    betting: {
      betTypeArr: [] as any,
      betNumArr: [] as any[], //选中的数据
      typeTitle: '',
      showCods: '',
      oddsInfo: {} as any,
      tabs: {
        list: getOdds(),
        init: () => {
          setTimeout(() => {
            conf.betting.getOdds()
          }, 600)
        }
      },
      popup: {
        open: (item: any, type: number) => {
          item.isActive = !item.isActive
          lottery.bet.content = [item.oddsCode]
          conf.betting.showCods = item.name
          if (type == 1) conf.betting.betTypeArr = [item]
          if (type == 2) conf.betting.betNumArr = [item]

          conf.layout.ref.open()
        },
        close: (e: any) => {
          conf.betting.tabs.list[0].sizeList.forEach((item) => {
            item.isActive = false
          })
          conf.betting.tabs.list[0].numList.forEach((item) => {
            item.isActive = false
          })
          conf.betting.betTypeArr = []
          conf.betting.betNumArr = []
          conf.layout.ref.close()
        },
        autoClose: (time: any) => {
          if (time <= lottery.play.item.openLockCountdown) {
            conf.betting.popup.close({})
          } else {
          }
        }
      },
      oddsArr: [] as any[],
      //获取赔率
      getOdds: async () => {
        let list = await slottery.findLotteryList(conf.gameType)
        const { data } = await apis.lotteryOdds({
          lotteryTypeId: list[0].lotteryTypeId,
          lotteryTypeCode: conf.gameType
        })
        const fun = (item: any) => {
          conf.betting.oddsInfo[item.oddsCode] = Number(item.odds)
        }
        data.forEach(fun)
      }
    },
    page: {
      pageSize: 10,
      pageNum: 1,
      total: 9,
      reset: () => {
        conf.page.total = 0
        conf.page.pageNum = 1
      },
      change: (val: any) => {
        conf.page.pageNum = val
        if (conf.operation.active == 'result' || conf.operation.active == 'chart') conf.his.result.getList()
        else if (conf.operation.active == 'myOrder') conf.his.order.getList()
      }
    },
    his: {
      result: {
        comKey: 0,
        list: [] as any[],
        chartList: [] as any[],
        getList: async () => {
          const { data: openData } = await apis.lotteryOpenResult({
            current: conf.page.pageNum,
            size: conf.page.pageSize,
            lotteryId: lottery.current.lotteryId
          })
          conf.his.result.list = openData.records || []
          conf.his.result.list?.forEach((item: any) => {
            item.openNumberStr = conf.loop.toUpperCase(
              item.openCode.slice(item.openCode.length - 5, item.openCode.length)
            )
            let index = conf.loop.findLastDigitIndex(item.openNumberStr)
            item.openNumber = String(item.openNumberStr.slice(index, index + 1)) || ''
          })
          conf.page.total = openData.total
          conf.his.result.comKey++
          conf.his.result.chartList = conf.his.result.list.filter((item: any) => {
            return item.openCode
          })
        }
      },
      order: {
        list: [],
        //获取roder列表
        getList: async () => {
          let defaultWalletInfo = await svalue.getDefaultWallet()
          const { data } = await apis.lotteryUserOrder({
            current: conf.page.pageNum,
            size: conf.page.pageSize,
            lotteryId: lottery.current.lotteryId
          })

          let coinlistArr = await svalue.getCoinlist() //货币数据
          data.records?.forEach((item: any) => {
            item.openNumberStr = item.betOpenCode
              ? item.betOpenCode.slice(item.betOpenCode.length - 5, item.betOpenCode.length)
              : ''
            let index = conf.loop.findLastDigitIndex(item.openNumberStr)
            item.openNumber = index != -1 ? parseFloat(item.openNumberStr.slice(index, index + 1)) : ''

            let color = conf.betting.tabs.list[0].numList.find((into: any) => into.label == item.openNumber)?.color || ''
            item.color = color
            //下注number
            item.betNumber = item.betCodes.split('_')[1]
            //下注number对应颜色
            let betColor = conf.betting.tabs.list[0].numList.find((into: any) => into.label == item.betNumber)?.color || ''
            item.betColor = betColor
            let obj = coinlistArr.find((into) => into.coinCode == item.betCoinCode)
            //默认钱包coinSymbol
            item.defaultWalletCoinSymbol =
              defaultWalletInfo.coinSymbol == 'USDT' ? defaultWalletInfo.coinSymbol + ' ' : defaultWalletInfo.coinSymbol
            item.defaultWalletCoin = defaultWalletInfo.walletCoin

            //下注钱包coinSymbol
            item.coinSymbol = obj.coinSymbol == 'USDT' ? obj.coinSymbol + ' ' : obj.coinSymbol

            // 下注钱包对应汇率
            item.coinTousdt = obj?.coinTousdt

            //下注金额汇率转换（eg:默认钱包=CNY，默认币种钱包=INR,下注钱包=USD,将下注金额转换为默认钱包对应金额）
            let betMoneyResult = sutil.Mul(
              sutil.division(defaultWalletInfo.coinTousdt, item.coinTousdt, false),
              item.totalBetAmount
            )
            betMoneyResult = sutil.formatNumber(betMoneyResult)
            let betMoneyResultToFixed4 = sutil.dataHandling(betMoneyResult)
            item.betMoneyToFixed4 = betMoneyResultToFixed4

            //中奖金额汇率转换
            let PrizeMoneyResult = null
            if (parseFloat(item.betPrizeMoney) > 0) {
              PrizeMoneyResult = sutil.Mul(
                sutil.division(defaultWalletInfo.coinTousdt, item.coinTousdt, false),
                item.betPrizeMoney
              )
              PrizeMoneyResult = sutil.formatNumber(PrizeMoneyResult)
            } else {
              item.betPrizeMoney = 0.0
              PrizeMoneyResult = 0.0
            }
            let PrizeMoneyResultToFixed4 = sutil.dataHandling(PrizeMoneyResult)
            item.PrizeMoneyToFixed4 = PrizeMoneyResultToFixed4
          })
          conf.his.order.list = data.records || []
          conf.page.total = data.total
        }
      }
    }
  })

  onMounted(() => {
    conf.loop.runAni()
    // 初始化下注区域
    conf.betting.tabs.init()
  })

  Scope.setConf({
    conf,
    lottery
  })

  return { conf, lottery }
}

export type dConfInter = ReturnType<typeof index>
