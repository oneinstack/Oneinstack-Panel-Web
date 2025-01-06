<template>
  <x-page :fixed="false">
    <template #title>
      {{ $t('me.Bets') }}
    </template>
    <template #top>
      <chooseTop ref="chooseRef" @confirm="conf.dialog.confirm" />
    </template>
    <x-no-data v-if="!conf.loading && conf.list.length === 0"></x-no-data>
    <div class="relative" v-if="conf.list.length">
      <div style="height: 30rem; width: 100%"></div>
      <div
        class="row fit-width justify-center order-box"
        v-for="(item, _index) in conf.list"
        @click="conf.toDetail(item)"
      >
        <div class="order-item column">
          <!-- 顶部显示 -->
          <div class="row items-center justify-between no-wrap">
            <div class="row no-wrap items-center">
              <div class="title-left relative flex flex-center no-wrap">
                <div class="title-skew" :class="[conf.options.betStatus[item.betStatus]]"></div>
                <div class="absolute">{{ $t(`game.${conf.options.betStatus[item.betStatus]}`) }}</div>
              </div>
              <div class="issue">{{ item.betExpect }}</div>
              <img
                mode="heightFix"
                src="/static/images/common_right.png"
                style="height: 36rem; transform: translateY(2rem)"
              />
            </div>
            <div class="row items-center" style="transform: translateX(10rem)">
              <betCode :item="item" />
            </div>
          </div>

          <!-- 其他信息 -->
          <template v-if="item.lotteryTypeCode != 'SATTA_KING'">
            <div class="row items-center top12">
              <img class="order-icon" src="/static/img/bet-time.png" />
              <div style="margin: 0 10rem">{{ $t('game.bettingTime') + ':' }}</div>
              <div>{{ item.betTime }}</div>
            </div>
          </template>
          <template v-else>
            <div class="row items-center top12">
              <div class="row items-center">
                <img class="order-icon" src="/static/img/bet-time.png" />
                <div style="margin: 0 10rem">{{ $t('SattaKing.BettingContent2') + ':' }}</div>
              </div>
              <div class="col" style="text-wrap: wrap; word-break: break-word">
                {{
                  typeof item.betItem.value[0] === 'object'
                    ? item.betItem.value.map((v: any) => v.value).join(',')
                    : item.betItem.value[1]
                }}
              </div>
            </div>
            <div class="row items-center top12">
              <img class="order-icon" src="/static/img/bet-time.png" />
              <div style="margin: 0 10rem">{{ $t('SattaKing.GameType') + ':' }}</div>
              <div>{{ item.lotteryItem.lotteryShowname }}</div>
            </div>
          </template>

          <div class="row items-center top12">
            <img class="order-icon" src="/static/img/bet-money.png" />
            <div style="margin: 0 10rem">
              {{ $t(item.lotteryTypeCode != 'SATTA_KING' ? 'game.betMoney' : 'game.TotalBetAmount') + ':' }}
            </div>
            <div>
              {{ item.coinSymbol + item.betMoney }}
            </div>
          </div>
          <div class="row items-center top12">
            <img class="order-icon" src="/static/img/bet-prize.png" />
            <div style="margin: 0 10rem">{{ $t('game.prizeMoney') + ':' }}</div>
            <div>
              {{ [0, 3].includes(item.betStatus) ? '--' : item.coinSymbol + item.betPrizeMoney }}
            </div>
          </div>

          <!-- 开奖内容 -->
          <div class="row items-center justify-between no-wrap top12">
            <div class="row items-center">
              <div class="flex flex-center relative">
                <img class="order-icon" src="/static/img/bet-numbers.png" />
                <div class="absolute" style="font-size: 18rem">
                  <div v-if="['5D', 'PK10'].includes(item.lotteryTypeCode)">
                    {{ item.betOpenCodeList[0] ? Number(item.betOpenCodeList[0].value) : '' }}
                  </div>
                  <div v-else>{{ item.sumVal }}</div>
                </div>
              </div>
              <div style="margin: 0 10rem">{{ $t('game.openCode') + ':' }}</div>
              <openCode :item="item" />
            </div>

            <!-- 5D多一列sum显示单独处理 -->
            <div class="row items-center" v-if="item.lotteryTypeCode === '5D' && item.sumVal !== undefined">
              <div class="flex flex-center relative">
                <img class="order-icon" src="/static/img/bet-numbers.png" />
                <div class="absolute" style="font-size: 18rem">S</div>
              </div>
              <div style="margin: 0 10rem">{{ $t('game.sum') + ':' }}</div>
              <div class="flex flex-center relative">
                <img style="width: 42rem; height: 42rem" src="/static/img/poinits.webp" />
                <div class="absolute" style="font-size: 24rem; color: rgb(44, 46, 54); font-weight: 900">
                  {{ item.sumVal }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="row items-center justify-center"
        style="margin-top: 20rem"
        v-if="conf.page.total && conf.page.total <= conf.list.length"
      >
        {{ $t('user.noMore') }}
      </div>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import betCode from './betCode.vue'
import chooseTop from './chooseTop.vue'
import openCode from './openCode.vue'
import { index } from './index'

const chooseRef = ref()
const conf = index({ chooseRef })
</script>

<style lang="less" scoped>
.order-box {
  border-radius: 20rem;
  background: #ffffff;
  margin-bottom: 30rem;
}
.order-item {
  width: 690rem;
  margin: 32rem 0rem;
  font-size: 24rem;
}
.order-icon {
  width: 26rem;
  height: 26rem;
}

.top12 {
  margin-top: 24rem;
}
.title-left {
  width: 196rem;
  height: 46rem;
  color: #fff;
  font-size: 24rem;
}
.issue {
  font-size: 32rem;
  font-weight: 600;
  color: #000;
  margin-left: 20rem;
  text-wrap: nowrap;
}
.title-skew {
  background: #3c80f5;
  width: 196rem;
  height: 46rem;
  transform: skew(-30deg);

  &.prizeWinning {
    background: #e20000;
  }

  &.losingLottery {
    background: #fdab45;
  }

  &.Cancelled {
    background: #5c6381;
  }
}
</style>
