<template>
  <div class="win">
    <gameTitle name="Latest round & Race" />
    <div class="type-list">
      <custNav :dataArr="conf.typeList" />
    </div>
    <div class="bet-list">
      <div class="bet-item">
        <div class="item">Game</div>
        <div class="item">Player</div>
        <div class="item" style="justify-content: flex-end;">Profit</div>
      </div>
      <template v-for="(item, index) in conf.betList" :key="index">
        <div class="bet-item">
          <div class="item">
            <img class="game-img" src="/static/img/home/black/mine.png" />
            <span class="ellipsis">{{item.customMessage}}</span>
          </div>
          <div class="item">
            <span class="ellipsis">{{item.userName}}</span>
          </div>
          <div class="item" style="justify-content: flex-end;">
            -{{ item.coinSymbol + item.betPrizeMoney }}
            <img class="profit-img" src="/static/img/home/black/profit.png" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import custNav from '@/views/user/setting/com/custNav.vue'
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
  margin: 20rem 24rem 20rem 0rem;
}

.bet-list {
  background: #323738;
  margin-right: 24rem;
  border-radius: 16rem;

  .bet-item {
    display: flex;
    height: 80rem;
    color: #BFBFBF;
    padding: 0rem 30rem;

    .item {
      width: 33.3%;
      display: flex;
      align-items: center;
      // justify-content: center;
      // justify-content: space-between;
      .game-img{
        width: 28rem;
        height: 28rem;
        margin-right: 10rem;
      }
      .profit-img{
        height: 24rem;
        margin-left: 10rem;
      }
      .ellipsis {
        white-space: nowrap;
        /* 防止文本换行 */
        overflow: hidden;
        /* 隐藏溢出的内容 */
        text-overflow: ellipsis;
        width: 150rem;
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
