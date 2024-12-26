<template>
  <x-page :no-footer="true" :fixed="false" :bgcolor="'#F1F1F1'" :header-bg-color="stheme.theme.blue.headerBgColor()">
    <template #title>
      {{ $t('task.mytask') }}
    </template>
    <template #top>
      <div class="type-nav">
        <div class="type-list">
          <template v-for="(item, index) in conf.typeList" :key="index">
            <div
              class="type-item"
              :class="{ 'type-active': conf.navIndex == index }"
              @click="conf.changeType(index, item)"
            >
              {{ item.name }}
            </div>
          </template>
        </div>
        <div
          class="trend-line"
          :style="{
            width: `${conf.navLeft}px`,
            transform: `translateX(${conf.navIndex * conf.navLeft}px)`,
            'transition-duration': '0.2s'
          }"
        ></div>
      </div>
    </template>
    <div class="task-list" style="flex: 1; overflow-y: hidden" v-if="conf.defalutWallet">
      <div style="height: 100%; overflow-y: scroll" @scroll="conf.moreMessage">
        <template v-for="(item, index) in conf.taskList" :key="index">
          <div class="task-item">
            <div class="task-left">
              <div class="left-img">
                <img mode="widthFix" class="vip-img" :src="`/static/img/VIP/v${conf.getLevel(item.userLevel)}.svg`" />
                <img class="task-img" :src="item.img" />
              </div>
              <div class="left-info">
                <div class="info-name">
                  <div class="task-name">{{ item.title }}</div>
                  <div class="task-tips">{{ item.brief }}</div>
                </div>
              </div>
            </div>
            <div class="task-right">
              <div class="right-line">
                <div
                  :class="'get-line-' + item.userTaskStatus"
                  :style="{ 'width': conf.getProgress(item) + '%' }"
                ></div>
              </div>
              <div :class="'num-' + item.userTaskStatus">{{ conf.getProgress(item) }}%</div>
            </div>
            <!-- 0-现金、1-宝箱 -->
            <div class="task-money" v-if="item.rewardType">
              <div style="display: flex; align-items: center">
                <template v-for="(b, i2) in conf.getBoxTypeNum(item.reward)" :key="b.id">
                  <div style="display: flex; align-items: center">
                    <img class="task-coin-img" :src="`/static/img/point/box${b.boxType}.png`" />
                    <span style="margin-right: 10rem">+{{ b.count }}</span>
                  </div>
                </template>
              </div>
              <!-- <img class="clock-img" src="/static/img/task/task-clock.png" /> -->
              <div class="time">{{ sutil.getTimeFormat(item.pickupTime) }}</div>
            </div>
            <div class="task-money" v-else>
              <div style="display: flex; align-items: center">
                <div class="task-coin">{{ conf.defalutWallet.coinSymbol }}</div>
                <span>+{{ conf.defalutWallet.coinSymbol + sutil.dataHandling(parseInt(item.reward)) }}</span>
              </div>
              <!-- <img class="clock-img" src="/static/img/task/task-clock.png" /> -->
              <div class="time">{{ sutil.getTimeFormat(item.pickupTime) }}</div>
            </div>
            <div class="right-top">
              <img class="state-img" :src="`/static/img/task/task-${item.userTaskStatus}.png`" />
            </div>
          </div>
        </template>
        <div :style="{ 'margin-top': conf.loading && conf.taskList.length > 0 ? '-80rem' : '0rem' }">
          <loading v-if="conf.loading"></loading>
        </div>
        <x-no-data v-if="!conf.loading && conf.taskList.length == 0"></x-no-data>
      </div>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import stheme from '@/sstore/stheme'
import loading from './components/loading.vue'
import { index } from './myTask'

const { conf, sutil } = index()
</script>

<style lang="less" scoped>
.type-nav {
  background: #fff;

  .type-list {
    height: 85rem;
    display: flex;
    font-size: 28rem;

    .type-item {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
    }

    .type-active {
      background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .trend-line {
    height: 4rem;
    background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
  }
}

.task-list {
  padding: 20rem 20rem 0rem;

  .task-item {
    overflow: hidden;
    background: #fff;
    border-radius: 12rem;
    margin-bottom: 20rem;
    padding: 20rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;

    .task-left {
      display: flex;
      align-items: center;

      .left-img {
        width: 145rem;
        height: 145rem;
        position: relative;
        flex-shrink: 0;

        .task-img {
          width: 100%;
          height: 100%;
          border-radius: 16rem;
        }

        .vip-img {
          width: 66rem;
          // height: 32rem;
          position: absolute;
          top: -18rem;
          left: -19rem;
          z-index: 1;
        }
      }

      .left-info {
        padding: 0rem 12rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 143rem;
        position: relative;

        .info-name {
          width: 320rem;

          .task-name {
            color: #000;
            font-weight: 500;
            font-size: 28rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .task-tips {
            color: #999;
            font-size: 24rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: 300rem;
          }
        }
      }
    }

    .task-right {
      display: flex;
      align-items: center;
      padding-bottom: 10rem;

      .collect-btn {
        padding: 8rem 24rem;
        color: #fc9b01;
        background: #fff2e9;
        border-radius: 24rem;
        font-size: 25rem;
      }

      .right-line {
        height: 12rem;
        width: 100rem;
        background: #f0f0f0;
        border-radius: 6rem;
        overflow: hidden;
        margin-right: 15rem;

        .get-line-0 {
          background: linear-gradient(88.87deg, #ffa14d 17.77%, #ff6c2c 81.21%);
          height: 100%;
        }

        .get-line--1 {
          background: linear-gradient(88.87deg, #fe5d5e 17.77%, #ff0c2b 81.21%);
          height: 100%;
        }

        .get-line-1,
        .get-line-2,
        .get-line-3 {
          background: linear-gradient(88.87deg, #67e16b 17.77%, #22cd28 81.21%);
          height: 100%;
        }
      }

      .num-0 {
        font-size: 24rem;
        color: #ff7502;
      }

      .num-1,
      .num-2 {
        font-size: 24rem;
        color: #6ee372;
      }

      .num--1 {
        font-size: 24rem;
        color: #ff0c2b;
      }
    }

    .task-money {
      position: absolute;
      bottom: 15rem;
      left: 175rem;
      z-index: 1;

      // display: flex;
      // align-items: center;
      .task-coin-img {
        width: 40rem;
        height: 40rem;
        flex-shrink: 0;
      }

      .task-coin {
        width: 38rem;
        height: 38rem;
        background-size: 100% 100%;
        background-image: url('/static/img/coin-task.png');
        color: #faa54b;
        font-size: 19rem;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      span {
        color: #006FFF;
        font-size: 25rem;
      }

      .clock-img {
        width: 32rem;
        height: 32rem;
        margin-left: 20rem;
        flex-shrink: 0;
      }

      .time {
        color: #999;
        font-size: 24rem;
        flex-shrink: 0;
      }
    }

    .right-top {
      position: absolute;
      right: -40rem;
      top: -40rem;
      width: 80rem;
      height: 80rem;
      background: #E6F2FF;
      transform: rotate(45deg);

      .state-img {
        width: 24rem;
        height: 24rem;
        position: absolute;
        left: 30rem;
        top: 52rem;
        transform: rotate(-45deg);
      }
    }
  }
}
</style>
