<template>
    <GameLayout title="3DLottery" code="3D_LOTTERY" :lottery="lottery">
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
            <img class="incline-img" src="/static/img/game/welfare-incline.png" />
        </div>
        <div class="content-box">
            <div class="time-nav">
                <div style="overflow-x: scroll;" v-scroll>
                    <div class="time-list">
                        <div v-for="(item, index) in lottery.play.list" :key="index" class="time-item"
                            :class="{ 'time-active': item.id === lottery.play.item.id }">
                            <div>{{ item.label }}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="share-box">
                <div class="share-title">{{ $t('game.resultFor') }}：{{ lottery.lastissue }}</div>
                <div class="share-list">
                    <div class="share-item">
                        <div class="item-title">{{ $t('game.resultBig') }}</div>
                        <div class="item-random">
                            <div class="adbanner">
                                <game-loop :swipeList="conf.loop.numList" :target-swipe="conf.loop.openCode[0]"
                                    :autoplay="conf.loop.autoplay">
                                    <template v-slot="{ item }">
                                        <img style="width: 100%;height: 100%;"
                                            :src="`/static/img/game/3d/d${item}.png`" />
                                    </template>
                                </game-loop>
                            </div>
                            <div class="adbanner">
                                <game-loop :swipeList="conf.loop.numList" :target-swipe="conf.loop.openCode[1]"
                                    :autoplay="conf.loop.autoplay">
                                    <template v-slot="{ item }">
                                        <img style="width: 100%;height: 100%;"
                                            :src="`/static/img/game/3d/d${item}.png`" />
                                    </template>
                                </game-loop>
                            </div>
                            <div class="adbanner">
                                <game-loop :swipeList="conf.loop.numList" :target-swipe="conf.loop.openCode[2]"
                                    :autoplay="conf.loop.autoplay">
                                    <template v-slot="{ item }">
                                        <img style="width: 100%;height: 100%;"
                                            :src="`/static/img/game/3d/d${item}.png`" />
                                    </template>
                                </game-loop>
                            </div>
                        </div>
                    </div>
                    <div class="divider-h"></div>
                    <div class="share-item">
                        <div class="item-title" style="text-align: center;">{{ $t('game.totalPoint') }}</div>
                        <div class="item-random">
                            <div class="adbanner">
                                <game-loop :swipeList="conf.loop.sumList" :target-swipe="conf.loop.openCode[3]"
                                    :autoplay="conf.loop.autoplay">
                                    <template v-slot="{ item }">
                                        <div class="total-swiper">
                                            <img class="total-img" src="/static/img/poinits.webp" />
                                            <div class="total-point">{{ item }}</div>
                                        </div>
                                    </template>
                                </game-loop>
                            </div>
                        </div>
                    </div>
                    <div class="divider-h"></div>
                    <div class="share-item">
                        <div class="item-title" style="text-align: center;">{{ $t('game.draw') }}</div>
                        <div class="item-random">
                            <div class="adbanner">
                                <game-loop :swipeList="conf.loop.drawList" :target-swipe="conf.loop.openCode[4]"
                                    :autoplay="conf.loop.autoplay">
                                    <template v-slot="{ item }">
                                        <div class="random"
                                            style="display: flex;justify-content: center;align-items: center;font-size: 48rem;width: 100%;height: 100%;"
                                            v-if="item.content == '-'">-</div>
                                        <img style="width: 100%;height: 100%;" :src="item.src1" v-else />
                                    </template>
                                </game-loop>
                            </div>
                            <div class="adbanner">
                                <game-loop :swipeList="conf.loop.drawList" :target-swipe="conf.loop.openCode[5]"
                                    :autoplay="conf.loop.autoplay">
                                    <template v-slot="{ item }">
                                        <div class="random"
                                            style="display: flex;justify-content: center;align-items: center;font-size: 48rem;width: 100%;height: 100%;"
                                            v-if="item.content == '-'">-</div>
                                        <img style="width: 100%;height: 100%;" :src="item.src2" v-else />
                                    </template>
                                </game-loop>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="reckon-time">
                <div class="reckon-title">{{ $t('game.drawingTime') + ':' + lottery.issue }}</div>
                <div class="time-bar">
                    <div class="time-num">
                        <div class="num-item">{{ lottery.countDown[0] }}</div>
                        <span>:</span>
                        <div class="num-item">{{ lottery.countDown[1] }}</div>
                        <span>:</span>
                        <div class="num-item">{{ lottery.countDown[2] }}</div>
                    </div>
                    <div class="bar">
                        <div class="bar-active"
                            :style="{ width: `${(lottery.countDown[3] / (lottery.play.item.lotteryInterval / 1000)) * 100}%` }">
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
            <bettingtabs v-if="conf.operation.active === 'betting'" />
        </div>
        <!-- 内容区 -->
        <div class="col" style="overflow: auto;" :class="{'active-bg': conf.operation.active==='betting'}">
            
            <!-- 下注区和处理下注 -->
            <betting @changeBet="conf.betting.requestBet" :key="conf.betting.tabs.level1.item.name" v-if="conf.operation.active === 'betting'" />

            <result ref="resultRefs" v-if="conf.operation.active === 'result'" :lotteryId="lottery.play.item.id" />

            <order ref="orderRefs" v-if="conf.operation.active === 'myOrder'" :lotteryId="lottery.play.item.id" />

            <template v-if="conf.operation.active === 'rule'">
                <div style="padding: 20rem 48rem" v-html="lottery.play.item.lotteryRuleurl"></div>
            </template>
        </div>
    </GameLayout>
</template>
<script setup lang="ts">
import GameLayout from '../components/gameLayout.vue'
import bettingtabs from './components/betting/tabs.vue'
import betting from './components/betting/index.vue'
import gameLoop from '../components/gameLoop.vue';
import result from './components/result.vue'
import order from './components/order.vue'

import { index } from './Lottery3D'
const { conf, lottery, resultRefs, orderRefs } = index()
</script>
<style lang="less" scoped>
.time-box {
    height: 100rem;
    padding: 5rem 10rem 0rem;
    position: relative;
    bottom: -5rem;

    .time-outer {
        padding: 10rem 12rem;
        background: linear-gradient(89.96deg, #FFDEBB 0.49%, #FCCFAC 99.97%);
        height: 100%;
        border-radius: 20rem;

        .time-content {
            height: 100%;
            background: linear-gradient(89.96deg, #FFD1A0 0.49%, #F8B98A 99.97%);
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
                    background: #EA934B;
                    margin-right: 4rem;

                    &:last-of-type {
                        margin-right: 0rem;
                    }
                }
            }

            span {
                color: #EA934B;
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
    background: linear-gradient(344.78deg, #FFD9BF 8.93%, #FFDEBB 87.54%);
    padding: 0 24rem 30rem;
}

.time-nav {
    padding: 20rem 0rem;

    .time-list {
        display: flex;
        height: 96rem;

        .time-item {
            background: #FFF;
            box-shadow: 4rem 4rem 8rem 0rem rgba(0, 0, 0, 0.10), -8rem -8rem 8rem 0rem rgba(255, 255, 255, 0.20);
            box-shadow: 2px 2px 4px 0px #0000001A, -4px -4px 4px 0px #FFFFFF33;

            border-radius: 8rem;
            font-size: 30rem;
            color: #252529;
            font-weight: 700;
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
                border-top: 8rem solid #EC612E;
                background: #FFFBE2;
                box-shadow: 2px 2px 4px 0px #0000001A inset;
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
        justify-content: space-between;

        .share-item {
            .item-title {
                margin-bottom: 8rem;
                color: #5f6975;
                font-weight: 700;
                font-size: 20rem;
            }

            .item-random {
                display: flex;
                // background: #b0aea0;
                background: rgba(00, 00, 00, 0.2);
                border-radius: 16rem;
                // box-shadow: 0rem 8rem 8rem 0rem #000 inset;
                padding: 10rem 20rem;
                display: flex;
                align-items: center;
                justify-content: center;

                .adbanner {
                    width: 70rem;
                    height: 70rem;
                    margin-left: 10rem;

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
                        color: #2c2e36;
                        font-weight: 900;
                    }
                }
            }
        }

        .divider-h {
            width: 2rem;
            background: rgba(00, 00, 00, 0.1);
        }
    }
}

.reckon-time {
    padding: 20rem 0rem;

    .reckon-title {
        word-break: break-all;
        color: #45454d;
        font-weight: 700;
        font-size: 28rem;
    }

    .time-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 24rem;

        .time-num {
            display: flex;
            align-items: center;

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
            height: 16rem;
            background: #B6B9C4;
            border-radius: 8rem;
            overflow: hidden;
            margin-left: 50rem;

            .bar-active {
                height: 100%;
                // background: #D90000;
                background: linear-gradient(180deg, #FB0224 0%, #F56900 100%);
            }
        }
    }
}

.type-item {
    padding: 0 20rem;
    min-width: 164rem;
    height: 104rem;
    flex-shrink: 0;
    background-color: #fffef8;
    border-radius: 8rem;
    box-shadow: inset 2rem 2rem 8rem 0rem rgba(0, 0, 0, 0.1);
    overflow: hidden;

    &.active {
        background-color: #fffbe2;
    }

    &.active::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 8rem;
        background: linear-gradient(180deg, #eb602d 0%, #ffa64f 100%);
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
.active-bg{
    background: #FFE1C3;
}
</style>