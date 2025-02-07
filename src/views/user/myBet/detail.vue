<template>
  <x-page>
    <template #title>
      {{ $t('me.Bets') }}
    </template>
    <div class="relative" v-if="conf.item.lotteryTypeCode">
      <div style="height: 32rem"></div>
      <div class="order-item column">
        <!-- 顶部显示 -->
        <div class="content-box" style="margin-top: 32rem">
          <div class="row items-center">
            <img
              :src="'/static/img/long/' + conf.item.lotteryTypeCode + '.png'"
              style="width: 108rem; height: 108rem"
            />
            <div class="column" style="margin-left: 24rem">
              <div style="font-size: 32rem; font-weight: 600; color: #333">
                {{ conf.item.lotteryTypeName }} - {{ conf.item.lotteryItem.lotteryShowname }}
              </div>
              <div style="font-size: 20rem; color: #999999">
                {{ conf.item.betExpect }}
              </div>
              <div style="margin-top: 12rem">
                <betCode :item="conf.item" />
              </div>
            </div>
          </div>
        </div>
        <!-- 分割线 -->
        <div style="width: 100%; height: 2rem; background: #f4f4f4; margin: 32rem 0"></div>

        <!-- 下注内容 -->
        <div class="content-box">
          <div class="title-b1">BetContent</div>

          <!-- 其他信息 -->
          <!-- satta king -->
          <template v-if="conf.item.lotteryTypeCode == 'SATTA_KING'">
            <div class="row items-center top12">
              <div class="row items-center">
                <img class="order-icon" src="/static/img/bet-time.png" />
                <div style="margin: 0 10rem">{{ $t('SattaKing.BettingContent2') + ':' }}</div>
              </div>
              <div class="col" style="text-wrap: wrap; word-break: break-word">
                {{
                  typeof conf.item.betItem.value[0] === 'object'
                    ? conf.item.betItem.value.map((v: any) => v.value).join(',')
                    : conf.item.betItem.value[1]
                }}
              </div>
            </div>
            <div class="row items-center top12">
              <img class="order-icon" src="/static/img/bet-time.png" />
              <div style="margin: 0 10rem">{{ $t('SattaKing.GameType') + ':' }}</div>
              <div>{{ conf.item.lotteryItem.lotteryShowname }}</div>
            </div>
          </template>
          <!-- 六合彩 -->
          <template v-else-if="conf.item.lotteryTypeCode == 'MARK_SIX'">
            <div class="row items-center top12">
              <div class="row items-center">
                <img class="order-icon" src="/static/img/bet-time.png" />
                <div style="margin: 0 10rem">{{ $t('SattaKing.BettingContent2') + ':' }}</div>
              </div>
              <div class="col" style="text-wrap: wrap;word-break: break-word;">
                <div style="display: flex;flex-wrap: wrap;">
                  <template v-for="(into,intoIndex) in conf.item.betContent">
                    <div class="ball-box" :style="{
                    'background-image': `url('/static/img/game/marksix/${into}.webp')`,
                    }"
                    v-if="isNaN(into)">
                    <div>{{ intoIndex != conf.item.betContent.length - 1 ? into + ' , ' : into }}</div>
									</div>
									<resultBall :num="into" :size="42" v-if="!isNaN(into)" style="margin: 0rem 4rem 4rem 0rem;"/>
                  </template>
								</div>
              </div>
            </div>
            <div class="row items-center top12">
              <img class="order-icon" src="/static/img/bet-time.png" />
              <div style="margin: 0 10rem">{{ $t('SattaKing.GameType') + ':' }}</div>
              <div>{{ conf.item.playName }}</div>
            </div>
          </template>
          <!-- 其他 -->
          <template v-else>
            <div class="row items-center top12">
              <img class="order-icon" src="/static/img/bet-time.png" />
              <div style="margin: 0 10rem">{{ $t('game.bettingTime') + ':' }}</div>
              <div>{{ conf.item.betTime }}</div>
            </div>
            <div class="row items-center top12">
              <img class="order-icon" src="/static/img/bet-time.png" />
              <div style="margin: 0 10rem">{{ $t('game.openTime') + ':' }}</div>
              <div>{{ conf.item.betOpenTime }}</div>
            </div>
          </template>

          <div class="row items-center top12">
            <img class="order-icon" src="/static/img/bet-money.png" />
            <div style="margin: 0 10rem">
              {{ $t(conf.item.lotteryTypeCode != 'SATTA_KING' ? 'game.betMoney' : 'game.TotalBetAmount') + ':' }}
            </div>
            <div>
              {{ conf.item.coinSymbol + conf.item.betMoney }}
            </div>
          </div>
          <div class="row items-center top12">
            <img class="order-icon" src="/static/img/bet-prize.png" />
            <div style="margin: 0 10rem">{{ $t('game.prizeMoney') + ':' }}</div>
            <div>
              {{ [0, 3].includes(conf.item.betStatus) ? '--' : conf.item.coinSymbol + conf.item.betPrizeMoney }}
            </div>
          </div>

          <!-- 开奖内容 -->
          <div class="row items-center justify-between no-wrap top12">
            <div class="row items-center">
              <div class="flex flex-center relative">
                <img class="order-icon" src="/static/img/bet-numbers.png" />
                <div class="absolute" style="font-size: 18rem">
                  <div v-if="['5D', 'PK10'].includes(conf.item.lotteryTypeCode)">
                    {{ conf.item.betOpenCodeList[0] ? Number(conf.item.betOpenCodeList[0].value) : '' }}
                  </div>
                  <div v-else>{{ conf.item.sumVal }}</div>
                </div>
              </div>
              <div style="margin: 0 10rem">{{ $t('game.openCode') + ':' }}</div>
              <openCode :item="conf.item" v-if="conf.item.lotteryTypeCode != 'MARK_SIX'"/>
              <template v-for="into in conf.item.betOpenCodeList" v-else>
                <resultBall :num="into.value" :size="42" style="margin-right: 4rem;"/>
              </template>
            </div>

            <!-- 5D多一列sum显示单独处理 -->
            <div class="row items-center" v-if="conf.item.lotteryTypeCode === '5D' && conf.item.sumVal !== undefined">
              <div class="flex flex-center relative">
                <img class="order-icon" src="/static/img/bet-numbers.png" />
                <div class="absolute" style="font-size: 18rem">S</div>
              </div>
              <div style="margin: 0 10rem">{{ $t('game.sum') + ':' }}</div>
              <div class="flex flex-center relative">
                <img style="width: 42rem; height: 42rem" src="/static/img/poinits.webp" />
                <div class="absolute" style="font-size: 24rem; color: rgb(44, 46, 54); font-weight: 900">
                  {{ conf.item.sumVal }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分割线 -->
        <div class="relative" style="width: 100%; height: 2rem; margin: 32rem 0; border-top: 2rem dashed #f4f4f4">
          <div class="absolute border-left"></div>
          <div class="absolute border-right"></div>
        </div>

        <!-- 下注号码获胜详情 -->
        <div class="content-box">
          <div class="title-b1">BetNumber</div>
          <div class="row items-center betnumber-head" style="background-color: #f6f7fa; height: 58rem">
            <div style="width: 10rem"></div>
            <div class="row flex-center text-m" style="width: 180rem">BetNumber</div>
            <div class="row flex-center text-m" style="width: 180rem">BetMoney</div>
            <div class="col row flex-center text-m">Winning Status</div>
            <div style="width: 10rem"></div>
          </div>
          <div class="row items-center betnumber-head" style="margin-bottom: 40rem">
            <div style="width: 10rem"></div>
            <div class="row flex-center text-m" style="width: 180rem; word-break: break-word">
              <template v-if="conf.item.lotteryTypeCode == 'SATTA_KING'">
                {{
                  typeof conf.item.betItem.value[0] === 'object'
                    ? conf.item.betItem.value.map((v: any) => v.value).join(',')
                    : conf.item.betItem.value[1]
                }}
              </template>
              <template v-else-if="conf.item.lotteryTypeCode == 'MARK_SIX'" v-for="(into,intoIndex) in conf.item.betContent">
                <div class="ball-box" :style="{
                    'background-image': `url('/static/img/game/marksix/${into}.webp')`,
                    }"
                    v-if="isNaN(into)">
                    <div>{{ intoIndex != conf.item.betContent.length - 1 ? into + ' , ' : into }}</div>
									</div>
									<resultBall :num="into" :size="42" v-if="!isNaN(into)" style="margin: 0 4rem 4rem 0;"/>
              </template>
              <template v-else>
                <betCode :onlyLast="true" :item="conf.item" />
              </template>
            </div>
            <div class="row flex-center text-m" style="width: 180rem">
              {{ conf.item.coinSymbol + conf.item.betMoney }}
            </div>
            <div class="col row flex-center title-skew" :class="[conf.options.betStatus[conf.item.betStatus]]">
              {{ $t(`game.${conf.options.betStatus[conf.item.betStatus]}`) }}
            </div>
            <div style="width: 10rem"></div>
          </div>
        </div>
      </div>
    </div>
  </x-page>
</template>
<script lang="ts" setup>
import betCode from './betCode.vue'
import openCode from './openCode.vue'
import { index } from './detail'
import resultBall from '../../game/MarkSix/components/resultBall.vue'

const conf = index()
</script>
<style lang="less" scoped>
.order-item {
  width: 686rem;
  margin: 0rem auto;
  font-size: 24rem;
  border-radius: 20rem;
  background: #ffffff;
  position: relative;
}
.content-box {
  width: 622rem;
  margin: 0 auto;
}
.title-b1 {
  font-size: 32rem;
  font-weight: 600;
  color: #5c5c5c;
}
.order-icon {
  width: 26rem;
  height: 26rem;
}

.top12 {
  margin-top: 24rem;
}

.title-skew {
  color: #3c80f5;
  font-size: 28rem;
  font-weight: 600;

  &.prizeWinning {
    color: #e20000;
  }

  &.losingLottery {
    color: #fdab45;
  }

  &.Cancelled {
    color: #5c6381;
  }
}

.border-left {
  width: 44rem;
  height: 44rem;
  background: var(--bgcolor);
  left: -22rem;
  top: -22rem;
  border-radius: 50%;
}
.border-right {
  width: 44rem;
  height: 44rem;
  background: var(--bgcolor);
  right: -22rem;
  top: -22rem;
  border-radius: 50%;
}

.betnumber-head {
  width: 622rem;
  margin: 20rem auto;
  border-radius: 8rem;
  .text-m {
    font-size: 24rem;
    color: #3a3a3a;
    font-weight: 50;
  }
}
</style>
