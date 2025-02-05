import i18n from '@/lang'
import slottery from '@/sstore/slottery'
import { Scope } from 'tools-vue3'
import { onMounted, reactive, ref } from 'vue'
import { getOdds } from './Lottery3DDataOdds'
import { apis } from '@/api'
import System from '@/utils/System'

export const index = () => {
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
    },
    updateCountDown: (time: any) => {
      if (time[3] <= 0) {
        conf.loop.runAni()
      }
      conf.betting.popup.autoClose(time[3])
    },
    resultSize: 3,
    showBox: () => {}
  })
  const conf = reactive({
    gameType: '3D_LOTTERY',
    layout: {
      ref: null as any,
      setRef: (el: any) => {
        if (el) conf.layout.ref = el
        else conf.layout.ref = null as any
      }
    },
    loop: {
      numList: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      sumList: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
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
      openCode: [0, 0, 0, 0, 1, 1],
      /**
       * 开始开奖动画
       */
      runAni: () => {
        conf.loop.autoplay = true
      },
      action: (res: any) => {
        conf.loop.autoplay = false
        conf.loop.openCode = res

        let num1 = parseInt(res[0])
        let num2 = parseInt(res[1])
        let num3 = parseInt(res[2])
        let totalNum = num1 + num2 + num3
        conf.loop.openCode[3] = totalNum
        if (totalNum < 13) {
          conf.loop.openCode[4] = 1
        } else {
          conf.loop.openCode[4] = 2
        }
        if (totalNum % 2 == 0) {
          conf.loop.openCode[5] = 2
        } else {
          conf.loop.openCode[5] = 1
        }
        if (conf.operation.active === 'result') resultRefs.value?.initResult()
        if (conf.operation.active === 'myOrder') orderRefs.value?.initOrder()
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
      }
    },
    /**
     * 下注信息
     */
    betting: {
      tabs: {
        tree: getOdds(),
        oddsInfo: {} as any,
        level1: {
          list: [] as any[],
          item: {} as any,
          change(item: any) {
            const { tabs } = conf.betting
            conf.betting.betSizeList = []
            conf.betting.betNumList = []
            conf.betting.strList = []
            if (tabs.level1.item.sizeList) tabs.level1.item.sizeList.forEach((item: any) => (item.isActive = false))
            if (tabs.level1.item.numList) tabs.level1.item.numList.forEach((item: any) => (item.isActive = false))
            if (tabs.level1.item.strList) tabs.level1.item.item.strList.forEach((item: any) => (item.isActive = false))
            tabs.level1.item = item
          }
        },
        init: () => {
          const { tabs } = conf.betting
          tabs.level1.list = tabs.tree
          tabs.level1.change(tabs.tree[0])
          setTimeout(() => {
            conf.betting.getOdds()
          }, 600)
        }
      },
      betShow: false,
      disabledShow: false,
      betList: [] as any[],
      betTypeTitle: '',
      betSizeList: [] as any[],
      betNumList: [] as any[],
      strList: [] as any[],
      popup: {
        open: (e: any) => {
          console.log('888888')

          console.log(e)
          conf.betting.betList = e.list
          conf.betting.betTypeTitle = e.type
          conf.layout.ref.open()
          // conf.betting.betShow = true
        },
        close: (type = 1) => {
          if (type == 2) return conf.layout.ref.close()
          const { tabs } = conf.betting
          conf.betting.betSizeList = []
          conf.betting.betNumList = []
          conf.betting.strList = []
          if (tabs.level1.item.sizeList) tabs.level1.item.sizeList.forEach((item: any) => (item.isActive = false))
          if (tabs.level1.item.numList) tabs.level1.item.numList.forEach((item: any) => (item.isActive = false))
          if (tabs.level1.item.strList) tabs.level1.item.strList.forEach((item: any) => (item.isActive = false))
          conf.layout.ref.close()
        },
        autoClose: (time: any) => {
          if (time <= lottery.play.item.openLockCountdown) {
            conf.betting.popup.close(2)
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
        const fun = (item: any) => {
          conf.betting.tabs.oddsInfo[item.oddsCode] = Number(item.odds)
        }
        data.forEach(fun)
      },
      // 请求下注接口
      requestBet(e: any) {
        let obj = lottery.bet.getInfo()
        console.log(e)
        obj.betCodes = e.join(',')
        console.log(obj.betCodes)
        System.loading()
        // e.forEach((item: any, index: number) => {
        //   obj.betCodes = item.oddsCode
        apis.lotteryUserBets({
          ...obj,
          success: (res: any) => {
            System.toast(i18n.t('game.betSuccess'), 'success')
            lottery.wallet.getWalletMoney()
            conf.betting.popup.close()
          },
          final: () => {
            System.loading(false)
          }
        })
        // })
      }
    }
  })
  onMounted(() => {
    conf.loop.runAni()
    // 初始化下注区域选中
    conf.betting.tabs.init()
  })

  Scope.setConf({
    conf,
    lottery
  })
  return { conf, lottery, resultRefs, orderRefs }
}

export type WelfareConfInter = ReturnType<typeof index>
