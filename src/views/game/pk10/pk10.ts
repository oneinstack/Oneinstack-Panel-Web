import { apis } from '@/api'
import { onMounted, reactive, ref } from 'vue'
import i18n from '@/lang'
import slottery from '@/sstore/slottery'
import { getOdds } from './pk10DataOdds'
import { Scope } from 'tools-vue3'
import { svalue } from '@/sstore/svalue'
import sutil from '@/sstore/sutil'

export const index = () => {
  const cgamebox = ref<any>()
  const cgameRef = ref<any>()
  const gameBoxRefs = ref<any>()
  const timer = Scope.Timer()
  const lottery = slottery.lotteryBox({
    timer: timer,
    success: (onetime: any, status: any, results: any) => {
      if (onetime && status) {
        conf.game.action(
          'stop',
          results.map((v: any) => v.num)
        )
        conf.page.reset()
      }
      conf.page.change(1)
    },
    updateCountDown: (time: any) => {
      //处理pk10小游戏
      conf.game.action('time', time)
      conf.betting.popup.autoClose(time[3])
    },
    resultSize: 3,
    showBox: () => {}
  })
  const conf = reactive({
    gameType: 'PK10',
    loading: false,
    layout: {
      ref: null as any,
      setRef: (el: any) => {
        if (el) conf.layout.ref = el
        else conf.layout.ref = null as any
      }
    },
    game: {
      box: {
        width: 0,
        height: 0,
        init: () => {
          conf.game.box.width = cgamebox.value.offsetWidth
          conf.game.box.height = conf.game.box.width / 1.769
        }
      },
      isRun: false,
      action: (type: any, res: any) => {
        if (type == 'time' && res[3] === 3) conf.game.start()
        else if (type == 'stop') conf.game.stop(res)
      },
      reset: () => {
        conf.game.isRun = false
        cgameRef.value?.reset()
      },
      start: () => {
        if (conf.game.isRun) return
        conf.game.isRun = true
        cgameRef.value?.start()
      },
      stop: (res: any) => {
        if (conf.game.isRun) {
          conf.game.isRun = false
          cgameRef.value?.stop(res)
        } else {
          cgameRef.value?.setList(res)
        }
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
          label: i18n.t('game.myOrder'),
          value: 'myOrder'
        },
        {
          label: i18n.t('game.rule'),
          value: 'rule'
        }
      ],
      change: (item: any) => {
        conf.loading = true
        conf.operation.active = item.value
        conf.page.reset()
        conf.page.change(1)
        conf.loading = false
      }
    },
    /**
     * 下注信息
     */
    betting: {
      betTypeArr: [] as any,
      betNumArr: [] as any[], //选中的数据
      typeTitle: '',  // 下注类型
      showCods: '',
      oddsInfo: {} as any,
      tabs: {
        tree: getOdds(),
        list: [] as any[],
        item: {} as any,
        change(item: any) {
          const { tabs } = conf.betting
          tabs.item = item
        },
        init: () => {
          const { tabs } = conf.betting
          tabs.list = tabs.tree
          tabs.change(tabs.tree[0])
          setTimeout(() => {
            conf.betting.getOdds()
          }, 600)
        }
      },
      popup: {
        open: (item: any, type: number) => {
          item.isActive = !item.isActive
          lottery.bet.content = [item.oddsCode]
          conf.betting.typeTitle = conf.betting.tabs.item.name
          if (type == 1) conf.betting.betTypeArr = [item]
          if (type == 2) conf.betting.betNumArr = [item]

          conf.layout.ref.open()
        },
        close: (e: any) => {
          conf.betting.tabs.item.sizeList.forEach((item:any) => {
            item.isActive = false
          })
          conf.betting.tabs.item.numList.forEach((item:any) => {
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
        list: [] as any[],
        chartList: [] as any[],
        getList: async () => {
          const { data: openData } = await apis.lotteryOpenResult({
            current: conf.page.pageNum,
            size: conf.page.pageSize,
            lotteryId: lottery.current.lotteryId
          })
          openData.records.forEach((item: any) => {
            item.openNumberStr = item.openCode.slice(item.openCode.length - 5, item.openCode.length)
            let index = item.openNumberStr[0]
            item.openNumber = parseFloat(item.openNumberStr.slice(index, index + 1))
          })
          conf.his.result.list = openData.records || []
          conf.page.total = openData.total
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
            item.typeName = 'PK10'
            item.openNumber = item.betOpenCode
            let color = conf.betting.tabs.item.sizeList.find((into: any) => into.name == item.openNumber)?.color || ''
            item.color = color
            //下注number
            item.betNumber = item.betCodes.split('_')[1]
            //下注number对应颜色
            let betColor = conf.betting.tabs.item.numList.find((into: any) => into.label == item.betNumber)?.color || ''
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
    conf.loading = true
    conf.game.box.init()
    // 初始化下注区域
    conf.betting.tabs.init()
    conf.loading = false
  })

  Scope.setConf({
    conf,
    lottery
  })

  return { conf, lottery, cgamebox, cgameRef, gameBoxRefs }
}

export type dConfInter = ReturnType<typeof index>
