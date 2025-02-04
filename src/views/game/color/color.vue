<template>
  <GameLayout :showTips="true" title="Color" :code="conf.gameType" :lottery="lottery" :ref="conf.layout.setRef"
    @reset="conf.betting.popup.close">
    <div class="game">
      <div class="game-title">
        <div class="minute">{{ lottery.play.item.timeType }} {{ lottery.play.item.timeName }}</div>
        <div class="result">{{ lottery.lastissue }} {{ $t('game.result') }}:</div>
      </div>
      <div class="game-banner">
        <game-loop :swipeList="conf.loop.bannerList" :target-swipe="conf.loop.openCode[0]"
          :autoplay="conf.loop.autoplay">
          <template v-slot="{ item }">
            <div class="swiper">
              <div class="banner-item">
                <img class="img" :src="item.src" />
                <div class="num">{{ item.num }}</div>
              </div>
            </div>
          </template>
        </game-loop>
      </div>
    </div>
    <!-- 功能控制 -->
    <div class="category" v-scroll :class="{ 'betCategory': conf.operation.active === 'betting' }">
      <div v-for="item in conf.operation.list" :key="item.value" @click="conf.operation.change(item)">
        <span :class="{ 'category-active': item.value === conf.operation.active }">{{ item.label }}</span>
      </div>
    </div>
    <!-- 内容区 -->
    <div class="col" style="overflow-y: scroll;" ref="scrollRef"
      :style="{ background: conf.operation.active === 'betting' ? '#A6B4BD' : '#f5f5fa' }">
      <div class="betting" v-if="conf.operation.active === 'betting'">
        <img class="box-top" src="/static/img/box-top.png" />
        <div class="time-tabs" v-if="lottery.play.list.length">
          <div style="overflow-x: scroll" ref="tabsRefs" v-scroll>
            <div class="tabs-list">
              <template v-for="(item, index) in lottery.play.list" :key="index">
                <div class="tab-item" :class="{ 'tab-active': item.id === lottery.play.item.id }"
                  @click="lottery.play.change(`/game/Color/Color`, item)">
                  <div class="item-content">
                    <span>{{ item.timeType }}</span>
                    {{ item.timeName }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
        <div style="padding: 0rem 20rem">
          <div class="reckon-box">
            <img class="box-1" src="/static/img/box-1.png" />
            <div class="reckon-container">
              <div class="current-time">
                <div class="time-num">
                  <div class="num-item">{{ lottery.countDown[0] }}</div>
                  <span>:</span>
                  <!-- <div class="num-item">{{ lottery.countDown[1] }}</div> -->
                  <downTime :w="100" :h="100" :value="lottery.countDown[1]" />
                  <span>:</span>
                  <downTime :w="100" :h="100" :value="lottery.countDown[2]" />
                  <!-- <div class="num-item">{{ lottery.countDown[2] }}</div> -->
                </div>
              </div>
              <div class="current-expect">
                <div class="expect-status">
                  <div class="periods">{{ lottery.issue }}</div>
                  <div class="status">
                    {{ lottery.countDown[3] <= lottery.play.item.openLockCountdown ? $t('game.pauseBetting') :
                      $t('game.betting') + '...' }} </div>
                  </div>
                </div>
                <div class="bar">
                  <div class="bar-active"
                    :style="{ width: `${(lottery.countDown[3] / (lottery.play.item.lotteryInterval / 1000)) * 100}%` }">
                  </div>
                </div>
                <div class="scale">
                  <div class="scale-list"
                    :class="{ 'disabled': lottery.countDown[3] <= lottery.play.item.openLockCountdown }">
                    <template v-for="item in conf.betting.tabs.list[0].sizeList">
                      <div class="scale-item" @click="conf.betting.popup.open(item, 1)">
                        <div class="bg-color" :class="[item.isActive ? 'colorBtn' : '', item.color ? item.color : '']">
                          <div class="color-name">{{ item.name }}</div>
                          <div class="color-num">1:{{ conf.betting.oddsInfo[item.oddsCode] || 1 }}</div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            <div class="circle-btn">
              <img class="robot-center" src="/static/img/robot-center.png" />
              <div class="btn-list-box">
                <div class="btn-list"
                  :class="{ 'disabled': lottery.countDown[3] <= lottery.play.item.openLockCountdown }">
                  <template v-for="item in conf.betting.tabs.list[0].numList">
                    <div class="btn-item" @click="conf.betting.popup.open(item, 2)">
                      <div class="btn-bg" :class="[item.isActive ? 'colorBtn' : '', item.color ? item.color : '']">{{
                        item.name }}</div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <div class="bottom-container">
              <div class="bottom-title">
                <div class="parting-line"></div>
                <span>MY BETS</span>
                <div class="parting-line"></div>
              </div>
              <div class="bottom-roller">
                <div class="printer-box" v-if="conf.betting.selectBetList.length">
                  <div class="printer-top"></div>
                  <div class="printer1">
                    <template v-for="(item, index) in conf.betting.selectBetList" :key="index">
                      <div class="dashed" :style="{ marginTop: index == 0 ? '56rem' : '0rem' }"></div>
                      <div class="printer-open">
                        <div class="printer-back">
                          <img class="printer-img" src="/static/img/printer-left.png" />
                          <div class="back-title">color</div>
                          <img class="printer-img" src="/static/img/printer-right.png" />
                        </div>
                        <div class="printer-content">
                          <div class="printer-expect">{{ item.openExpect }}</div>
                          <div class="open-content">
                            <div class="code">
                              <div class="open-item">{{ $t('game.BettingCode') }}：{{ item.betNum }}</div>
                              <div class="open-item">{{ $t('chat.type') }}：color</div>
                            </div>
                            <div class="open-item">{{ $t('game.amount') }}：{{ item.money }}</div>
                            <div class="open-item">{{ $t('game.start') }}：{{ sutil.getTimeFormat(item.startTime) }}
                            </div>
                            <div class="open-item">{{ $t('game.open') }}：{{ sutil.getTimeFormat(item.openTime) }}</div>
                          </div>
                        </div>
                      </div>
                    </template>
                    <div id="last-msg-item" style="height: 1rem"></div>
                  </div>
                </div>
                <img class="roll-bottom" src="/static/img/roll-bottom.png" />
              </div>
            </div>
          </div>
        </div>
        <rule v-if="conf.operation.active === 'rule'" :list="lottery.play.item.lotteryRuleurl" />
        <result ref="resultRefs" v-if="conf.operation.active === 'result'" :lottery="lottery" />
        <order ref="orderRefs" v-if="conf.operation.active === 'myOrder'" :lotteryId="lottery.play.item.id"	:lotteryOdds="conf.betting.oddsArr"></order>
      </div>
      <time-popup @close="conf.loop.timePopupShop = false" v-if="conf.loop.timePopupShop"></time-popup>
  </GameLayout>
</template>
  <script setup lang="ts">
  import { ref } from 'vue'
  import GameLayout from '../components/gameLayout.vue'
  import timePopup from '../components/timePopup.vue'
  import gameLoop from '../components/gameLoop.vue'
  import rule from '../components/gameRule.vue'
  import result from './com/result.vue'
  import order from './com/order.vue'
  import downTime from '../components/aniDownTime.vue';
  import { index } from './color'
  import sutil from '@/sstore/sutil'

  const { conf, lottery, scrollRef, tabsRefs, resultRefs, orderRefs } = index()
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

  .tip {
    display: flex;
    align-items: center;
    padding: 0rem 24rem;
    height: 80rem;
    background: #fff9ed;
    width: 100%;

    .tip-icon {
      width: 32rem;
      height: 32rem;
      margin-right: 16rem;
      flex-shrink: 0;
    }

    .tip-content {
      font-size: 26rem;
      color: #45454d;
      font-weight: 500;
      display: inline-block;
      white-space: nowrap;
      animation: u-loop-animation 20s linear infinite both;
      text-align: right;
      // 这一句很重要，为了能让滚动左右连接起来
      padding-left: 100%;
      flex-wrap: nowrap;
    }

    @keyframes u-loop-animation {
      0% {
        transform: translate3d(0, 0, 0);
      }

      100% {
        transform: translate3d(-100%, 0, 0);
      }
    }
  }

  .game {
    padding: 24rem 40rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fffef8;
    width: 100%;

    .game-title {
      font-weight: bold;

      .minute {
        font-size: 32rem;
      }

      .result {
        // margin-top: 6rem;
        font-size: 24rem;
      }
    }

    .game-banner {
      flex: 1;
      background: #b0aea0;
      border-radius: 12rem;
      margin-left: 60rem;
      height: 75rem;

      .swiper {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
      }

      .banner-item {
        position: relative;
        width: 64rem;
        height: 64rem;

        .img {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 100%;
        }

        .num {
          position: absolute;
          top: 0rem;
          bottom: 0rem;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32rem;
          color: #fff;
        }
      }
    }
  }

  .category {
    height: 120rem;
    background: #ffffff;
    background: linear-gradient(180deg, #fff 0%, #edeff5 100%);
    padding: 0rem 20rem 10rem;
    // border-bottom: 3rem solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &.betCategory {
      background: linear-gradient(180deg, #cbd5dd 0%, #dae4ea 100%);
    }

    div {
      font-size: 28rem;
      font-weight: 500;
      color: #45454d;
      // flex: 1;
      padding: 0rem 24rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .category-active {
      position: relative;
      height: 100%;
      color: #252529;
      font-weight: 700;
      line-height: 72rem;
      display: inline-block;
    }

    .category-active::after {
      position: absolute;
      content: '';
      width: 50%;
      height: 8rem;
      background: #d90000;
      bottom: 5rem;
      left: 25%;
    }
  }

  .betting {
    background: #a6b4bd;
    padding-bottom: 300rem;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0rem 10rem;
    width: 100%;

    .box-top {
      width: 100%;
      height: 24rem;
      margin-top: 15rem;
    }

    .time-tabs {
      // background: linear-gradient(180deg,#D1DBE2 0%,#B0BFC7 100%);
      background: linear-gradient(180deg, #d0dae1 0%, #b2c0c8 100%);
      padding: 12rem 40rem;
      border-top: 2rem solid #f3f3f3;

      .tabs-list {
        display: flex;
        // overflow-x: auto;
        align-items: flex-end;

        .tab-item {
          // background: #FFF;
          background: #becbd2;
          box-shadow:
            4rem 4rem 7.6rem 0rem rgba(0, 0, 0, 0.1),
            -8rem -8rem 7.6rem 0rem rgba(255, 255, 255, 0.2);
          border-radius: 8rem;
          height: 84rem;
          padding: 0rem 24rem;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-left: 8rem;

          .item-content {
            display: flex;
            align-items: center;
            font-size: 24rem;
            font-weight: 700;
            color: #000;

            span {
              margin-right: 16rem;
              font-size: 40rem;
              font-weight: bold;
            }
          }

          &.tab-active {
            border-top: 4rem solid #a6b4bd;
            background: #d8e3e8;
            box-shadow:
              4rem 4rem 7.6rem 0rem rgba(0, 0, 0, 0.1) inset,
              -4rem -4rem 7.6rem 0rem rgba(255, 255, 255, 0.2) inset;
          }
        }
      }
    }

    .reckon-box {
      padding: 0rem 42rem;
      margin-top: 16rem;
      display: flex;
      flex-direction: column;

      .box-1 {
        width: 100%;
        height: 22rem;
      }

      .reckon-container {
        background: linear-gradient(180deg, #d1dbe2 0%, #b0bfc7 100%);

        .current-time {
          display: flex;
          align-content: center;
          justify-content: center;

          .time-num {
            display: flex;
            align-items: center;
            margin: 28rem 0rem 22rem;
            font-size: 66rem;

            .num-item {
              width: 100rem;
              height: 100rem;
              font-size: 66rem;
              background: #000;
              color: #fff;
              border-radius: 8rem;
              display: flex;
              justify-content: center;
              align-items: center;
            }

            span {
              color: #45454d;
              font-weight: 700;
              margin: 0rem 5rem;
            }
          }
        }

        .current-expect {
          margin: 0rem 90rem 16rem;

          .expect-status {
            display: flex;
            justify-content: center;
            border-radius: 10rem;
            background: #677a84;
            box-shadow:
              4rem 4rem 8rem 0rem rgba(0, 0, 0, 0.25) inset,
              -4rem -4rem 8rem 0rem rgba(255, 255, 255, 0.1) inset;
            padding: 14rem 0rem;
            color: #fff;
            font-size: 26rem;
            font-weight: 600;

            .status {
              margin-left: 10rem;
            }
          }
        }

        .bar {
          height: 12rem;
          background: #8998a1;

          .bar-active {
            height: 100%;
            background: #d90000;
          }
        }

        .scale {
          background: #c8d2d8;
          height: 174rem;
          padding: 0rem 24rem;

          .scale-list {
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 100%;

            .scale-item {
              height: 104rem;
              flex: 1;
              border-radius: 16rem;
              background: #a2b0ba;
              box-shadow:
                0 4rem 4rem #00000040 inset,
                0 2rem #ffffff40;
              margin-right: 14rem;
              padding: 0rem 10rem;

              .bg-color {
                border: 2rem solid rgba(255, 255, 255, 0.22);
                background: linear-gradient(180deg, #32c94a 0%, #1d9f32 100%);
                box-shadow: 0 12rem #18982c;
                border-radius: 16rem;
                font-size: 28rem;
                color: #fff;
                height: 87rem;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                margin-top: -8rem;

                .color-num {
                  margin-top: 4rem;
                }
              }

              .color-purple {
                border: 2rem solid rgba(255, 255, 255, 0.29);
                background: linear-gradient(180deg, #9154ea 0%, #7027d6 100%);
                box-shadow: 0 12rem #7922e7;
              }

              .color-red {
                border: 2rem solid rgba(255, 255, 255, 0.26);
                background: linear-gradient(180deg, #d90029 0%, #be0505 100%);
                box-shadow: 0 12rem #bb1212;
              }
            }
          }
        }
      }
    }

    .circle-btn {
      height: 276rem;
      position: relative;

      .robot-center {
        width: 100%;
        height: 100%;
      }

      .btn-list-box {
        position: absolute;
        top: 24rem;
        bottom: 0rem;
        left: 56rem;
        right: 56rem;

        .btn-list {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;

          .btn-item {
            width: 16.5%;
            height: 90rem;
            border-radius: 50%;
            background: #a2b0ba;
            // margin-right: 16rem;
            margin-bottom: 14rem;
            display: flex;
            justify-content: center;

            .btn-bg {
              border: 2rem solid rgba(255, 255, 255, 0.26);
              background: linear-gradient(180deg, #d90029 0%, #cb0b0b 51.5%, #9154ea 53.59%, #7027d6 100%);
              box-shadow: 0 12rem #4e00b1;
              width: 80%;
              height: 72rem;
              border-radius: 50%;
              font-size: 36rem;
              font-weight: bold;
              display: flex;
              justify-content: center;
              align-items: center;
              color: #fff;
            }

            .color-5 {
              background: linear-gradient(180deg, #32c94a 0%, #1d9f32 51%, #9154ea 50%, #7027d6 100%);
              box-shadow: 0 12rem #4e00b1;
            }

            .color-green {
              // background: linear-gradient(180deg,#007D14 0%,#009919 100%);
              background: linear-gradient(180deg, #35d14e 0%, #19992e 100%);
              box-shadow: 0 12rem #18972c;
            }

            .color-bule {
              background: linear-gradient(180deg, #27b2f6 0%, #0080c7 100%);
              box-shadow: 0 12rem #0080c7;
              font-size: 18rem;
            }

            .color-big {
              font-size: 28rem;
              border: 2rem solid rgba(255, 255, 255, 0.26);
              background: linear-gradient(180deg, #ea6332 0%, #eb602d 100%);
              box-shadow: 0 12rem #d4572a;
            }

            .color-red {
              background: linear-gradient(180deg, #d90029 0%, #be0505 100%);
              box-shadow: 0 12rem #bb1212;
            }
          }
        }
      }
    }

    .disabled {
      filter: grayscale(1);
    }

    .colorBtn {
      color: red;
      animation: colorBtn 0.3s forwards;
    }

    @keyframes colorBtn {
      0% {
        margin-top: 0rem;
        box-shadow: 0 12rem #a2b0ba;
      }

      100% {
        box-shadow: 0 0rem #a2b0ba;
        margin-top: 12rem;
      }
    }

    .bottom-container {
      height: 245rem;
      background: #b5c3cb;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      .bottom-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 672rem;

        span {
          font-size: 26rem;
          margin: 0rem 64rem;
        }

        .parting-line {
          flex: 1;
          height: 26rem;
          background: url('/static/img/parting-line.png') no-repeat 100%/100%;
        }
      }

      .bottom-roller {
        width: 622rem;
        height: 128rem;
        border-radius: 15rem;
        background: linear-gradient(180deg, #4b5961 0%, #80929c 100%);
        box-shadow: -2rem 4rem #ffffff40;
        margin-top: 26rem;
        position: relative;

        // overflow: hidden;
        .printer-box {
          position: relative;
          top: 20rem;
          margin-bottom: 20rem;
          // overflow: hidden;
          // height: 576rem;
          z-index: 7;

          .printer-top {
            position: absolute;
            left: 14rem;
            right: 14rem;
            z-index: 9;
            top: 0rem;
            height: 20rem;
            border-radius: 42rem;
            background: linear-gradient(180deg, #b5c3cb 0%, #5a6b73 100%);
          }

          .printer1 {
            // width: 100%;
            background: #fffef8;
            border-radius: 10rem;
            position: absolute;
            left: 30rem;
            right: 30rem;
            top: 0rem;
            // animation: progress 2s forwards;
            // transition: height 2s;

            .dashed {
              width: 100%;
              border: 2rem dashed #62737b;
              // margin-top: 56rem;
            }

            .printer-open {
              height: 320rem;
              position: relative;
              left: 0;
              right: 0;
              background: #fffef8;
              border-radius: 10rem;

              .printer-back {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 10rem;

                .printer-img {
                  width: 66rem;
                  height: 100%;
                  border-radius: 42rem;
                  border-radius: 10rem;
                }

                .back-title {
                  color: #e20000;
                  font-weight: 600;
                  font-family: PingFang SC;
                  font-size: 150rem;
                  opacity: 0.1;
                }
              }

              .printer-content {
                position: absolute;
                top: 0;
                right: 0;
                left: 0;
                bottom: 0;

                .printer-expect {
                  text-align: center;
                  color: #000;
                  font-size: 32rem;
                  font-weight: 600;
                  margin-top: 16rem;
                }

                .open-content {
                  color: #000;
                  font-size: 24rem;
                  font-weight: 400;
                  padding: 0rem 40rem;

                  .code {
                    display: flex;
                    justify-content: space-between;
                  }

                  .open-item {
                    margin-top: 25rem;
                  }
                }
              }
            }
          }

          // .printer-open{
          // 	animation: progress 2s forwards;
          // }
          @keyframes progress {
            0% {
              top: -376rem;
            }

            100% {
              top: 0rem;
            }
          }
        }

        .roll-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 46rem;
          width: 100%;
        }
      }
    }

    .bottom-container-line {
      height: 24rem;
      width: 100%;
      border-top: 2rem solid rgba(255, 255, 255, 0.65);
      background: linear-gradient(180deg, #acc3d1 0%, #96a6b0 100%);
    }
  }
</style>