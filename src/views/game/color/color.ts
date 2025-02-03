import { apis } from '@/api'
import { onMounted, reactive, ref } from 'vue'
import i18n from '@/lang'
import slottery from '@/sstore/slottery'
import { getOdds } from './colorDataOdds'
import { Scope } from 'tools-vue3'
import sbet from '@/sstore/sbet'
import sstatus from '@/sstore/sstatus'
import sconfig from '@/sstore/sconfig'

export const index = () => {
  const scrollRef = ref<any>()
  const tabsRefs = ref<any>()
  const resultRefs = ref<any>()
  const orderRefs = ref<any>()
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
      if (time[3] == 3) {
        conf.loop.timePopupShop = true
      }
      conf.betting.popup.autoClose(time[3])
    },
    resultSize: 5,
    showBox: () => {}
  })
  const conf = reactive({
    gameType: 'COLOR',
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
      bannerList: [
        {
          num: 0,
          src: '/static/img/color2.webp'
        },
        {
          num: 1,
          src: '/static/img/color-green.webp'
        },
        {
          num: 2,
          src: '/static/img/color-red.webp'
        },
        {
          num: 3,
          src: '/static/img/color-green.webp'
        },
        {
          num: 4,
          src: '/static/img/color-red.webp'
        },
        {
          num: 5,
          src: '/static/img/color1.webp'
        },
        {
          num: 6,
          src: '/static/img/color-red.webp'
        },
        {
          num: 7,
          src: '/static/img/color-green.webp'
        },
        {
          num: 8,
          src: '/static/img/color-red.webp'
        },
        {
          num: 9,
          src: '/static/img/color-green.webp'
        },
        {
          num: 10,
          src: '/static/img/small.webp'
        },
        {
          num: 11,
          src: '/static/img/big.webp'
        }
      ],
      // 开奖结果信息
      openCode: [0],
      autoplay: false,
      resuleIndex: null as any,
      /**
       * 开始开奖动画
       */
      runAni: () => {
        conf.loop.autoplay = true
      },
      action: (res: any) => {
        if (sstatus.lastIndex) sstatus.getscrollLeft(tabsRefs, 600, sstatus.lastIndex, 180, false)
        conf.loop.autoplay = false
        let num = parseInt(res[0])
        conf.loop.openCode[0] = num
        setTimeout(() => {
          let list = sbet.getColorBet(lottery.current.lotteryId, lottery.current.openExpect)
          conf.betting.selectBetList = list
        }, 1000)

        sstatus.getscrollLeft(tabsRefs, 600, lottery.play.item.lotterySort - 1, 180)
      },
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
          label: i18n.t('game.rule'),
          value: 'rule'
        },
        {
          label: i18n.t('game.resultHistory'),
          value: 'result'
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
      betTypeArr: [] as any,
      betNumArr: [] as any[], //选中的数据
      typeTitle: '',
      showCods: '',
      oddsInfo: {} as any,
      selectBetList: [] as any[],
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
          if (e.money) {
            let betObj = {
              openExpect: lottery.current.openExpect,
              startTime: lottery.current.startTime,
              openTime: lottery.current.openTime,
              betNum: conf.betting.showCods,
              money: e.money,
              lotteryId: lottery.current.lotteryId
            }
            sbet.setColorBet(betObj)

            let list = sbet.getColorBet(lottery.current.lotteryId, lottery.current.openExpect)
            conf.betting.selectBetList = list

            if (conf.betting.selectBetList.length == 1) {
              setTimeout(() => {
                scrollRef.value.scrollTo({
                  top: scrollRef.value.scrollHeight,
                  behavior: 'smooth'
                })
              }, 300)
            }
          }
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
        conf.betting.oddsArr = data
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
        if (conf.operation.active == 'result') resultRefs.value?.initResult(lottery.play.item.id)
        else if (conf.operation.active == 'myOrder' && sconfig.userInfo) orderRefs.value?.initOrder(lottery.play.item.id)
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

  return { conf, lottery, scrollRef, tabsRefs, resultRefs, orderRefs }
}

export type cConfInter = ReturnType<typeof index>
