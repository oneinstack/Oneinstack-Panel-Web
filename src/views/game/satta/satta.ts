import i18n from '@/lang'
import slottery from '@/sstore/slottery'
import { Scope } from 'tools-vue3'
import { onMounted, reactive, ref } from 'vue'
import { apis } from '@/api'
import System from '@/utils/System'
import { svalue } from '@/sstore/svalue'
import sutil from '@/sstore/sutil'

export const index = () => {
  const cRefs = ref<any>()
  const timer = Scope.Timer()
  const lottery = slottery.lotteryBox({
    timer: timer,
    success: (onetime: any, status: any, results: any) => {
      //处理游戏和刷新结果
      if (conf.loop.numList.length) {
        conf.loop.action(results.map((v: any) => v.num))
      } else {
        const r = results.map((v: any) => v.num)
        conf.loop.resultCode = r
      }
      conf.page.change(1)
    },
    updateCountDown: (time: any) => {
      if (time[3] <= 0) {
        conf.loop.runAni()
      }
      if (!conf.betting.tabs.list[0].numArr.length) conf.betting.getOdds()
      conf.betting.popup.autoClose(time[3])
    },
    resultSize: 1,
    showBox: () => {}
  })
  const conf = reactive({
    gameType: 'SATTA_KING',
    layout: {
      ref: null as any,
      setRef: (el: any) => {
        if (el) conf.layout.ref = el
        else conf.layout.ref = null as any
      }
    },
    loop: {
      numList: [] as any[],
      autoplay: false,
      openCode: 0,
      resultCode: '',
      /**
       * 开始开奖动画
       */
      runAni: () => {
        conf.loop.autoplay = true
      },
      action: (res: any) => {
        conf.loop.autoplay = false
        let currIndex = conf.loop.numList.findIndex((item: any) => item.number == res[0])
        conf.loop.openCode = currIndex

        conf.page.change(1)
      }
    },
    /**
     * 功能控制菜单
     */
    operation: {
      active: 'betting',
      list: [
        {
          label: i18n.t('game.betting'),
          value: 'betting'
        },
        {
          label: i18n.t('game.result'),
          value: 'result'
        },
        {
          label: i18n.t('game.myOrder'),
          value: 'myOrder'
        },
        {
          label: i18n.t('game.rule'),
          value: 'rule'
        }
      ],
      change: (item: any) => {
        conf.operation.active = item.value
        conf.page.reset()
        conf.page.change(1)

        cRefs.value.scrollTo({
          top: 0
        })
      }
    },
    /**
     * 下注信息
     */
    betting: {
      tabs: {
        list: [
          {
            name: 'Jodi',
            value: 1,
            odds: '',
            numArr: [],
            rule: i18n.t('SattaKing.JodirRule')
          },
          {
            name: 'Andar',
            value: 2,
            odds: '',
            numArr: [],
            rule: i18n.t('SattaKing.AndarRule')
          },
          {
            name: 'Bndar',
            value: 3,
            odds: '',
            numArr: [],
            rule: i18n.t('SattaKing.BndarRule')
          }
        ] as any,
        item: {} as any,
        change(item: any) {
          const { tabs } = conf.betting
          conf.betting.betList = []
          tabs.item = item

          cRefs.value.scrollTo({
            top: 0
          })
        },
        init: () => {
          const { tabs } = conf.betting
          tabs.change(tabs.list[0])
        }
      },
      betShow: false,
      disabledShow: false,
      betList: [] as any[],
      typeTitle: '',
      popup: {
        open: (e: any) => {
          conf.betting.typeTitle = conf.betting.tabs.item.name
          conf.layout.ref.open()
          // conf.betting.betShow = true
        },
        close: (e: any) => {
          if (e.money) {
            lottery.bet.money = parseFloat(e.money) * lottery.bet.num
            lottery.bet.content = conf.betting.betList

            conf.betting.betShow = true
            timer.once(() => {
              conf.betting.betShow = false
            }, 2000)
          }

          conf.betting.betList = []
          conf.layout.ref.close()
        },
        autoClose: (time: any) => {
          if (time <= lottery.play.item.openLockCountdown) {
            conf.layout.ref.close()
            conf.betting.disabledShow = true
          } else {
            conf.betting.disabledShow = false
          }
        }
      },
      //获取赔率
      getOdds: async () => {
        let list = await slottery.findLotteryList(conf.gameType)
        const { data } = await apis.lotteryOdds({
          lotteryTypeId: list[0].lotteryTypeId,
          lotteryTypeCode: conf.gameType
        })
        data?.forEach((item: any) => {
          item.number = item.oddsCode.split('_')[1]
          if (item.oddsCode.includes('num')) {
            conf.betting.tabs.list[0].numArr.push(item)
          }
          if (item.oddsCode.includes('first')) {
            conf.betting.tabs.list[1].numArr.push(item)
          }
          if (item.oddsCode.includes('second')) {
            conf.betting.tabs.list[2].numArr.push(item)
          }
        })
        conf.loop.numList = conf.betting.tabs.list[0].numArr
        if (conf.loop.resultCode) conf.loop.action(conf.loop.resultCode)
      }
    },
    page: {
      pageSize: 10,
      pageNum: 1,
      total: 9,
      isTips: false,
      reset: () => {
        conf.page.isTips = false
        conf.page.total = 0
        conf.page.pageNum = 1
        conf.his.result.list = []
        conf.his.order.list = []
      },
      nextPage: () => {
        const v = conf.page.pageNum + 1
        conf.page.change(v)
      },
      change: (val: any) => {
        conf.page.pageNum = val
        if (conf.operation.active == 'result') conf.his.result.getList()
        else if (conf.operation.active == 'myOrder') conf.his.order.getList()
      }
    },
    his: {
      result: {
        comKey: 0,
        list: [] as any[],
        chartList: [] as any[],
        getList: async () => {
          System.loading()
          const { data: openData } = await apis.lotteryOpenResult({
            current: conf.page.pageNum,
            size: conf.page.pageSize,
            lotteryId: lottery.current.lotteryId,
            final: (status, data: any) => {
              System.loading(false)
            }
          })
          conf.his.result.list = [...conf.his.result.list, ...openData.records]
          conf.page.total = openData.total
          if (conf.page.pageSize * conf.page.pageNum >= conf.page.total) return (conf.page.isTips = true)
        }
      },
      order: {
        list: [] as any[],
        //获取roder列表
        getList: async () => {
          let defaultWalletInfo = await svalue.getDefaultWallet()
          System.loading()
          const { data } = await apis.lotteryUserOrder({
            current: conf.page.pageNum,
            size: conf.page.pageSize,
            lotteryId: lottery.current.lotteryId,
            final: (status, data: any) => {
              System.loading(false)
            }
          })
          let coinlistArr = await svalue.getCoinlist() //货币数据
          data.records?.forEach((item: any) => {
            //下注number
            item.betCodeArr = item.betCodes ? item.betCodes.split(',') : []
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
          conf.his.order.list = [...conf.his.order.list, ...data.records]
          conf.page.total = data.total
          if (conf.page.pageSize * conf.page.pageNum >= conf.page.total) return (conf.page.isTips = true)
        }
      }
    }
  })
  onMounted(() => {
    conf.loop.runAni()
    // 初始化下注区域选中
    conf.betting.tabs.init()
  })

  console.log(lottery)

  Scope.setConf({
    conf,
    lottery
  })
  return { conf, lottery, cRefs }
}

export type WelfareConfInter = ReturnType<typeof index>
