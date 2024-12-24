<template>
  <div style="width: 100%; height: 100%; position: relative; overflow: hidden">
    <div
      class="trans-box"
      :style="{ 'transform': `translateY(-${sutil.px2rem(props.topNum * (conf.totalLength - 4))}rem)` }"
    >
      <template v-for="(key, index) in conf.dataKeys" :key="index">
        <div
          style="position: absolute; left: 0; right: 0"
          :style="{
            transition: conf.data[key].style.transition,
            top: sutil.px2rem(conf.data[key].style.top) + 'rem'
          }"
        >
          <slot :num="conf.data[key].data?.id" :topNum="conf.data[key].style.top"></slot>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import sutil from '@/sstore/sutil'
import { index } from './winLoop'

const props = defineProps({
  winList: { default: [] as any[] },
  topNum: { default: 65 }
})

const conf = index(props)

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
