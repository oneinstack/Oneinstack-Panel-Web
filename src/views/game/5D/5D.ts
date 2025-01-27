import { apis } from '@/api'
import { onMounted, reactive, ref } from 'vue'
import System from '@/utils/System'
import i18n from '@/lang'
import slottery from '@/sstore/slottery'
import { getOdds } from './5DDataOdds'
import { Scope } from 'tools-vue3'
import { set } from '@vueuse/core'
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
    gameType: '5D',
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
      openCode: {
        numArr: [
          {
            key: 'A',
            value: '1'
          },
          {
            key: 'B',
            value: '2'
          },
          {
            key: 'C',
            value: '3'
          },
          {
            key: 'D',
            value: '4'
          },
          {
            key: 'E',
            value: '5'
          }
        ],
        sum: 0
      } as any,
      autoplay: false,
      /**
       * 开始开奖动画
       */
      runAni: () => {
        conf.loop.autoplay = true
        conf.loop.openCode.numArr.forEach((item: any) => {
          item.value = Math.floor(Math.random() * 10)
        })
        conf.loop.openCode.sum = Math.floor(Math.random() * 46)
        setTimeout(() => {
          if (conf.loop.autoplay) {
            conf.loop.runAni()
          }
        }, 100)
      },
      action: (res: any) => {
        conf.loop.autoplay = false
        res.forEach((item: any, itemIndex: number) => {
          item = parseInt(item)
          conf.loop.openCode.numArr[itemIndex].value = item
        })
        conf.loop.openCode.sum = eval(res.join('+'))
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
        open: (item: any,type: number) => {
          item.isActive = !item.isActive
          lottery.bet.content = [item.oddsCode]
          conf.betting.showCods  = item.name
          if(type == 1) conf.betting.betTypeArr = [item]
          if(type == 2) conf.betting.betNumArr = [item]
          conf.betting.typeTitle = conf.betting.tabs.item.name
          
          conf.layout.ref.open()
        },
        close: (e: any) => {
          let index = conf.betting.tabs.tree.findIndex((it:any) => it.name == conf.betting.tabs.item.name)
          conf.betting.tabs.tree[index].sizeList.forEach(item => {
            item.isActive = false
          })
          if(conf.betting.tabs.tree[index].numList) {
            conf.betting.tabs.tree[index].numList.forEach(item => {
              item.isActive = false
            })
          }
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
        if(conf.operation.active == 'result' || conf.operation.active == 'chart') conf.his.result.getList()
        else if(conf.operation.active == 'myOrder') conf.his.order.getList()
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
            item.openCodeArr = item.openCode ? item.openCode.split(',') : []
            item.sum = eval(item.openCodeArr.join('+'))
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
            item.openNumberArr = item.betOpenCode ? item.betOpenCode.split(',') : []
            item.sum = eval(item.openNumberArr.join('+')) || ''

            //下注number
            let arr = item.betCodes.split('_') || []
            item.betNumber = arr

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
