<template>
    <div class="bet-type" @click="emit('close')">
        <x-statusbar header />
        <div class="content" :style="{ 'height': !typeShow ? '0px' : '600rem' }">
            <div class="top-icon">
                <div class="icon left-icon"></div>
                <div class="squre left-squre"></div>
                <div class="icon right-icon"></div>
                <div class="squre right-squre"></div>
            </div>
            <div class="time-type">
                <div class="time-list">
                    <template v-for="item in typeList" :key="item.id">
                        <div class="time-item" :class="{ 'time-active': lotteryId == item.id }"
                            @click="emit('change', item.id)">
                            <div class="time">
                                <div v-if="(item.lotteryInterval / 1000 / 60) >= 1">
                                    <span>{{ item.lotteryInterval / 1000 / 60 }}</span>
                                    {{ (item.lotteryInterval / 1000 / 60) > 1 ? $t('game.minutes') :
                                        $t('game.minute') }}
                                </div>
                                <div v-else>
                                    <span>{{ item.lotteryInterval / 1000 }}</span>{{ $t('game.second') }}
                                </div>
                            </div>
                            <div class="result-list">
                                <div class="result-item" v-for="(item, index) in conf.totalList" :key="index">
                                    <img class="img" :src="`/static/img/game/animal/${item.img}.png`" />
                                    <div class="name">{{ item.name }}</div>
                                </div>
                            </div>
                            <div class="issue">
                                <div v-if="resultInfo[item.id] && resultInfo[item.id].openExpect">
                                    {{ resultInfo[item.id].openExpect.slice(-8) }}</div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
    <div class="mask" v-if="typeShow"></div>
</template>
<script lang="ts" setup>
import { reactive } from 'vue';


const props = defineProps({
    typeShow: {
        default: false
    },
    typeList: {
        default: [] as any[]
    },
    lotteryId: {
        default: ''
    },
    resultInfo: {
        default: {} as any
    }
})

const emit = defineEmits(['change', 'close'])

const conf = reactive({
    totalList: [
        { img: 'exb', name: 'A', st: 0, nd: 0, rd: 0 },
        { img: 'hm', name: 'B', st: 0, nd: 0, rd: 0 },
        { img: 'pp', name: 'C', st: 0, nd: 0, rd: 0 },
        { img: 'xz', name: 'D', st: 0, nd: 0, rd: 0 },
        { img: 'zxb', name: 'E', st: 0, nd: 0, rd: 0 },
        { img: 'hx', name: 'F', st: 0, nd: 0, rd: 0 }
    ],
    getContent(code: string, type: number) {
        if (!code) return ''
        switch (code) {
            case 'A':
                return 'exb'
            case 'B':
                return 'hm'
            case 'C':
                return 'pp'
            case 'D':
                return 'xz'
            case 'E':
                return 'zxb'
            case 'F':
                return 'hx'
            default:
                return ''
        }
    }
})

</script>
<style lang="less" scoped>
.mask {
    position: fixed;
    inset: 0;
    z-index: 9;
    background: rgba(0, 0, 0, 0.3);
}

.bet-type {
    position: fixed;
    z-index: 10;
    left: 0;
    right: 0;

    .content {
        display: flex;
        align-items: center;
        flex-direction: column;
        padding: 0rem 30rem;
        margin-top: -20rem;
        transition: all .2s;
        overflow: hidden;
        position: relative;
        z-index: 10;

        .top-icon {
            display: flex;
            position: relative;

            .icon {
                width: 30rem;
                height: 60rem;
                background: #ffd98e;
            }

            .left-icon {
                transform: skew(-45deg);
                clip-path: polygon(0 0, 100% 50%, 100% 100%, 0 100%);
            }

            .squre {
                width: 30rem;
                height: 30rem;
                border-radius: 50%;
                background: #fff;
                position: absolute;
                bottom: -20rem;
            }

            .left-squre {
                left: -32rem;
            }

            .right-squre {
                right: -32rem;
            }

            .right-icon {
                transform: skew(45deg);
                clip-path: polygon(0 50%, 100% 0, 100% 100%, 0 100%);
            }
        }

        .time-type {
            background: #fff2d5;
            width: 100%;
            padding-top: 30rem;
            border-radius: 16rem;
            margin-top: 4rem;
        }

        .time-list {
            padding: 10rem 0rem 30rem;
            height: 420rem;
            overflow-y: auto;
            color: #666;

            .time-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10rem 20rem;

                .time {
                    font-size: 30rem;
                    color: #9A470C;
                    width: 160rem;
                }

                .result-list {
                    display: flex;

                    .result-item {
                        margin-right: 8rem;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        font-size: 24rem;

                        .img {
                            width: 50rem;
                            height: 50rem;
                        }
                    }
                }

                .issue {
                    font-size: 26rem;
                    min-width: 120rem;
                    text-align: right;
                }
            }

            .time-active {
                background: #ffe8bc;
            }
        }
    }
}
</style>