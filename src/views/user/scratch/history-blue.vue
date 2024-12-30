<template>
  <x-page :no-footer="true" :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>
      {{ $t('scratch.scratch') }}
    </template>
    <template #right>
      <div class="right-content">
        <div class="right-text">{{ $t('scratch.history') }}</div>
        <div class="right-icon">{{ conf.walletMoney }}</div>
      </div>
      <img class="wallet-img" src="/static/img/wallet.webp" />
    </template>
    <div class="top-select">
      <div class="top-content">
        <div class="class-num">
          <div class="class-item" :class="conf.clickTab == '0' ? 'activeTab' : ''" @click="conf.handleTabClick('0')">
            <div class="num">{{ conf.statistics.drawn }}</div>
            <div class="name">{{ $t('scratch.drawn') }}</div>
          </div>
          <div class="class-item" :class="conf.clickTab == '1' ? 'activeTab' : ''" @click="conf.handleTabClick('1')">
            <div class="num">{{ conf.statistics.winning }}</div>
            <div class="name">{{ $t('scratch.winning') }}</div>
          </div>
          <div class="class-item" :class="conf.clickTab == '2' ? 'activeTab' : ''" @click="conf.handleTabClick('2')">
            <div class="num">{{ conf.statistics.lose }}</div>
            <div class="name">{{ $t('scratch.losing') }}</div>
          </div>
          <div class="class-item" :class="conf.clickTab == '-1' ? 'activeTab' : ''" @click="conf.handleTabClick('-1')">
            <div class="num">{{ conf.statistics.expired }}</div>
            <div class="name">{{ $t('scratch.expired') }}</div>
          </div>
        </div>
        <div class="line">
          <div class="left-around"></div>
          <div class="centre"></div>
          <div class="left-around right"></div>
        </div>
      </div>
      <div class="result" style="flex: 1; overflow: hidden">
        <div class="result-list" style="overflow-y: scroll">
          <template v-for="(item, index) in conf.resultList" :key="index">
            <div class="result-ltem relative" @click="conf.goPlay(item)">
              <div class="result-title">
                <div class="absolute" style="top: 0; right: 0">
                  <div class="flex flex-center source-text">
                    {{ item.source }}
                  </div>
                </div>
                <div class="title-left">
                  <div class="title-type" v-if="item.stSaleStatus == 0">
                    <div class="title-skew"></div>
                    <div class="type-text">{{ $t('scratch.toDrawn') }}</div>
                  </div>
                  <div class="title-type" v-if="item.stSaleStatus == 1">
                    <div class="title-skew Prize"></div>
                    <div class="type-text">{{ $t('scratch.prizeWinning') }}</div>
                  </div>
                  <div class="title-type Losing" v-if="item.stSaleStatus == 2">
                    <div class="title-skew Losing"></div>
                    <div class="type-text">{{ $t('scratch.losingLottery') }}</div>
                  </div>
                  <div class="title-type" style="width: 215rem" v-if="item.stSaleStatus == -1">
                    <div class="title-skew Cancelled"></div>
                    <div class="type-text">{{ $t('scratch.haveExpired') }}</div>
                  </div>
                  <div class="title-code">{{ item.stSaleExpect }}</div>
                </div>
              </div>
              <div class="result-content">
                <div class="content-item">
                  <img class="content-img" src="/static/img/bet-time.png" />
                  <div class="content">{{ $t('scratch.bettingTime') }}:{{ conf.getHour(item.stSaleTime) }}</div>
                </div>
                <div class="content-item">
                  <img class="content-img" src="/static/img/sale-name.png" />
                  <div class="content">{{ $t('scratch.name') }}:{{ item.scratchTicketShowname }}</div>
                </div>
                <div class="content-item">
                  <img class="content-img" src="/static/img/bet-time.png" />
                  <div class="content">
                    {{ $t('game.betMoney') }}:{{ item.coinSymbol + item.saleMoney }}
                    <template v-if="conf.currentWalletInfo.coinCode != item.saleMoneyCoin">
                      {{
                        ' (≈' +
                        (conf.currentWalletInfo.coinSymbol == 'USDT'
                          ? conf.currentWalletInfo.coinSymbol + ' '
                          : conf.currentWalletInfo.coinSymbol) +
                        item.currentWalletSale +
                        ')'
                      }}
                    </template>
                  </div>
                </div>
                <div class="content-item" v-if="item.stSaleStatus">
                  <img class="content-img" src="/static/img/bet-time.png" />
                  <div class="content">
                    {{ $t('game.prizeMoney') }}:{{ item.coinSymbol + item.saleWalletWin }}
                    <template
                      v-if="
                        conf.currentWalletInfo.coinCode != item.saleMoneyCoin && parseFloat(item.saleWinningAmount) > 0
                      "
                    >
                      {{
                        '(≈' +
                        (conf.currentWalletInfo.coinSymbol == 'USDT'
                          ? conf.currentWalletInfo.coinSymbol + ' '
                          : conf.currentWalletInfo.coinSymbol) +
                        item.currentWalletWin +
                        ')'
                      }}
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <div v-if="conf.resultList.length > 0">
            <div class="more" v-if="!conf.isTips">
              <div class="more-btn" @click="conf.moreMessage">
                <span>{{ $t('game.showMore') }}</span>
                <img src="/static/img/show-more.png" style="width: 20rem; height: 12rem" />
              </div>
            </div>
            <div class="more-not" v-else>
              <span>{{ $t('user.noMore') }}</span>
            </div>
          </div>
          <div class="all" v-if="conf.resultList.length == 0">
            <div>{{ $t('casinoModule.noData') }}</div>
          </div>
        </div>
      </div>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import stheme from '@/sstore/stheme'
import { index } from './history'

const conf = index()
</script>

<style lang="less" scoped>
.right-content {
  text-align: right;
  letter-spacing: -0.3px;
  font-size: 22rem;
}

.wallet-img {
  width: 72rem;
  height: 72rem;
  margin-right: 20rem;
}

// @media screen and (max-width: 700px) {
.history-content {
  padding: 20rem 10rem;
}

.top-select {
  margin: 20rem 10rem;
  border-radius: 10rem;
  display: flex;
  flex-direction: column;
  height: calc(100% - 144rem);

  .class-num {
    height: 145rem;
    display: flex;
    justify-content: space-between;
    margin: 0rem 10rem;
    background-color: #FFFFFF;
    border-radius: 12rem;

    .class-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-weight: 700rem;
      font-size: 30rem;
      color: #999999;

      .num {
        color: #000;
        font-size: 36rem;
      }
    }
  }

  .line {
    display: flex;
    // justify-content: space-between;
    position: relative;

    .left-around {
      width: 18px;
      height: 33rem;
      background: #eff1f5;
      border-radius: 18rem;
      margin-left: -10rem;
      position: absolute;

      &.right {
        right: -10rem;
      }
    }

    .centre {
      height: 26rem;
      flex: 1;
    }
  }
}

.result {
  // margin: 0rem 24rem 124rem;
  border-radius: 16rem;

  .result-list {
    padding: 24rem 10rem 0rem;
    height: 100%;

    .result-ltem {
      padding: 30rem;
      background: #fff;
      margin-bottom: 24rem;
      border-radius: 16rem;

      .result-title {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .title-left {
          display: flex;
          align-items: center;

          .title-type {
            position: relative;
            width: 186rem;
            height: 46rem;

            .title-skew {
              background: #3c80f5;
              position: absolute;
              top: 0;
              bottom: 0;
              left: 0;
              right: 0;
              transform: skew(-30deg);

              &.Prize {
                background: #e20000;
              }

              &.Losing {
                background: #fdab45;
              }

              &.Cancelled {
                background: #5c6381;
              }
            }

            .type-text {
              position: absolute;
              top: 0;
              bottom: 0;
              left: 0;
              right: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-size: 24rem;
              font-weight: 600;
            }
          }

          .title-code {
            margin-left: 12rem;
            color: #000;
            font-size: 30rem;
            font-weight: 600;
          }
        }

        .title-right {
          color: #3c80f5;
          font-size: 24rem;
          font-weight: 600;
        }
      }

      .result-content {
        .content-item {
          display: flex;
          align-items: center;
          margin-top: 24rem;

          .content-img {
            width: 25rem;
            height: 22rem;
          }

          .content {
            color: #3a3a3a;
            font-size: 24rem;
            font-weight: 500;
            margin-left: 8rem;
            display: flex;
            align-items: center;

            .purchase {
              width: 30rem;
              height: 30rem;
            }

            .purchase-triple {
              text-align: center;

              .purchase-img {
                width: 30rem;
                height: 30rem;
              }
            }

            .purchase-num {
              width: 30rem;
              height: 30rem;
              position: relative;

              .sum-img {
                width: 100%;
                height: 100%;
              }

              .sum-num {
                position: absolute;
                top: 0rem;
                bottom: 0rem;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20rem;
              }
            }
          }

          .content-img-item {
            width: 25rem;
            height: 25rem;
            position: relative;

            img {
              width: 100%;
              height: 100%;
            }

            .img-num {
              position: absolute;
              top: 0;
              bottom: 0;
              right: 0;
              left: 0;
              color: #000;
              font-size: 18rem;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
        }

        .content-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      }
    }

    .more {
      background: #fff;
      padding: 24rem 24rem 24rem;

      .more-btn {
        box-shadow: rgba(0, 0, 0, 0.1) 0px 1.06667vw 1.06667vw;
        border-radius: 2.13333vw;
        height: 78rem;
        display: flex;
        align-items: center;
        justify-content: center;

        span {
          margin-right: 20rem;
          font-size: 24rem;
          font-weight: 700;
        }
      }
    }

    .more-not {
      padding: 8rem 0rem 36rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24rem;
      color: #707070;
    }

    .all {
      padding: 20rem;

      div {
        height: 75rem;
        background: #fff;
        border-radius: 10rem;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #707070;
      }
    }
  }
}

.activeTab,
.activeTab .num {
  // background: #000 !important;
  // color: #FDE63E !important;
  background: #E6F2FF !important;
  color: #006FFF !important;
}

.source-text {
  width: 176rem;
  height: 36rem;
  font-size: 16rem;
  background: linear-gradient(-90deg, #e6f2ff 0%, #ffffff 100%);
  color: #006FFF;
  border-top-right-radius: 16rem;
}
</style>
