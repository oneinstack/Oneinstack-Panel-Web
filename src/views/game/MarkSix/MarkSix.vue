<template>
  <GameLayout title="MarkSix" code="MARK_SIX" :lottery="lottery">
    <!--开奖结果  -->
    <div class="top-result row relative">
      <div class="result column col justify-center">
        <div>{{ $t('game.result') }}:</div>
        <div>{{ lottery.lastissue }}</div>
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
    <div class="top-bg-1"></div>
    <div class="top-bg-box">
      <div style="margin: 42rem 0; gap: 20rem" class="row flex-center">
        <div
          class="type-item flex flex-center relative"
          v-for="item in lottery.play.list"
          :key="item.id"
          :class="{ active: item.id === lottery.play.item.id }"
          @click="lottery.play.change(`/game/MarkSix/MarkSix`, item)"
        >
          {{ item.label }}
        </div>
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

.top-bg-1 {
  width: 100%;
  height: 30rem;
  background: url('/static/img/game/marksix/top-bg-1.webp') no-repeat center center;
  background-size: 100% 100%;
}

.top-bg-box {
  width: 100%;
  background: linear-gradient(180deg, #ffc698 0%, #fff7e5 100%);

  .type-item {
    width: 164rem;
    height: 104rem;
    background-color: #fffef8;
    color: #333333;
    font-size: 28rem;
    font-family: 700;
    border-radius: 8rem;
    box-shadow: inset 2rem 2rem 8rem 0rem rgba(0, 0, 0, 0.1);
    overflow: hidden;
    &.active {
      background-color: #fffbe2;
    }
    &.active::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 8rem;
      background: linear-gradient(180deg, #eb602d 0%, #ffa64f 100%);
    }
  }
}
</style>
