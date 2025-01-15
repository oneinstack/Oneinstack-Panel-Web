import slottery from '@/sstore/slottery'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

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
    }
  })
  onMounted(() => {
    conf.runAni()
  })
  return { conf, lottery }
}
