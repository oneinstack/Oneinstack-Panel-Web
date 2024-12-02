<template>
  <div style="width: 100%; height: 100%; position: relative; overflow: hidden">
    <div class="trans-box" :style="{ 'transform': `translateY(-${topNum * (conf.totalLength - 4)}px)` }">
      <template v-for="(key, index) in conf.dataKeys" :key="index">
        <div
          style="position: absolute; left: 0; right: 0"
          :style="{
            transition: conf.data[key].style.transition,
            top: conf.data[key].style.top + 'px'
          }"
        >
          <slot :num="conf.data[key].data.id" :topNum="conf.data[key].style.top"></slot>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue'

const props = defineProps({
  winList: { default: [] as any[] },
  topNum: { default: 65 }
})

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

defineExpose({
  start() {
    if (props.winList.length > 5) {
      conf.loopTimer = setInterval(() => {
        conf.startAni()
      }, 3000)
    }
  },
  stop() {
    conf.clearTimer()
  }
})
</script>

<style lang="less" scoped>
.trans-box {
  position: relative;
  height: 100%;
}
</style>
