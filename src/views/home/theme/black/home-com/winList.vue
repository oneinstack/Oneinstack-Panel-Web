<template>
  <div class="win">
    <gameTitle name="Latest round & Race" />
    <div class="type-list">
      <template v-for="(item, index) in conf.typeList" :key="index">
        <div class="type-item">
          <div class="type-name" :class="{ 'type-active': conf.typeActive == item.id }">{{ item.name }}</div>
        </div>
      </template>
    </div>
    <div class="bet-list">
      <div class="bet-item">
        <div class="item">Game</div>
        <div class="item">Player</div>
        <div class="item">Profit</div>
      </div>
      <template v-for="(item, index) in conf.betList" :key="index">
        <div class="bet-item">
          <div class="item">
            <img class="game-img" src="/static/img/home/black/mine.png" />
            <text style="text-align: center;">
              <van-text-ellipsis rows="1" :content="item.customMessage" />
            </text>
          </div>
          <div class="item">
            <text style="width: 80%;text-align: center;">
              <van-text-ellipsis rows="1" :content="item.userName" />
            </text>
          </div>
          <div class="item">
            -{{ item.coinSymbol + item.betPrizeMoney }}
            <img class="profit-img" src="/static/img/home/black/profit.png" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">

import { onMounted, onUnmounted, reactive, ref } from 'vue'
import gameTitle from './gameTitle.vue'
import { Scope } from 'tools-vue3'

const mconf = Scope.getConf()
const conf = reactive({
  typeActive: '1',
  typeList: [
    {
      name: 'Latest Bet',
      id: '1',
    },
    {
      name: 'High Roller',
      id: '2',
    },
    {
      name: 'Wager Contest',
      id: '3',
    }
  ],
  betList: [] as any[],
  init() {
    let datas = mconf.virtualData || {}
    conf.betList = datas['10'] || []
  }
})
onMounted(() => {
  conf.init()
})
</script>
<style lang="less" scoped>
.win {
  padding: 24rem 0rem 24rem 24rem;
}

.type-list {
  display: flex;
  background: #323838;
  height: 68rem;
  border-radius: 14rem;
  margin: 20rem 24rem 20rem 0rem;

  .type-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #BFBFBF;
    font-size: 24rem;

  }

  .type-active {
    background: #394143;
    width: 100%;
    height: 100%;
    border-radius: 14rem;
    color: #FFF;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.bet-list {
  background: #323738;
  margin-right: 24rem;
  border-radius: 16rem;

  .bet-item {
    display: flex;
    height: 80rem;
    color: #BFBFBF;

    .item {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      .game-img{
        width: 28rem;
        height: 28rem;
        margin-right: 10rem;
      }
      .profit-img{
        height: 24rem;
        margin-left: 10rem;
      }
    }

    &:nth-child(2n) {
      background: #3A4142;
      color: #FFF;
      .item:nth-last-of-type(1) {
        color: #BFBFBF;
      }
    }
  }
}
</style>
