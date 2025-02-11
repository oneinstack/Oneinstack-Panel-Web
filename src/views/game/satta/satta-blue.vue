<template>
    <GameLayout title="3DLottery" code="SATTA_KING" :lottery="lottery" :ref="conf.layout.setRef"
        @reset="conf.betting.popup.close">
        <div class="time-box">
            <div class="time-outer">
                <div class="time-content">
                    <div class="square-list">
                        <div class="square" v-for="item in 7" :key="item"></div>
                    </div>
                    <span>{{ $t('game.timeBig') }}</span>
                    <div class="square-list">
                        <div class="square" v-for="item in 7" :key="item"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="incline">
            <img class="incline-img" src="/static/theme/blue/incline.png" />
        </div>
        <div class="content-box">
            <div class="time-nav">
                <div style="overflow-x: scroll;" v-scroll>
                    <div class="time-list">
                        <div v-for="(item, index) in lottery.play.list" :key="index" class="time-item"
                            :class="{ 'time-active': item.id === lottery.play.item.id }"
                            @click="lottery.play.change(`/game/Satta/Satta`, item)">
                            <div>{{ item.lotteryShowname }}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="share-box">
                <div class="share-list">
                    <div class="share-item" style="flex: 1;">
                        <div class="item-title">{{ $t('game.drawingTime') + ':' + lottery.issue }}</div>
                        <div class="reckon-time">
                            <div class="time-bar">
                                <div class="time-num">
                                    <downTime :value="lottery.countDown[0]" />
                                    <span>:</span>
                                    <downTime :value="lottery.countDown[1]" />
                                    <span>:</span>
                                    <downTime :value="lottery.countDown[2]" />
                                </div>
                                <div class="bar">
                                    <div class="bar-active"
                                        :style="{ width: `${(lottery.countDown[3] / (lottery.play.item.lotteryInterval / 1000)) * 100}%` }">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="divider-h"></div>
                    <div class="share-item">
                        <div class="item-title">{{ $t('game.resultFor') }}:20250116</div>
                        <div style="display: flex;justify-content: flex-end;margin-top: 16rem;">
                            <div class="item-random">
                                <div class="adbanner">
                                    <game-loop :swipeList="conf.loop.numList" :target-swipe="conf.loop.openCode"
                                        :autoplay="conf.loop.autoplay">
                                        <template v-slot="{ item }">
                                            <div class="total-swiper">
                                                <img class="total-img" src="/static/img/color-red.webp" />
                                                <div class="total-point">{{ item.number }}</div>
                                            </div>
                                        </template>
                                    </game-loop>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 功能控制 -->
            <div class="row items-center no-wrap operation-box" v-scroll>
                <div class="type-item flex flex-center relative text-no-wrap" v-for="item in conf.operation.list"
                    :key="item.value" :class="{ active: item.value === conf.operation.active }"
                    @click="conf.operation.change(item)">
                    {{ item.label }}
                </div>
            </div>
            <!-- Betting 一二级 -->
            <bettingtabs :bg="['#087BFF','#0645D9']" v-if="conf.operation.active === 'betting'" />
        </div>
        <!-- 内容区 -->
        <div class="col" style="overflow: auto;" ref="cRefs"
            :class="{ 'active-bg': conf.operation.active === 'betting' }">
            <!-- 下注区和处理下注 -->
            <betting @changeBet="conf.betting.popup.open" :key="conf.betting.tabs.item.name"
                v-if="conf.operation.active === 'betting'" />

            <result :bg="['#58A5FF','#E6F2FF']" v-if="conf.operation.active === 'result'" :resultList="conf.his.result.list" :isTips="conf.page.isTips" @change="conf.page.nextPage" />

            <order v-if="conf.operation.active === 'myOrder'"  :resultList="conf.his.order.list" :isTips="conf.page.isTips" @change="conf.page.nextPage" />

            <template v-if="conf.operation.active === 'rule'">
                <div style="padding: 20rem 48rem" v-html="conf.betting.tabs.item.rule"></div>
            </template>
        </div>
        <!-- 下注弹窗内容 -->
        <template #bet>
            <div style="width: 100%;display: flex;justify-content: center;" v-scroll>
                <div style="display: flex;align-items: center;" v-scroll>
                    <template v-for="item in conf.betting.betList" :key="item.oddsCode">
                        <div class="txt-box">
                            <img class="txt-img" src="/static/img/color-red.webp" />
                            <div class="txt-point">{{ item.number }}</div>
                        </div>
                    </template>
                </div>
                <img class="arrow-img" v-show="conf.betting.betList.length > 7" src="/static/img/double-arrow.png" />
            </div>
        </template>
         <!-- 下注弹窗信息 -->
         <div v-if="conf.betting.betShow">
            <div class="popup-mask"></div>
            <div class="tips-popup" @click="conf.betting.betShow = false">
                <div class="bet-win">
                    <div class="win-title">{{ $t('game.winBet') }}</div>
                    <div class="win-content">
                        <div class="win-item">{{ $t('game.expect') }}：{{ lottery.current.openExpect }}</div>
                        <div class="win-item">{{ $t('SattaKing.GameType') }}：{{ conf.betting.typeTitle }}</div>
                        <div class="win-item">{{ $t('SattaKing.BettingContent') }}：{{ lottery.bet.content.map((v: any)=>v.number).join(',') }}</div>
                        <div class="win-item">{{ $t('game.amount') }}：{{ lottery.bet.money }}</div>
                        <div class="win-item">
                            {{ $t('game.start') }}：{{ sutil.getTimeFormat(lottery.current.startTime, 1) }}
                        </div>
                        <div class="win-item">
                            {{ $t('game.open') }}：{{ sutil.getTimeFormat(lottery.current.openTime, 1) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </GameLayout>
</template>
<script setup lang="ts">
import GameLayout from '../components/gameLayout-blue.vue'
import bettingtabs from './components/betting/tabs.vue'
import betting from './components/betting/index-blue.vue'
import gameLoop from '../components/gameLoop.vue';
import result from './components/result.vue'
import order from './components/order.vue'
import downTime from '../components/aniDownTime.vue';
import sutil from '@/sstore/sutil'

import { index } from './satta'
const { conf, lottery, cRefs } = index()
</script>
<style lang="less" scoped>
.time-box {
    height: 100rem;
    padding: 5rem 10rem 0rem;
    position: relative;
    bottom: -5rem;

    .time-outer {
        padding: 10rem 12rem;
        background: linear-gradient(89.96deg, #a4caff .49%, #7af 99.97%);
        height: 100%;
        border-radius: 20rem;

        .time-content {
            height: 100%;
            background: linear-gradient(89.96deg, #A4CAFF 0.49%, #77AAFF 99.97%);
            border-radius: 20rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20rem;

            .time-img {
                height: 8rem;
                width: 80rem;
            }

            .square-list {
                display: flex;

                .square {
                    width: 8rem;
                    height: 8rem;
                    border-radius: 50%;
                    background: #0A45CF;
                    margin-right: 4rem;

                    &:last-of-type {
                        margin-right: 0rem;
                    }
                }
            }

            span {
                background: linear-gradient(112.71deg, #296AED 4.28%, #0A45CF 67.56%);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
				background-clip: text;
				font-size: 40rem;
				font-weight: 600;
            }
        }
    }
}

.incline {
    height: 28rem;
    width: 100%;

    .incline-img {
        width: 100%;
        height: 28rem;
    }

    border-bottom: 2rem solid #FFECD3;
}

.content-box {
    background: linear-gradient(116.01deg, #C0DCFF 9.5%, #68A2FF 100.92%) !important;
    padding: 0 24rem 20rem;
}

.time-nav {
    padding: 20rem 0rem;

    .time-list {
        display: flex;
        height: 90rem;

        .time-item {
            background: #FFF;
            box-shadow: 4rem 4rem 8rem 0rem rgba(0, 0, 0, 0.10), -8rem -8rem 8rem 0rem rgba(255, 255, 255, 0.20);

            border-radius: 8rem;
            font-size: 29rem;
            color: #252529;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            // flex: 1;
            width: 23.8%;
            margin-left: 1.2%;
            flex-shrink: 0;

            &:first-of-type {
                margin-left: 0rem;
            }

            .word {
                font-size: 24rem;
                color: #5f6975;
                margin-left: 16rem;
            }

            &.time-active {
                border-top: 0.8vw solid #296AED;
                background: #E6F2FF;
            }
        }
    }
}

.share-box {
    .share-title {
        margin-bottom: 24rem;
        color: #45454d;
        font-weight: 700;
        font-size: 28rem;
    }

    .share-list {
        display: flex;

        .share-item {
            .item-title {
                color: #000;
                font-weight: 700;
                font-size: 22rem;
            }

            .item-random {
                display: flex;
                background: rgba(00, 00, 00, 0.2);
                border-radius: 16rem;
                padding: 10rem 10rem;
                display: flex;
                align-items: center;
                justify-content: center;

                .adbanner {
                    width: 70rem;
                    height: 70rem;

                    &:first-of-type {
                        margin-left: 0rem;
                    }
                }

                .random-img {
                    width: 100%;
                    height: 100%;
                }

                .total-swiper {
                    width: 100%;
                    height: 100%;
                    position: relative;

                    .total-img {
                        width: 100%;
                        height: 100%;
                    }

                    .total-point {
                        position: absolute;
                        top: 0rem;
                        bottom: 0rem;
                        width: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-size: 36rem;
                        color: #fff;
                        font-weight: 900;
                    }
                }
            }
        }

        .divider-h {
            width: 2rem;
            background: rgba(00, 00, 00, 0.1);
            border-radius: 2rem;
            height: 110rem;
            margin: 24rem 30rem 0rem 80rem;
        }
    }
}

.reckon-time {
    padding: 18rem 0rem;

    .reckon-title {
        word-break: break-all;
        color: #45454d;
        font-weight: 700;
        font-size: 28rem;
    }

    .time-bar {
        // margin-top: 24rem;

        .time-num {
            display: flex;
            align-items: center;
            font-size: 30rem;

            .num-item {
                width: 56rem;
                height: 56rem;
                background: #000;
                color: #FFF;
                border-radius: 8rem;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            span {
                color: #45454d;
                font-weight: 700;
                margin: 0rem 4rem;
            }
        }

        .bar {
            flex: 1;
            height: 12rem;
            background: #B6B9C4;
            border-radius: 8rem;
            overflow: hidden;
            margin-top: 20rem;

            .bar-active {
                height: 100%;
                background: linear-gradient(112.71deg, #296AED 4.28%, #0A45CF 67.56%);
            }
        }
    }
}

.type-item {
    margin-top: 16rem;
    padding: 0 20rem;
    min-width: 164rem;
    flex-shrink: 0;
    background-color: #fffef8;
    border-radius: 8rem;
    box-shadow: inset 2rem 2rem 8rem 0rem rgba(0, 0, 0, 0.1);
    overflow: hidden;

    &.active {
        background: #E6F2FF;
    }

    &.active::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 8rem;
        background: linear-gradient(112.71deg, #296AED 4.28%, #0A45CF 67.56%);
    }
}

.operation-box {
    gap: 20rem;
    display: flex;
    justify-content: space-between;

    .type-item {
        height: 76rem;
        border-radius: 6rem;
        padding: 0 20rem;
        min-width: max-content;
        color: #666666;
        flex: 1;

        &.active {
            color: #000000;
        }

        &.active::before {
            height: 6rem;
        }
    }
}

.active-bg {
    background: #E6F2FF;
}

.arrow-img {
    height: 12rem;
    position: absolute;
    top: calc(50% - 6rem);
    right: 6rem;
}

.txt-box {
    height: 82rem;
    width: 82rem;
    flex-shrink: 0;
    position: relative;
    margin-left: 4rem;

    &:first-of-type {
        margin-left: 0rem;
    }

    .txt-img {
        width: 100%;
        height: 100%;
    }

    .txt-point {
        position: absolute;
        top: 0rem;
        bottom: 0rem;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 36rem;
        color: #fff;
        font-weight: 900;
    }
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
</style>