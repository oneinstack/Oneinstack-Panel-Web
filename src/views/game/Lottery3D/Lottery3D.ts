import i18n from '@/lang'
import slottery from '@/sstore/slottery'
import { Scope } from 'tools-vue3'
import { onMounted, reactive, ref } from 'vue'
import { getOdds } from './Lottery3DDataOdds'
import { apis } from '@/api'

export const index = () => {
  const resultRefs = ref<any>()
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
    },
    resultSize: 3,
    showBox: () => {}
  })
  const conf = reactive({
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
        console.log(res)
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
        console.log(conf.operation.active);
        if(conf.operation.active === 'result') resultRefs.value?.initResult()
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
            tabs.level1.item = item
            console.log(item)
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
      popup: {
        open: () => {
          //   conf.layout.ref.open()
        },
        close: () => {
          //   conf.layout.ref.close()
        }
      },
      //获取赔率
      getOdds: async () => {
        console.log(lottery.play.item);
        
        let list = await slottery.findLotteryList('3D_LOTTERY')
        const { data } = await apis.lotteryOdds({
          lotteryTypeId: list[0].lotteryTypeId,
          lotteryTypeCode: '3D_LOTTERY'
        })
        const fun = (item: any) => {
          conf.betting.tabs.oddsInfo[item.oddsCode] = Number(item.odds)
        }
        data.forEach(fun)
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
  console.log('8888')
  console.log(lottery)

  return { conf, lottery, resultRefs }
}

export type WelfareConfInter = ReturnType<typeof index>
