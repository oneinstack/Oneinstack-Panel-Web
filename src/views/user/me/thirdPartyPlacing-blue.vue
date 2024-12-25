<template>
  <x-page no-footer :fixed="false" :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>{{ $t('me.casinoBets') }}</template>
    <!-- tab -->
    <template #top>
      <div class="tabs-comtent">
        <div class="tabs-type">
          <div style="width: 100%; overflow-x: auto">
            <div class="type-list">
              <template v-for="(item, index) in conf.navList" :key="index">
                <div
                  class="type-item"
                  :class="{ 'type-active': item.type == conf.typeIndex }"
                  @click="conf.handleChangeTab(item, index)"
                >
                  {{ item.name }}
                </div>
              </template>
            </div>
          </div>
        </div>
        <div class="tabs-times">
          <template v-for="(item, index) in conf.timesList" :key="index">
            <div
              class="time-item"
              :class="{ 'time-active': item.value == conf.timeIndex }"
              @click="conf.handleChangeTime(item, index)"
            >
              {{ item.label }}
            </div>
          </template>
        </div>
      </div>
    </template>
    <!-- center -->
    <div style="width: 100%; height: 100%">
      <div class="result-list">
        <div style="height: 24rem"></div>
        <template v-for="(item, index) in conf.resultList" :key="index">
          <div class="result-ltem">
            <div class="result-title">
              <div class="title-left">
                <div class="title-type">
                  <div class="title-skew"></div>
                  <div class="type-text">{{ 'AG' }}</div>
                </div>
                <div class="title-code">{{ item.dsfCenterBetId }}</div>
              </div>
            </div>
            <!-- content -->
            <div class="result-content2">
              <div class="singe-line">
                <div class="left-div">
                  <img src="/static/img/three-gameName.png" class="left-img" />
                  {{ 'GameName' }}：
                </div>
                <div class="right-div">{{ item.gameName }}</div>
              </div>
              <div class="singe-line" v-if="item.platformApiCode">
                <div class="left-div">
                  <img src="/static/img/three-apiCode.png" class="left-img" />

                  {{ 'PlatformApiCode' }}：
                </div>
                <div class="right-div">{{ item.platformApiCode }}</div>
              </div>
              <div class="singe-line">
                <div class="left-div">
                  <img src="/static/img/bet-money.png" class="left-img" />
                  {{ 'BetAccount' }}：
                </div>
                <div class="right-div">{{ item.betAmount + ' ' + item.betCoin }}</div>
              </div>
              <div class="singe-line">
                <div class="left-div">
                  <img src="/static/img/three-account.png" class="left-img" />
                  {{ 'Account' }}：
                </div>
                <div class="right-div">{{ item.playerAccount || item.playerId }}</div>
              </div>
              <div class="singe-line">
                <div class="left-div">
                  <img src="/static/img/three-home.png" class="left-img" />
                  {{ 'RoomNumber' }}：
                </div>
                <div class="right-div">{{ item.tableName }}</div>
              </div>
              <div class="singe-line">
                <div class="left-div">
                  <img src="/static/img/three-time.png" class="left-img" />
                  {{ 'GameTime' }}：
                </div>
                <div class="right-div">{{ item.gameTime }}</div>
              </div>
            </div>
          </div>
        </template>
        <div v-if="conf.resultList.length > 0">
          <div class="more" v-if="conf.showMore">
            <div class="more-btn" @click="conf.moreMessage">
              <span>{{ $t('game.showMore') }}</span>
              <img src="/static/img/show-more.png" style="width: 20rem; height: 12rem" />
            </div>
          </div>
          <div class="more-not" v-else>
            <span>{{ $t('user.noMore') }}</span>
          </div>
        </div>
        <x-no-data v-if="conf.resultList.length == 0"></x-no-data>
      </div>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import { index } from './thirdPartyPlacing'
import stheme from '@/sstore/stheme'

const conf = index()
</script>

<style lang="less" scoped>
.tabs-comtent {
  height: 224rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 32rem 60rem;
  width: 100%;

  .tabs-type {
    display: flex;

    .type-list {
      display: flex;
      height: 60rem;
      // background: #E6F2FF;
      color: #000000;
      font-weight: bold;
      border-radius: 10rem;

      .type-item {
        background: #f9f9f9;
        // width: 148rem;
        width: 220rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .type-active {
        border-radius: 10rem;
        background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
        color: #fff;
      }
    }
  }

  .tabs-times {
    display: flex;
    justify-content: space-between;

    .time-item {
      text-align: center;
      color: #00000090;
      font-weight: bold;
      background: #f9f9f9;
      border-radius: 10rem;
      height: 56rem;
      line-height: 56rem;
      width: 180rem;

      &:first-of-type {
        margin-left: 0rem;
      }
    }

    .time-active {
      background: #e6f2ff;
      color: #006fff;
    }
  }
}

.result-list {
  .result-ltem {
    padding: 50rem;
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
          width: 156rem;
          height: 46rem;
          border-radius: 10rem;
          box-sizing: border-box;
          // overflow: hidden;

          .title-skew {
            // background: #3C80F5;
            background: linear-gradient(to right, #fd2f3d, #ff7d54);
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            border-radius: 8rem;
            transform: skew(-20deg);

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
          margin-left: 30rem;
          color: #000;
          font-size: 30rem;
          font-weight: 600;
        }
      }

      .title-right {
        .purchase-bg {
          padding: 0rem 12rem;
          height: 40rem;
          background: red;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20rem;
          color: #fff;
          border-radius: 5rem;
        }

        .purchase {
          width: 42rem;
          height: 42rem;
        }

        .purchase-triple {
          text-align: center;

          .purchase-img {
            width: 30rem;
            height: 30rem;
          }
        }

        .purchase-num {
          width: 40rem;
          height: 40rem;
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
    }

    .result-content {
      display: flex;

      .singe-line {
        display: flex;
        color: #3a3a3a;
        font-size: 24rem;
        font-weight: 500;
        margin-top: 24rem;
        width: 100%;

        .left-div {
          display: flex;
          align-items: start;
          max-width: 30%;

          .left-img {
            width: 25rem;
            height: 25rem;
            margin-right: 8rem;
            margin-top: 6rem;
          }
        }

        .right-div {
          max-width: 70% !important;
          word-wrap: break-word;
        }
      }

      .left-content,
      .right-content {
        width: 50%;
      }

      // .right-content {
      // 	display: flex;
      // 	justify-content: center;
      // }

      .content-item {
        display: flex;
        align-items: center;

        // margin-top: 24rem;
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
          justify-content: center;
          // align-items: center;

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
          margin-top: -10rem;

          img {
            position: absolute;
            top: 0;
            left: 0;
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

          .border {
            background: url('../../static/img/bet-numbers.png') no-repeat center;
            background-size: 100%;
            width: 25rem;
            height: 25rem;
            line-height: 27rem;
            position: initial;
            box-sizing: border-box;
            color: #999;
            font-size: 14rem;
          }
        }
      }

      .content-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
    }

    // &:first-of-type{
    // 	border-radius: 0px 0px 16rem 16rem;
    // }
  }

  .more {
    background: #fff;
    padding: 24rem;

    .more-btn {
      box-shadow: rgba(0, 0, 0, 0.1) 0px 8rem 8rem;
      border-radius: 16rem;
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
    padding: 0rem 0rem 36rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rem;
    color: #707070;
  }
}

.result-content2 {
  .singe-line {
    display: flex;
    color: #3a3a3a;
    font-size: 24rem;
    font-weight: 500;
    margin-top: 24rem;
    width: 100%;

    .left-div {
      display: flex;
      align-items: center;
      // max-width: 30%;

      .left-img {
        width: 25rem;
        height: 25rem;
        margin-right: 8rem;
        margin-top: 6rem;
      }
    }

    .right-div {
      max-width: 70% !important;
      word-wrap: break-word;
    }
  }

  .content-item {
    display: flex;
    align-items: center;
    margin-top: 24rem;
    position: relative;

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
    }

    .img-num {
      width: 25rem;
      height: 25rem;
    }

    .open-code {
      position: absolute;
      top: 4rem;
      left: 0;
      width: 25rem;
      font-size: 18rem;
      text-align: center;
      color: #000;
    }

    .border {
      background: url('../../static/img/bet-numbers.png') no-repeat center;
      background-size: 100%;
      width: 25rem;
      height: 25rem;
      line-height: 27rem;
      position: initial;
      box-sizing: border-box;
      color: #999;
      font-size: 14rem;
    }
  }

  .content-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
