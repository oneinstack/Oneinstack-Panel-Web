<template>
  <GameLayout title="MarkSix" code="MARK_SIX" :lottery="lottery">
    <!--开奖结果  -->
    <div class="top-result row relative">
      <div class="result column col justify-center">
        <div>{{ $t('game.result') }}:</div>
        <div>{{ lottery.issue }}</div>
      </div>
      <div class="result-box relative row flex-center" style="gap: 11rem">
        <resultBall
          v-for="(_, index) in 7"
          :key="index"
          :index="index"
          :number="lottery.results[index]"
          :aniX="30 - index * 10"
          :ref="conf.setBallRef"
        />
      </div>
    </div>
  </GameLayout>
</template>
<script setup lang="ts">
import GameLayout from '../components/gameLayout.vue'
import resultBall from './components/resultBall.vue'
import { index } from './MarkSix'
const { conf, lottery } = index()
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
