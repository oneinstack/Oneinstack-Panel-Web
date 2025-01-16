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
      <!-- 切换玩法 -->
      <div style="margin-top: 42rem; gap: 20rem" class="row flex-center">
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
      <!-- 倒计时 -->
      <div class="count-down-box">
        <div>{{ $t('game.drawingTime') + ':' + lottery.issue }}</div>
        <div class="row" style="margin-top: 20rem">
          <div class="count-down row" style="gap: 4rem">
            <div class="count-down-item flex flex-center">{{ lottery.countDown[0] }}</div>
            <div>:</div>
            <div class="count-down-item flex flex-center">{{ lottery.countDown[1] }}</div>
            <div>:</div>
            <div class="count-down-item flex flex-center">{{ lottery.countDown[2] }}</div>
          </div>
          <div class="col flex items-center" style="margin: 0 20rem">
            <div class="count-down-line relative">
              <div
                class="count-down-line-item"
                :style="{ width: `${(lottery.countDown[3] / (lottery.play.item.lotteryInterval / 1000)) * 100}%` }"
              ></div>
            </div>
          </div>
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
  padding: 0 32rem;
  color: #333333;
  font-size: 28rem;
  font-weight: 600;

  .type-item {
    width: 164rem;
    height: 104rem;
    background-color: #fffef8;
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

  .count-down-box {
    font-size: 28rem;
    margin-top: 32rem;

    .count-down {
      font-size: 48rem;
    }

    .count-down-item {
      width: 72rem;
      height: 72rem;
      background: #000000;
      border-radius: 4rem;
      color: #ffffff;
    }

    .count-down-line {
      height: 16rem;
      width: 100%;
      border-radius: 22rem;
      background: #b6b9c4;
      transform: translateX(20rem);
      overflow: hidden;
    }
    .count-down-line-item {
      background: linear-gradient(180deg, #fb0224 0%, #f56900 100%);
      height: 100%;
      transition: width 0.3s;
    }
  }
}
</style>
