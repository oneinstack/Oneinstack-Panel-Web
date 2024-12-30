import { reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    show: false,
    timeArr: [0, 0],
    isSign: false,
    showPop(e: any) {
      conf.show = e.show
      conf.timeArr = e.array
      conf.isSign = e.isSign
    },
    closePop() {
      conf.show = false
    }
  })

  return conf
}
