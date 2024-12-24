import { onMounted, onUnmounted, reactive } from 'vue'

export const index = (props: any) => {
  const conf = reactive({
    dataSource: [] as any[],
    data: {} as any,
    dataKeys: [] as any[],
    startIndex: 5,
    totalLength: 5,
    loopTimer: null as any,
    clearTimer() {
      if (conf.loopTimer) {
        clearInterval(conf.loopTimer)
        conf.loopTimer = null
      }
    },
    init() {
      for (let i = 0; i < props.winList.length; i++) {
        conf.dataSource.push({
          id: i,
          name: `name${i}`
        })
      }

      if (conf.totalLength > conf.dataSource.length) {
        conf.totalLength = conf.dataSource.length
      }
      for (let i = 0; i < conf.totalLength + 1; i++) {
        conf.dataKeys.push(conf.totalLength - i)
        conf.data[i] = {
          data: conf.dataSource[i],
          index: conf.totalLength - i,
          style: {
            transition: '.3s',
            top: props.topNum * (conf.totalLength - i)
          }
        }
      }
    },
    startAni() {
      conf.startIndex++
      if (conf.startIndex > conf.dataSource.length - 1) {
        conf.startIndex = 0
      }

      conf.dataKeys.forEach((item) => {
        let nextIndex = conf.data[item].index + 1
        if (nextIndex > conf.totalLength) {
          nextIndex = 0
        }
        conf.data[item].index = nextIndex
        if (nextIndex === 0) {
          conf.data[item].style.transition = 'none'
          setTimeout(() => {
            conf.data[item].data = conf.dataSource[conf.startIndex]
            conf.data[item].style.transition = '.3s'
          }, 200)
        }
        conf.data[item].style.top = props.topNum * nextIndex
      })
    }
  })

  onMounted(() => {
    conf.clearTimer()
    conf.init()
  })
  onUnmounted(() => {
    conf.clearTimer()
  })

  return conf
}
