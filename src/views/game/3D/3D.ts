import { apis } from '@/api'
import { onMounted, reactive, ref } from 'vue'
import System from '@/utils/System'
import i18n from '@/lang'
import slottery from '@/sstore/slottery'
import { getOdds } from './3DDataOdds'
import { Scope } from 'tools-vue3'

export const index = () => {
  const resultRefs = ref<any>()
  const analyzeRefs = ref<any>()
  const orderRefs = ref<any>()
  const timer = Scope.Timer()
  const lottery = slottery.lotteryBox({
    timer: timer,
    success: (onetime: any, status: any, results: any) => {
      //设置开奖信息
      // results.forEach((item: any, index: number) => {})
      //处理游戏和刷新结果
      conf.loop.action(results.map((v: any) => v.num))
    },
    updateCountDown: (time: any) => {
      if (time[3] <= 0) {
        conf.loop.runAni()
      }
      if (time[3] == 3) {
        conf.loop.timePopupShop = true
      }
      conf.betting.popup.autoClose(time[3])
    },
    resultSize: 3,
    showBox: () => {}
  })
  const conf = reactive({
    gameType: '3D',
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
      timePopupShop: false,
      shareList: [1, 2, 3, 4, 5, 6],
      poinits: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      drawList: [
        {
          content: '-'
        },
        {
          src1: 'static/img/small.webp',
          src2: 'static/img/odd.webp'
        },
        {
          src1: 'static/img/big.webp',
          src2: 'static/img/even.webp'
        }
      ],
      autoplay: false,
      openCode: [0, 0, 0, 0, 0, 10],
      /**
       * 开始开奖动画
       */
      runAni: () => {
        conf.loop.autoplay = true
      },
      action: (res: any) => {
        conf.loop.autoplay = false

        let num1 = parseInt(res[0])
        let num2 = parseInt(res[1])
        let num3 = parseInt(res[2])
        conf.loop.openCode[0] = num1 - 1
        conf.loop.openCode[1] = num2 - 1
        conf.loop.openCode[2] = num3 - 1

        let totalNum = num1 + num2 + num3
        conf.loop.openCode[3] = totalNum - 3
        if (num1 == num2 && num1 == num3 && num2 == num3) {
          conf.loop.openCode[4] = 0
          conf.loop.openCode[5] = 0
        } else {
          if (totalNum < 11) {
            conf.loop.openCode[4] = 1
          } else {
            conf.loop.openCode[4] = 2
          }
          if (totalNum % 2 == 0) {
            conf.loop.openCode[5] = 2
          } else {
            conf.loop.openCode[5] = 1
          }
        }
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
          label: i18n.t('game.analyze'),
          value: 'analyze'
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
      }
    },
    /**
     * 下注信息
     */
    betting: {
      tabs: {
        list: getOdds(),
        oddsInfo: {} as any,
        init: () => {
          const { tabs } = conf.betting
          setTimeout(() => {
            conf.betting.getOdds()
          }, 600)
        }
      },
      betShow: false,
      disabledShow: false,
      type: 0,
      item: {} as any,
      typeTitle: '',
      showCods: '',
      isWinBet: false,
      money: 0,
      popup: {
        open: (e: any) => {
          conf.betting.type = e.type
          conf.betting.item = e.info
          lottery.bet.content = [e.info.oddsCode]
          conf.betting.showCods  = e.info.imgUrl == 0 ? '?' : e.info.imgUrl
          if(e.type == 1) conf.betting.typeTitle = i18n.t('game.sumType')
          else if(e.type == 2) conf.betting.typeTitle = i18n.t('game.sumPoints')
          else if(e.type == 3) conf.betting.typeTitle = i18n.t('game.single')
          else if(e.type == 4) conf.betting.typeTitle = i18n.t('game.pair')
          else if(e.type == 5) conf.betting.typeTitle = i18n.t('game.triple')
          conf.layout.ref.open()
        },
        close: (e: any) => {
          conf.layout.ref.close()
          if(e && e.money) {
            conf.betting.isWinBet = true
            conf.betting.money = e.money
            setTimeout(() => {
              conf.betting.isWinBet = false
          }, 3000)
          }
          const { tabs } = conf.betting
          tabs.list[0].sizeList.forEach((item) => {
            item.isActive = false
          })
          tabs.list[0].poinits.forEach((item) => {
            item.isActive = false
          })
          tabs.list[0].singleList.forEach((item) => {
            item.isActive = false
          })
          tabs.list[0].pairList.forEach((item) => {
            item.isActive = false
          })
          tabs.list[0].tripleList.forEach((item) => {
            item.isActive = false
          })
        },
        autoClose: (time: any) => {
          if (time <= lottery.play.item.openLockCountdown) {
            conf.betting.popup.close({})
            conf.betting.disabledShow = true
          } else {
            conf.betting.disabledShow = false
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
        conf.betting.oddsArr = data
        const fun = (item: any) => {
          conf.betting.tabs.oddsInfo[item.oddsCode] = Number(item.odds)
        }
        data.forEach(fun)
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
  console.log(lottery);
  
  return { conf, lottery, resultRefs, analyzeRefs, orderRefs }
}

export type dConfInter = ReturnType<typeof index>
