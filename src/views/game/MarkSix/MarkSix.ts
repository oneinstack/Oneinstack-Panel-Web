import i18n from '@/lang'
import slottery from '@/sstore/slottery'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'
import { getOdds } from './MarkSixDataOdds'

export const index = () => {
  const timer = Scope.Timer()
  const lottery = slottery.lotteryBox({
    timer: timer,
    success: (onetime: any, status: any, results: any) => {
      //设置开奖信息
      results.forEach((item: any, index: number) => {
        conf.ballListRef[index].conf.setVal(item)
      })
    },
    updateCountDown: (time: any) => {
      if (time[3] <= 0) {
        conf.runAni()
      }
    },
    resultSize: 7,
    showBox: () => {}
  })
  const conf = reactive({
    layout: {
      ref: null as any,
      setRef: (el: any) => {
        if (el) conf.layout.ref = el
        else conf.layout.ref = null as any
      }
    },
    ballListRef: {} as { [key: number]: { conf: any } },
    setBallRef: (el: any) => {
      if (el) conf.ballListRef[el.conf.index] = el
      else conf.ballListRef = null as any
    },
    /**
     * 开始开奖动画
     */
    runAni: () => {
      Object.keys(conf.ballListRef).forEach((key: any) => {
        conf.ballListRef[key].conf.runAni()
      })
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
          label: i18n.t('game.analyze'),
          value: 'analyze'
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
     *
     */
    betting: {
      tabs: {
        tree: getOdds(),
        level1: {
          list: [] as any[],
          item: {} as any,
          change(item: any) {
            const { tabs } = conf.betting
            tabs.level1.item = item
            tabs.level2.list = item.list
            tabs.level2.change(item.list[0])
          }
        },
        level2: {
          list: [] as any[],
          item: {} as any,
          change(item: any) {
            const { tabs } = conf.betting
            tabs.level2.item = item
          }
        },
        init: () => {
          const { tabs } = conf.betting
          tabs.level1.list = tabs.tree
          tabs.level1.change(tabs.tree[0])
        }
      },
      popup: {
        open: () => {
          conf.layout.ref.open()
        },
        close: () => {
          conf.layout.ref.close()
        }
      }
    }
  })
  onMounted(() => {
    conf.runAni()

    // 初始化下注区域选中
    conf.betting.tabs.init()
  })

  Scope.setConf({
    conf,
    lottery
  })

  return { conf, lottery }
}

export type MarkSixConfInter = ReturnType<typeof index>
