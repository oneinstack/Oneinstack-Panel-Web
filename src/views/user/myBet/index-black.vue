<template>
  <x-page :fixed="false">
    <template #title>
      {{ $t('me.Bets') }}
    </template>
    <template #top>
      <chooseTop ref="chooseRef" @confirm="conf.dialog.confirm" />
      <div class="table-title flex-b-c">
        <div>Type</div>
        <div>Bet</div>
      </div>
    </template>

    <div class="table">
      <x-no-data v-if="!conf.loading && conf.list.length === 0"></x-no-data>
      <template v-for="(item, _index) in conf.list">
        <div class="table-item flex-b-c" @click="conf.toDetail(item)">
          <div class="l-name">
            <img :src="'/static/img/long/' + item.lotteryTypeCode + '.png'" />
            <span>{{ item.lotteryTypeName }}</span>
          </div>
          <div class="r-amount">
            <div class="money">
              <div>
                <span>{{ Number(item.betPrizeMoney) > 0 ? '+' : '-' }}</span>
                {{ (item.coinSymbol || '') }}
                <span>{{ Number(item.betPrizeMoney) > 0 ? item.betPrizeMoney : item.totalBetAmount }}</span>
              </div>
              <img class="coin-img" :src="item.nationalFlag" v-if="item.nationalFlag" />
            </div>
            <div class="status">
              <div class="s-l">
                <div class="icon" :class="[conf.options.betStatus[item.betStatus]]"></div>
                <div class="status-name">{{ $t(`game.${conf.options.betStatus[item.betStatus]}`) }}</div>
              </div>
              <van-icon size="24rem" color="#B3BEC1" name="arrow" />
            </div>
          </div>
        </div>
      </template>
      <div class="row items-center justify-center" style="margin-top: 20rem;color: #bfbfbf;"
        v-if="conf.page.total && conf.page.total <= conf.list.length">
        {{ $t('user.noMore') }}
      </div>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import betCode from './betCode.vue'
import chooseTop from './chooseTop-black.vue'
import openCode from './openCode.vue'
import { index } from './index'
import stheme from '@/sstore/stheme'
import resultBall from '../../game/MarkSix/components/resultBall.vue'

const chooseRef = ref()
const conf = index({ chooseRef })
</script>

<style lang="less" scoped>
.table-title {
  background: #292D2E;
  height: 80rem;
  border-radius: 20rem;
  font-family: Poppins;
  font-weight: 500;
  font-size: 24rem;
  color: #fff;
  padding: 0rem 20rem;
  margin: 0rem 24rem;
}

.table {
  padding: 0rem 24rem;
}

.table-item {
  font-family: Poppins;
  font-weight: 600;
  font-size: 24rem;
  border-top: 2rem solid #3B4041;
  padding: 30rem 12rem;

  &:first-of-type {
    border-top: none;
  }

  .l-name {
    color: #fff;
    font-size: 28rem;
    display: flex;
    align-items: center;

    img {
      width: 32rem;
      height: 32rem;
      margin-right: 20rem;
    }
  }

  .r-amount {
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    .money {
      display: flex;
      align-content: center;
      color: #1CF187;

      .coin-img {
        height: 30rem;
        border-radius: 2rem;
        margin-left: 10rem;
      }
    }

    .status {
      display: flex;
      align-items: center;
      margin-top: 4rem;

      .s-l {
        display: flex;
        align-items: center;
      }

      .icon {
        width: 10rem;
        height: 10rem;
        border-radius: 50%;
        background: #fdab45;

        &.prizeWinning {
          background: #04BD41;
        }

        &.losingLottery {
          background: #e20000;
        }

        &.cancelledOrder {
          background: #5c6381;
        }
      }

      .failed {
        background: #BD1904;
      }

      .under {
        background: #FF9820;
      }

      .status-name {
        color: #B3BEC1;
        font-weight: 700;
        margin: 0rem 16rem;
      }
    }
  }
}
</style>
