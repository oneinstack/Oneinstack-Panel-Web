<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { RollingTextInstance } from 'vant'

const prizePool = Math.floor(Math.random() * 1000000000).toString()
const rollingTextInstance = ref<RollingTextInstance[]>([])

onMounted(() => {
  rollingTextInstance.value.forEach(({ start, duration }, index) => {
    setTimeout(() => start(), duration * 250 * index)
  })
})
</script>

<template>
  <div class="prize-pool-container">
    <div class="prize-pool-content">
      <template v-for="(_, index) in 3">
        <van-rolling-text
          :ref="(el) => rollingTextInstance.push(el as RollingTextInstance)"
          class="rolling-text"
          :auto-start="false"
          :start-num="123"
          :target-num="Number(prizePool.slice(index * 3, index * 3 + 3))"
        />
        <div v-if="index === 0" class="split-comma" />
        <div v-if="index === 1" class="split-point" />
      </template>
    </div>
  </div>
</template>

<style scoped lang="less">
.prize-pool-container {
  width: 100%;
  height: 162rem;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 51%;
    transform: translate(-50%, -50%);
    width: 106%;
    height: 130%;
    background: url('/static/theme/blue/home-prize.webp') no-repeat center center;
    background-size: 100% 100%;
  }

  .prize-pool-content {
    position: absolute;
    z-index: 2;
    left: 104rem;
    top: 84rem;
    display: flex;
    align-items: flex-end;
    gap: 6rem;
  }

  .split-comma {
    width: 6rem;
    height: 12rem;
    clip-path: polygon(0 0, 0 100%, 100% 70%, 100% 0, 0 0);
    background: linear-gradient(180deg, #2771ec 0%, #0646da 220%);
  }

  .split-point {
    width: 6rem;
    height: 6rem;
    background: linear-gradient(180deg, #2771ec 0%, #0646da 220%);
  }

  .rolling-text {
    --van-rolling-text-background: linear-gradient(93.51deg, #2670ec 5.72%, #0545d9 86.61%);
    --van-rolling-text-color: white;
    --van-rolling-text-font-size: 24rem;
    --van-rolling-text-gap: 6rem;
    --van-rolling-text-item-border-radius: 6rem;
    --van-rolling-text-item-width: 30rem;
    :deep(.van-rolling-text-item--down) {
      height: 44rem !important;
      box-shadow:
        0 0.5px 0 0 #add6ff,
        0 1px 0 0 #0545d9;
      transform-style: preserve-3d;
      transform: rotateX(15deg);

      .van-rolling-text-item__item {
        line-height: 44rem !important;
      }
    }
  }
}
</style>
