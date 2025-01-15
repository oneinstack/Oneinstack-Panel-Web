import slottery from '@/sstore/slottery'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const timer = Scope.Timer()
  const lottery = slottery.lotteryBox({
    timer: timer,
    success: (onetime: any, status: any, results: any) => {
      //刷新底部信息
      if (onetime && status) {
        console.log('onetime', onetime, status)
      }
    },
    updateCountDown: (time: any) => {},
    resultSize: 7,
    showBox: () => {}
  })
  const conf = reactive({})
  onMounted(() => {})
  return { conf, lottery }
}
