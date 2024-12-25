<script setup lang="ts">
import { index } from './centerWallet'
import stheme from '@/sstore/stheme'

const conf = index()
</script>

<template>
  <x-page :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>{{ $t('wallet.centralWallet') }}</template>
    <div class="order-box">
      <div
        class="other-item"
        v-for="(item, itemIndex) in conf.gameList"
        :key="itemIndex"
        @click="conf.handleClickIntoPage(item)"
      >
        <div class="item-score">
          <!-- <span>{{ item.code || ''}}</span> -->
          <!-- <div class="imgBg">
					</div> -->
          <img class="imageLog" src="/static/img/bugo.png" mode="" v-if="item.code == 'BUGO'" />
          <img
            class="imageLog"
            :src="'/static/theme/blue/' + item.code + '.svg'"
            mode=""
            v-else-if="item.code == 'Current'"
          />
          <img class="imageLog" :src="'/static/img/centerWallet/' + item.code + '.png'" mode="" v-else />
        </div>
        <div class="name-view">{{ item.name }}</div>
        <div v-if="item.code != 'Current'">
          <div
            v-if="item.walletMoney == -1"
            class="flex flex-center"
            style="height: 74rem; --time-rotate360: 2s"
            :class="[item.loading ? 'rotate360' : '']"
          >
            <img src="/static/theme/blue/refresh.png" style="width: 40rem; height: 40rem" />
          </div>
          <div class="column justify-center no-wrap" v-else style="height: 74rem">
            <div class="item-monry">
              <span>
                {{
                  '≈' +
                  conf.currentCoinSymbol +
                  ' ' +
                  (item.currentWalletMoney == '-1.00' ? '-' : conf.getTWoFiexd(item.currentWalletMoney))
                }}
              </span>
            </div>
            <div class="item-title row justify-center">
              <span>
                {{ item.walletMoney == -1 ? '-' : item.coinSymbol + ' ' + conf.getTWoFiexd(item.walletMoney) }}
              </span>
            </div>
          </div>
        </div>
        <div class="item-title" v-else>
          <span>{{ item.walletMoney == -1 ? '-' : item.coinSymbol + ' ' + conf.getTWoFiexd(item.walletMoney) }}</span>
        </div>
      </div>
    </div>

    <x-no-data v-if="!conf.isLoading && conf.gameList.length == 0" />
  </x-page>
</template>

<style scoped lang="less">
.order-box {
  padding: 15rem;
  display: flex;
  // justify-content: space-between;
  flex-wrap: wrap;

  .other-item {
    border-radius: 22rem;
    opacity: 0.9004;
    background: #fff1de;
    width: 31.3%;
    min-height: 102rem;
    padding: 24rem 0rem 22rem;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    margin-bottom: 20rem;
    color: #000000;
    background: #fff;
    margin-left: calc(7% / 4);

    .item-title {
      background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
      -webkit-background-clip: text;
      /* 使用-webkit-前缀兼容部分浏览器 */
      background-clip: text;
      color: transparent;
      font-size: 32rem;
      font-weight: 600;
      // margin: 10rem 20rem 0rem;
    }

    .item-score {
      font-size: 28rem;
      color: #000000;
      font-weight: bold;
      margin: 10rem 20rem 0rem;
      .imgBg {
        width: 48rem;
        height: 48rem;
        text-align: center;
        line-height: 1.9;
        background-color: #f2f2f2;
        border-radius: 50%;
        // background-color: blue;
      }
      .imageLog {
        width: 56rem;
        height: 56rem;
      }
    }
    .item-monry {
      font-size: 22rem;
      color: #999999;
      // margin-left: 20rem;
    }
  }
}

.name-view {
  font-size: 24rem !important;
}
</style>
