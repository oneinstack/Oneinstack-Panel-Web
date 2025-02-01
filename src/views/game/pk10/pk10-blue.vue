<template>
  <GameLayout :showTips="true" title="PK10" :code="conf.gameType" :lottery="lottery" :ref="conf.layout.setRef"
    @reset="conf.betting.popup.close">
    <div class="row play-item-box">
      <div style="overflow-y: scroll;">
        <div class="tabs-list">
          <template v-for="item in lottery.play.list" :key="item.id">
            <div class="tab-item" :class="{ 'tab-active': item.id === lottery.play.item.id }"
              @click="lottery.play.change(`/game/${conf.gameType}/${conf.gameType}`, item)">
              <div class="item-content">
                <div class="icon"></div>
                <span>{{ item.label }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
    <div style="padding: 20rem;">
      <!-- 期数信息、倒计时 -->
      <div class="time-box" style="margin: 6rem 0 30rem 0">
        <div class="row justify-between">
          <div>
            <div class="text">{{ $t('game.drawID') }}</div>
            <div class="number">{{ lottery.issue }}</div>
          </div>
          <div class="column items-end">
            <div style="margin-bottom: 14rem">
              {{ $t('winGo.TimeRemaining') }}
            </div>
            <ctime :times="[lottery.countDown[0], lottery.countDown[1], lottery.countDown[2]]" />
          </div>
        </div>
      </div>
      <!-- 游戏 -->
      <div class="relative cgame-box" ref="cgamebox"
        style="width: 100%; height: 398rem; overflow: hidden; margin: 0 auto; margin-bottom: 30rem"
        :style="{ 'height': conf.game.box.height + 'px' }">
        <cgame ref="cgameRef" :title="lottery.play.item.label" :issue="lottery.lastissue"
          :width="conf.game.box.width" />
      </div>
      <!-- 下注选项 -->
      <div class="bet-box column fit-width relative" style="padding: 40rem 24rem 30rem 24rem">
        <div class="row" style="gap: 40rem">
          <template v-for="item in conf.betting.tabs.list">
            <div class="pl-tabs-item col" :class="{ 'active': item.name === conf.betting.tabs.item.name }"
              @click="conf.betting.tabs.change(item)">
              {{ item.name }}
            </div>
          </template>
        </div>

        <div class="game-line" style="margin: 30rem 0"></div>
        <div class="row" style="gap: 8rem">
          <template v-for="item in conf.betting.tabs.item.numList" :key="item.oddsCode">
            <div class="column flex-center ball-box" :class="{ 'active': item.isActive }" style="width: 19%"
              @click="conf.betting.popup.open(item, 2)">
              <div class="ball" :class="['qkball' + item.name]"></div>
              <div style="line-height: 50rem">
                {{ conf.betting.oddsInfo[item.oddsCode] || 0 }}
              </div>
            </div>
          </template>
        </div>
        <div class="row" style="gap: 6rem; margin-top: 10rem">
          <template v-for="item in conf.betting.tabs.item.sizeList" :key="item.oddsCode">
            <div class="col bsitem-box" :class="{ 'active': item.isActive }" @click="conf.betting.popup.open(item, 1)">
              <div class="bsitem row justify-between items-center" :class="['num_' + item.color]">
                <div>{{ item.name }}</div>
                <div>{{ conf.betting.oddsInfo[item.oddsCode] || 0 }}</div>
              </div>
            </div>
          </template>
        </div>
        <!-- 倒计时5秒弹窗 -->
        <big-time :seconds="lottery.countDown[2]"
          v-if="lottery.countDown[3] <= lottery.play.item.openLockCountdown"></big-time>
      </div>
      <!-- 历史记录 -->
      <div class="twgo-list">
        <div class="twgo-list-type flex justify-between items-center">
          <div class="type-item flex flex-center" v-for="item in conf.operation.list" :key="item.value"
            :class="{ 'type-active': item.value === conf.operation.active }" @click="conf.operation.change(item)">
            {{ item.label }}
          </div>
        </div>
        <history v-if="conf.operation.active === 'result'" :historyList="conf.his.result.list" />
        <order v-if="conf.operation.active === 'myOrder'" :orderDataList="conf.his.order.list"></order>
        <template v-if="conf.operation.active === 'rule'">
          <div style="padding: 20rem 48rem" v-html="lottery.play.item.lotteryRuleurl"></div>
        </template>
      </div>
      <!-- 分页工具 -->
      <cpage :pageSize="conf.page.pageSize" :pageNum.sync="conf.page.pageNum" :total="conf.page.total"
        @change="conf.page.change" v-if="conf.page.total > conf.page.pageSize"
        style="margin-bottom: 150rem; margin-top: 30rem" />
    </div>
    <!-- 下注弹窗内容 -->
    <template #bet>
      <div class="row items-center">
        <div class="select-info-name" style="margin-right: 10rem">
          {{ conf.betting.tabs.item.name }}
        </div>
        <div class="col row items-center">
          <template v-for="item in conf.betting.betNumArr" :key="item.oddsCode">
            <div :class="['qkball' + item.name]" style="height: 58rem; width: 58rem"></div>
          </template>
          <template v-for="item in conf.betting.betTypeArr" :key="item.oddsCode">
            <div class="row flex-center ct-bs" :class="['num_' + item.color]">
              <div>{{ item.name }}</div>
            </div>
          </template>
        </div>
      </div>
    </template>
    <!-- 加载动画 -->
    <game-loading v-if="conf.loading" />
  </GameLayout>
</template>
<script setup lang="ts">
import GameLayout from '../components/gameLayout-blue.vue'
import cpage from '../components/cpage-blue.vue'
import gameLoading from '../components/gameLoading.vue'
import ctime from '../components/downTime.vue'
import cgame from './com/game.vue'
import bigTime from '../components/bigTime-blue.vue'
import history from './com/gameHistory-blue.vue'
import order from './com/order.vue'
import { index } from './pk10'

const { conf, lottery, cgamebox, cgameRef, gameBoxRefs } = index()
</script>

<style lang="less" scoped>
.play-item-box {
  background-color: #fff;
  border-radius: 36rem;
  margin: 20rem 20rem 0;
}

.colum,
.flex,
.row {
  display: flex;
  flex-wrap: wrap;
}

.tabs-list {
  display: flex;
  align-items: flex-end;

  .tab-item {
    border-radius: 36rem;
    height: 180rem;
    padding: 0rem 24rem;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 25%;
    color: #959ba8;

    .item-content {
      display: flex;
      align-items: center;
      font-size: 24rem;

      .icon {
        width: 58rem;
        height: 58rem;
        background: url(/static/img/game/time_nor.png) no-repeat;
        background-size: 100%;
      }
    }

    &.tab-active {
      border: 2rem solid #77AAFF;
      background: linear-gradient(#336cff 0%, #336cfffc 51%, rgba(255, 166, 79, 0) 100%);
      // background: linear-gradient(180.23deg, rgba(51, 108, 255, 0.99) 0.2%, rgba(51, 108, 255, 0) 99.8%);
      color: #FFF !important;

      .icon {
        background: url(/static/theme/blue/time_nor.webp) no-repeat;
        background-size: 100%;
      }
    }
  }
}

//自定义下注列表样式
.select-info-name {
  color: #0074ff;
  font-size: 40rem;
}

.ct-bs {
  height: 48rem;
  padding: 0 20rem;
  color: #fff;
  border-radius: 10rem;
  margin: 0 8rem;
}

// 倒计时样式

.time-box {
  width: 100%;
  height: 190rem;
  background: url(/static/theme/blue/diban.webp) no-repeat;
  background-size: 100% 100%;
  padding: 42rem 36rem;
  color: #fff;

  .text {
    border: 1rem solid #fff;
    display: inline-block;
    font-size: 24rem;
    line-height: 38rem;
    color: #ffffff;
    border-radius: 10rem;
    margin-bottom: 14rem;
    padding: 0 16rem;
  }

  .number {
    font-size: 34rem;
    font-weight: 600;
  }
}

// 下注样式

.pl-tabs-item {
  display: flex;
  font-size: 24rem;
  justify-content: center;
  align-items: center;
  color: #697984;
  border-radius: 30rem;
  height: 60rem;
  padding: 0 20rem;
  background: #f6f7fa;
  color: #646464;

  &.active {
    background: #e6f2ff;
    color: #006fff;
  }
}

.bet-box {
  background-color: #fff;
  border-radius: 36rem;
}

.ball-box {
  padding-top: 10rem;
  border-radius: 8rem;
  border: 1rem solid #d61f2400;

  &.active {
    background: #e6f2ff;
    border: 1rem solid #006fff;
  }

  .ball {
    width: 76rem;
    height: 76rem;
    color: #fff;
    background: #fff;
    font-size: 30rem;
    font-weight: 500;
    color: #3a3a3a;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.bsitem-box {
  border-radius: 10rem;
  border: 1rem solid #d61f2400;
  padding: 6rem;

  &.active {
    border: 1rem solid #d61f24;
    background: #d61f241a;
  }

  .bsitem {
    border-radius: 10rem;
    height: 80rem;
    padding: 0 20rem;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}

.qkball1 {
  background: url(/static/img/game/pk10/speed_pinball01.png) !important;
  background-size: 100% !important;
}

.qkball2 {
  background: url(/static/img/game/pk10/speed_pinball02.png) !important;
  background-size: 100% !important;
}

.qkball3 {
  background: url(/static/img/game/pk10/speed_pinball03.png) !important;
  background-size: 100% !important;
}

.qkball4 {
  background: url(/static/img/game/pk10/speed_pinball04.png) !important;
  background-size: 100% !important;
}

.qkball5 {
  background: url(/static/img/game/pk10/speed_pinball05.png) !important;
  background-size: 100% !important;
}

.qkball6 {
  background: url(/static/img/game/pk10/speed_pinball06.png) !important;
  background-size: 100% !important;
}

.qkball7 {
  background: url(/static/img/game/pk10/speed_pinball07.png) !important;
  background-size: 100% !important;
}

.qkball8 {
  background: url(/static/img/game/pk10/speed_pinball08.png) !important;
  background-size: 100% !important;
}

.qkball9 {
  background: url(/static/img/game/pk10/speed_pinball09.png) !important;
  background-size: 100% !important;
}

.qkball10 {
  background: url(/static/img/game/pk10/speed_pinball10.png) !important;
  background-size: 100% !important;
}

.num_green {
  background: linear-gradient(90deg, #00be50 0%, #9bdf00 100%);
  box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}

.num_red {
  background: linear-gradient(90deg, #fd0261 0%, #ff8a96 100%);
  box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}

.num_blue {
  background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);
  box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}

.num_yellow {
  background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);
  box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}

// 历史数据样式
.bet-histort {
  // margin-top: 30rem;

  .header-item {
    height: 80rem;
    line-height: 80rem;
    text-align: center;
    width: 100%;
    background-color: #dddddd;
    border-radius: 26rem 26rem 0 0;
    color: rgba(92, 97, 109, 0.8);
    overflow: hidden;
    font-size: 28rem;

    &.active {
      color: #ffffff;
      background: linear-gradient(180deg, #f6843f 0%, #fea14d 100%);
    }
  }
}

.gh-table {
  color: #ffffff;

  &-header {
    text-align: center;
    background-color: #f6843f;
    font-size: 24rem;
    line-height: 80rem;
    font-weight: 600;
  }

  &-item {
    text-align: center;
    line-height: 80rem;
    color: #414141;
    font-size: 24rem;
    background-color: #fff;

    .bs-item {
      height: 40rem;
      line-height: 40rem;
      padding: 0 12rem;
      color: #fff;
      border-radius: 8rem;
    }
  }

  &-foot {
    height: 40rem;
    background-color: #ffffff;
    border-bottom-right-radius: 26rem;
    border-bottom-left-radius: 26rem;
  }
}

.gh-table .gh-table-item:nth-child(odd) {
  background-color: #fef4eb;
}

.twgo-list {
  padding: 20rem 0rem;

  .twgo-list-type {
    .type-item {
      width: 32%;
      background-color: #dddddd;
      border-radius: 14rem 14rem 0 0;
      color: rgba(92, 97, 109, 0.8);
      font-size: 28rem;
      height: 64rem;

      &.type-active {
        color: #ffffff;
        background: #006fff;
      }
    }
  }
}
</style>
