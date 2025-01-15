<template>
  <GameLayout title="MarkSix" code="MARK_SIX" :lottery="lottery">
    <!--开奖结果  -->
    <div class="top-result row relative">
      <div class="result column col justify-center">
        <div>{{ $t('game.result') }}:</div>
        <div>{{ lottery.issue }}</div>
      </div>
      <div class="result-box relative row flex-center" style="gap: 11rem">
        <resultBall :number="lottery.results[0]" :aniX="60" />
        <resultBall :number="lottery.results[1]" :aniX="40" />
        <resultBall :number="lottery.results[2]" :aniX="20" />
        <resultBall :number="lottery.results[3]" :aniX="0" />
        <resultBall :number="lottery.results[4]" :aniX="-20" />
        <resultBall :number="lottery.results[5]" :aniX="-40" />
        <resultBall :number="lottery.results[6]" :aniX="-60" />
      </div>
    </div>
  </GameLayout>
</template>
<script setup lang="ts">
import { reactive } from 'vue'
import GameLayout from '../components/gameLayout.vue'
import resultBall from './components/resultBall.vue'
import { index } from './MarkSix'
const { conf, lottery } = index()

const v = reactive({
  v: 1
})
</script>

<style lang="less" scoped>
.top-result {
  width: 750rem;
  height: 156rem;
  margin-top: 20rem;
  background: url('/static/img/game/marksix/top-bg.webp') no-repeat center center;
  background-size: 100% 100%;
  padding: 0rem 36rem;
  font-size: 20rem;
  color: #000000;
  font-weight: 600;
}

.result-box {
  width: 510rem;
  height: 100%;
  overflow: hidden;
  height: calc(100% - 24rem);
  margin-top: 12rem;
}
</style>
