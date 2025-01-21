<template>
  <x-page :noFooter="true" :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>
      <div class="head-title" @click="conf.handleOpenGameTypeDialog">
        <span>{{ conf.gameType }}</span>
        <img
          class="arrow-img"
          src="/static/img/type-arrow.png"
          :style="{ 'transform': conf.typeShow ? 'rotate(-180deg)' : 'rotate(0deg)' }"
        />
      </div>
    </template>
    <template #right>
      <div class="right-content">
        <div class="right-text">{{ $t('wallet.balance') }}</div>
        <div class="right-icon">{{ conf.walletMoney }}</div>
      </div>
      <img class="wallet-img" src="/static/img/wallet.webp" />
    </template>
    <div class="page-box">
      <div class="top-content">
        <div class="left-result">
          <div class="open-number" @click="conf.handleOpenResultDialog">
            {{ conf.lastOpenInfo.openExpect || '--' }}
            {{ $t('game.result') }}
            <img
              class="game-down"
              src="/static/img/game-down.png"
              :style="{ 'transform': conf.resultShow ? 'rotate(-180deg)' : 'rotate(0deg)' }"
            />
          </div>
          <div class="open-point">
            <div class="openCodeBox">
              <img class="sum-img" src="/static/img/color-red.webp" />
              <div class="sum-num" v-if="!conf.StopScrolling">{{ conf.pointNum }}</div>
              <div class="sum-num" v-else>{{ conf.ripr(conf.lastOpenInfo.openCode) }}</div>
            </div>
          </div>
        </div>
        <div class="right-box">
          <div class="current-open">{{ conf.currentOpenInfo.openExpect || '--' }}</div>
          <div class="time-box">
            <div class="time-item">{{ conf.hour }}</div>
            <div class="txt">:</div>
            <div class="time-item">{{ conf.minutes }}</div>
            <div class="txt">:</div>
            <div class="time-item">{{ conf.second }}</div>
          </div>
        </div>
        <div class="order-left" @click="conf.handleMyOrderdiv">
          <img class="order-arrow" src="/static/theme/blue/order-arrow-left.png" />
        </div>
      </div>
      <div class="main">
        <div class="tips">
          <template v-if="conf.topdivBtn">
            <span>{{ conf.gameRule.substring(0, 100) }}...</span>
            <span @click="conf.handleRulediv" class="topBtn">{{ $t('SattaKing.Details') }}</span>
          </template>
          <template v-else>
            <div>{{ conf.gameRule }}</div>
            <span v-if="conf.openLockCountdown / 1000 > 1">
              {{ $t('SattaKing.BetClose') + ' ' + conf.openLockCountdown / 1000 + ' ' + $t('SattaKing.seconds') }}
            </span>
            <span v-else>
              {{ $t('SattaKing.BetClose') + ' ' + conf.openLockCountdown / 1000 + ' ' + $t('SattaKing.second') }}
            </span>
            <span @click="conf.handleRulediv" class="topBtn">{{ $t('SattaKing.PackUp') }}</span>
          </template>
        </div>
        <div class="bet-content">
          <div class="btn-list">
            <template v-for="(item, itemIndex) in conf.playTypeArr">
              <div
                class="btn-item"
                :class="{ 'btn-active': conf.typeIndex == item.value }"
                @click="conf.changeType(item)"
              >
                <div>{{ item.name }}</div>
                <div class="odes">1 : {{ parseFloat(item.odds) }}</div>
              </div>
            </template>
          </div>
          <div class="select-box" ref="selectRefs">
            <div>
              <div class="select-list" :class="{ 'number-box': conf.typeIndex == 1, 'number-active': conf.selectShow }">
                <template v-for="(item, itemIndex) in conf.seleceNumArr">
                  <div class="select-item" :class="{ 'disabled': conf.betClose }">
                    <div :class="{ 'select-active': conf.betArr.includes(item) }" @click="conf.changeOdds(item)">
                      <span>{{ item.number }}</span>
                    </div>
                  </div>
                </template>
              </div>
              <div class="show" v-if="conf.typeIndex == 1">
                <VSIcon
                  :class="conf.selectShow ? 'show-icon active' : 'show-icon'"
                  lib="blue"
                  name="arrow-down"
                  :size="32"
                  @click="conf.changeShow"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="footer">
          <div class="bet-input">
            <input
              class="input"
              :placeholder="$t('swapModule.enterAmountTip')"
              v-model.trim="conf.BettingAmount"
              @input="conf.handleEnterBetAmount($event)"
              inputmode="decimal"
              :class="conf.betStr.length <= 0 ? 'bet-input-zero' : ''"
            />
            <div class="money-btn">
              <div class="money-plus" @click="conf.handleBetNumber('reduce')" :class="{ 'disabled': true }">-</div>
              <input
                v-model="conf.BettingNumber"
                inputmode="decimal"
                class="money-num"
                @input="conf.handleInputEnter($event)"
              />
              <div class="money-plus" @click="conf.handleBetNumber('add')">+</div>
            </div>
          </div>
          <div class="bet-select">
            <div class="left-num" style="font-size: 32rem" v-if="!conf.betStr">{{ $t('SattaKing.notes0') }}</div>
            <div class="left-num" v-else>
              <div class="num">
                <div class="num-total">
                  <template v-if="conf.betNum == 1">{{ $t('SattaKing.injection') }}</template>
                  <template v-else>{{ 'Total:' + conf.betNum }}</template>
                  <span v-if="conf.BettingAmount" class="rit">
                    {{ ' Amount:' + conf.coinSymbol + conf.betTotalAmount }}
                  </span>
                </div>
                <div class="num-x">
                  <div v-if="conf.betStr.length > 0" style="width: 100%; overflow-x: scroll">
                    <div class="select-num">
                      <div class="select_item" v-for="item in conf.betStr" :key="item">{{ item }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex items-center">
              <img
                v-if="svalue.configv1['im_open']"
                class="share-img"
                :class="{ 'disabled': !conf.canShare }"
                style="margin-right: 24rem; width: 47rem; height: 35rem"
                src="/static/img/share.png"
                @click="conf.handleClickShare"
              />
            </div>
            <div class="right-btn" :class="{ 'disabled': conf.betClose }" @click="conf.handleBetDataSubmit">
              {{ $t('SattaKing.betMax') }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 游戏类型选择 -->
    <div class="type-box" v-if="conf.typeShow" @click="conf.typeShow = false">
      <div class="type-contnet" @click.stop="">
        <div class="time-list">
          <template v-for="(item, index) in conf.gameTypeArr">
            <div
              class="time-item"
              :class="conf.gameTypeId == item.id ? 'time-active' : ''"
              @click="conf.handleGameChange(item)"
            >
              {{ item.lotteryShowname }}
            </div>
          </template>
        </div>
      </div>
    </div>
    <!-- 结果弹窗 -->
    <div class="result-box" v-if="conf.resultShow" @click="conf.resultShow = false">
      <div class="result-content" @click.stop="">
        <div class="result-title">
          <div>{{ $t('game.drawID') }}</div>
          <div>{{ $t('game.result') }}</div>
          <div>{{ $t('SattaKing.LotteryTime') }}</div>
        </div>
        <div class="result-list">
          <template v-for="(item, index) in conf.resultList" :key="index">
            <div class="result-line">
              <div>{{ item.openExpect }}</div>
              <div>
                <div class="openCodeBox" v-if="item.openCode">
                  <img class="sum-img" src="/static/img/color-red.webp" />
                  <div class="sum-num">{{ item.openCode }}</div>
                </div>
                <div class="openCodeBox" v-else>
                  <div class="sum-num" style="color: #000000e6">{{ '-' }}</div>
                </div>
              </div>

              <div>{{ item.newOpenTime }}</div>
            </div>
          </template>
          <div v-if="conf.resultList.length > 0">
            <div class="more" v-if="!conf.isResultShowMore">
              <div class="more-btn" @click="conf.handleResultMoreMessage">
                <span>{{ $t('game.showMore') }}</span>
                <img src="/static/img/show-more.png" style="width: 20rem; height: 12rem" />
              </div>
            </div>
            <div class="more-not" v-else>{{ $t('user.noMore') }}</div>
          </div>
          <x-no-data v-if="conf.resultList.length == 0"></x-no-data>
        </div>
      </div>
    </div>
    <div class="order-container" :class="{ active: conf.showOrder }">
      <order @close="conf.closeOrder" v-if="conf.showOrder" :lotteryId="conf.lotteryId" ref="orderRefs"></order>
    </div>

    <div v-if="conf.isShowBetInfo">
      <div class="popup-mask"></div>
      <div class="tips-popup" @click="conf.handleCloseBetInfoDialog">
        <div class="bet-win">
          <div class="win-title">{{ $t('game.winBet') }}</div>
          <div class="win-content">
            <div class="win-item">{{ $t('game.expect') }}：{{ conf.currentOpenInfo.openExpect }}</div>
            <div class="win-item">{{ $t('SattaKing.GameType') }}：{{ conf.GameType }}</div>
            <div class="win-item">{{ $t('SattaKing.BettingContent') }}：{{ conf.betStrNum }}</div>
            <div class="win-item">{{ $t('game.amount') }}：{{ conf.betTotalAmount }}</div>
            <div class="win-item">
              {{ $t('game.start') }}：{{ sutil.getTimeFormat(conf.currentOpenInfo.startTime, 1) }}
            </div>
            <div class="win-item">
              {{ $t('game.open') }}：{{ sutil.getTimeFormat(conf.currentOpenInfo.openTime, 1) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import order from './order.vue'
import { ref } from 'vue'
import { index } from './satta'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import stheme from '@/sstore/stheme'

const orderRefs = ref<any>()
const selectRefs = ref<any>()

const conf = index({ orderRefs, selectRefs })
</script>

<style lang="less" scoped>
.head-title {
  font-size: 32rem;
  font-weight: Bold;

  .arrow-img {
    width: 28rem;
    height: 14rem;
    margin-left: 10rem;
    transition: transform 0.3s ease-in-out;
  }
}

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

.page-box {
  display: flex;
  flex-direction: column;
  height: calc(100% - 104rem);
}

.top-content {
  height: 112rem;
  background: #e6f2ff;
  display: flex;
  position: relative;

  .left-result {
    flex: 1;
    padding: 10rem 20rem;
    border-right: 2rem solid rgba(0, 0, 0, 0.08);

    .open-number {
      color: #000;
      font-size: 28rem;
      display: flex;
      align-items: center;

      .game-down {
        width: 24rem;
        height: 12rem;
        margin-left: 10rem;
        transition: transform 0.3s ease-in-out;
      }
    }

    .open-point {
      display: flex;
      justify-content: center;
      padding-right: 120rem;
      margin-top: 6rem;

      div {
        width: 40rem;
        height: 40rem;
        // background: linear-gradient(0deg, #FB0823 85%, #E2061F 100%);
        border-radius: 50%;
        color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
  }

  .right-box {
    width: 50%;

    .current-open {
      width: 100%;
      text-align: center;
      color: #000000e6;
      font-weight: 600;
    }

    .time-box {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;

      .time-item {
        width: 64rem;
        height: 64rem;
        background: #000;
        color: #fff;
        border-radius: 4rem;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 34rem;
      }

      .txt {
        margin: 0 4rem;
      }
    }
  }

  .order-left {
    position: absolute;
    bottom: 0;
    right: 0;
    height: 112rem;
    display: flex;
    align-items: center;

    .order-arrow {
      width: 24rem;
      height: 48rem;
    }
  }
}

.tips {
  font-size: 26rem;
  color: #000;
  padding: 10rem 20rem;
}

.bet-content {
  padding: 10rem 20rem;
  flex: 1;
  display: flex;
  overflow-y: scroll;
  background-color: #ffffff;

  .btn-list {
    overflow-y: scroll;

    .btn-item {
      background: #f6f7fa;
      color: #646464;
      width: 180rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin-bottom: 20rem;
      border-radius: 8rem;
      font-size: 28rem;
      border: 1rem solid rgba(0, 0, 0, 0.08);
      text-align: center;
      padding: 5rem 0rem;

      &.btn-active {
        color: #006fff;
        background: #e6f2ff;
      }

      .odes {
        margin-top: -5rem;
      }
    }
  }

  .select-box {
    flex: 1;
    margin-left: 40rem;
    overflow-y: auto !important;
    text-align: center;
    display: flex;
    flex-direction: column;

    .show {
      height: 60rem;
      display: flex;
      align-items: center;
      justify-content: center;

      .show-icon {
        width: 20rem;
        height: 32rem;
        transition: 0.5s;
      }

      .show-icon.active {
        transform: rotate(180deg);
      }

      margin-bottom: 20rem;
    }

    .select-list {
      display: flex;
      flex-wrap: wrap;
      // height: 1670rem;
      transition: 0.5s;
      overflow: hidden;

      .select-item {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 20%;
        margin-bottom: 20rem;

        div {
          width: 60rem;
          height: 60rem;
          flex-shrink: 0;
          background: linear-gradient(142.21deg, #dfedff 14.37%, #9ec9ff 88.03%);
          box-shadow: 0rem 0rem 4.28rem 0rem #ffffff40 inset;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          // color: #F5843F;
          font-size: 32rem;
          font-weight: 700;

          span {
            background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
            background-clip: text !important;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          &.select-active {
            background: linear-gradient(0deg, #fb0823 85%, #e2061f 100%);
            box-shadow: 0rem 4rem 12rem rgba(0, 0, 0, 0.4);

            span {
              background: #fff;
              background-clip: text !important;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
          }
        }
      }
    }

    .arrow-down {
      position: relative;
      width: 0;
      height: 0;
      border-left: 50rem solid transparent;
      border-right: 50rem solid transparent;
      border-top: 100rem solid black;
      /* 改变颜色可以改变箭头颜色 */
    }

    .arrow-down:after {
      content: '';
      position: absolute;
      left: -100rem;
      top: -200rem;
      width: 0;
      height: 0;
      border-left: 100rem solid transparent;
      border-right: 100rem solid transparent;
      border-top: 180rem solid white;
      /* 改变颜色可以改变箭头背景颜色 */
    }
  }
}

.number-box {
  height: 59%;
}

.number-active {
  height: 100% !important;
}

.footer {
  // position: fixed;
  // bottom: 0;
  // left: 0;
  // right: 0;
  position: relative;
  width: 100%;
  background: #f6f7fa;
  max-width: 750rem;
  margin: 0 auto;
  flex-shrink: 0;

  .bet-input {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100rem;
    padding: 15rem 16rem;

    // input::placeholder {
    // 	font-size: 20rem;
    // }

    .bet-input-zero {
      .uni-input-placeholder {
        color: #aeaeae;
      }
    }

    .input {
      background: #fff;
      height: 100%;
      font-size: 30rem;
      width: 350rem;
      padding: 0 20rem;
    }

    .money-btn {
      display: flex;
      background: #fff;
      border: 1rem solid rgba(0, 0, 0, 0.08);
      height: 100%;
      font-size: 28rem;

      .money-plus {
        width: 70rem;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 32rem;
      }

      .money-num {
        text-align: center;
        width: 100rem;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        border-left: 1rem solid rgba(0, 0, 0, 0.08);
        border-right: 1rem solid rgba(0, 0, 0, 0.08);
      }
    }
  }

  .bet-select {
    height: 110rem;
    background: #e6f2ff;
    display: flex;
    justify-content: space-between;
    border-top: 1rem solid rgba(0, 0, 0, 0.08);

    .left-num {
      flex: 1;
      display: flex;
      align-items: center;
      color: #dc3b40;
      padding: 0 16rem;
      width: 67%;
      overflow: hidden;

      .num-x {
        width: 100%;
        position: relative;
        height: 46rem;
        z-index: 2;
        overflow: hidden;
        // background-color: greenyellow;

        // box-shadow: inset -20rem 0 20rem -20rem rgba(18, 21, 38, 0.3);
        .scorll-num-width {
          width: 90%;
        }

        .shadow {
          width: 42rem;
          // opacity: 0;
          height: 100%;
          background-color: #fff1ce;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: -15rem 0 10rem -2rem rgba(0, 0, 0, 0.4);

          position: absolute;
          right: 0rem;
          top: 0;
          z-index: 1;
        }
      }

      .shadow-imgs {
        width: 18rem;
        height: 18rem;
      }

      .add {
        font-size: 46rem;
      }

      .num {
        font-size: 28rem;
        margin-left: 8rem;
        color: #dc3b40;
        font-weight: bold;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        width: calc(100% - 8rem);

        .select-num {
          font-size: 26rem;
          // width: 360rem;
          height: 46rem;
          display: flex;
          align-items: center;

          .select_item {
            width: 36rem;
            height: 36rem;
            line-height: 36rem;
            background-color: #fb0823;
            color: #fff;
            margin-right: 12rem;
            border-radius: 50%;
            font-size: 20rem;
            font-weight: initial;
            text-align: center;
            flex-shrink: 0;
          }
        }

        .num-total {
          display: flex;
          justify-content: start;
          font-size: 24rem;
          align-items: end;

          .rit {
            margin-left: 20rem;
          }
        }
      }
    }

    .right-btn {
      background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
      width: 270rem;
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 35rem;
      flex-shrink: 0;
    }
  }
}

.type-box {
  position: fixed;
  top: 104rem;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.5);
  max-width: 750rem;
  margin: 0 auto;

  .type-contnet {
    width: 100%;
    background: #fff;

    .time-list {
      // border-top: 1rem solid #eee;
      display: flex;
      flex-wrap: wrap;
      padding: 30rem 16rem 0rem;
      font-size: 27rem;

      .time-item {
        width: 22%;
        height: 50rem;
        background: #f6f7fa;
        color: #646464;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 4%;
        margin-bottom: 30rem;
        border-radius: 6rem;

        &:nth-child(4n + 4) {
          margin-right: 0;
        }

        &.time-active {
          background: #e6f2ff;
          color: #006fff;
        }
      }
    }
  }
}

.result-box {
  position: fixed;
  top: 103rem;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.5);
  max-width: 750rem;
  margin: 0 auto;

  .result-content {
    background: #fff;

    .result-title {
      display: flex;
      // justify-content: space-between;
      // align-items: center;
      padding: 0 20rem;
      height: 100rem;
      line-height: 100rem;
      text-align: center;
    }

    .result-title div:nth-child(1) {
      width: 25%;
    }

    .result-title div:nth-child(2) {
      width: 25%;
    }

    .result-title div:nth-child(3) {
      width: 50%;
    }

    .result-list {
      max-height: 65vh;
      overflow-y: auto;

      .result-line {
        display: flex;
        padding: 30rem 20rem;
        text-align: center;

        div:nth-child(1) {
          width: 25%;
        }

        div:nth-child(2) {
          width: 25%;
          display: flex;
          justify-content: center;
        }

        div:nth-child(3) {
          width: 50%;
        }

        &:nth-child(2n + 1) {
          background: #e6f2ff;
        }
      }

      .More {
        height: 100rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32rem;
        background: linear-gradient(#eb602d, #ffa64f);
        /*设置渐变的方向从左到右 颜色从ff0000到ffff00*/
        background-clip: text !important;
        -webkit-background-clip: text;
        /*将设置的背景颜色限制在文字中*/
        -webkit-text-fill-color: transparent;
        /*给文字设置成透明*/
      }
    }
  }
}

.more {
  background: #fff;
  padding: 24rem;

  .more-btn {
    box-shadow: rgba(0, 0, 0, 0.1) 0rem 1.06667vw 1.06667vw;
    border-radius: 2.13333vw;
    height: 78rem;
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      margin-right: 20rem;
      font-size: 24rem;
      font-weight: 700;
    }
  }
}

.more-not {
  padding: 24rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rem;
  color: #707070;
  text-align: center !important;
}

.order-container {
  position: absolute;
  top: 0;
  right: -100%;
  /* 初始时隐藏弹窗 */
  height: 100%;
  width: 100%;
  background-color: #fff;
  z-index: 998;
  transition: right 0.3s ease;

  &.active {
    right: 0;
    /* 显示弹窗 */
  }
}

.modal-content {
  padding: 40rem;
}

.disabled {
  filter: grayscale(1) !important;
  -webkit-filter: grayscale(1) !important;
}

.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  // z-index: 997;
  background: rgba(0, 0, 0, 0.3);
}

.tips-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 998;

  .bet-win {
    width: 600rem;
    height: 152rem;
    border-radius: 20rem;
    background: #fff;
    box-shadow:
      20rem 20rem 40rem 0rem rgba(255, 255, 255, 0.25),
      -20rem -20rem 40rem 0rem rgba(255, 255, 255, 0.25);
    color: #000;
    font-weight: 500;
    font-size: 40rem;
    overflow: hidden;
    animation: colorBtn 1s forwards;

    .win-title {
      height: 152rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .win-content {
      font-size: 30rem;
      padding-left: 40rem;

      .win-item {
        margin-bottom: 8rem;
      }
    }
  }

  @keyframes colorBtn {
    0% {
      height: 152rem;
    }

    100% {
      height: 572rem;
    }
  }
}

.main {
  overflow-y: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.topBtn {
  color: #006fff !important;
  margin-left: 18rem;
}

.openCodeBox {
  width: 50rem !important;
  height: 50rem !important;
  position: relative;

  .sum-img {
    width: 100%;
    height: 100%;
  }

  .sum-num {
    position: absolute;
    top: 0rem;
    bottom: 0rem;
    width: 100% !important;
    height: 50rem !important;
    line-height: 50rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rem;
    color: #fff;
  }
}

.type-list {
  display: flex;
  height: 60rem;
  background: #fff6e6;
  color: #000000;
  font-weight: bold;
  border-radius: 10rem;

  .type-item {
    text-align: center;
    width: 20rem;
    flex-shrink: 0;
    line-height: 60rem;
  }

  .type-active {
    border-radius: 10rem;
    background: #ffa64f;
    color: #fff;
  }
}

.share-img {
  &.disabled {
    pointer-events: none;
    filter: grayscale(1);
  }
}
</style>
