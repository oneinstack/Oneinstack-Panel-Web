<template>
    <div class="bet-type" @click="emit('close')">
        <x-statusbar header />
        <div class="content" :style="{ 'height': !typeShow ? '0px' : '520rem' }">
            <img class="type-img" src="/static/img/game/animal/type-icon.webp" />
            <div class="time-type">
                <div class="time-list">
                    <template v-for="item in typeList" :key="item.id">
                        <div class="time-item" :class="{ 'time-active': lotteryId == item.id }"
                            @click="emit('change', item.id)">

                            <div class="ani-con">
                                <div class="ani-bg"></div>
                            </div>
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
                            <div class="result-list" v-if="resultInfo[item.id] && resultInfo[item.id].openCodeArr">
                                <div class="result-item" v-for="(n, i) in resultInfo[item.id].openCodeArr" :key="i">
                                    <img class="img" :src="`/static/img/game/animal/${n}.png`" />
                                    <!-- <div class="name">{{ n }}</div> -->
                                </div>
                            </div>
                            <div class="issue">
                                <!-- .slice(-8) -->
                                <div v-if="resultInfo[item.id] && resultInfo[item.id].openExpect">
                                    {{ resultInfo[item.id].openExpect }}</div> 
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
    <div class="mask" @click="emit('close')" v-if="typeShow"></div>
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
    ]
})

</script>
<style lang="less" scoped>
.mask {
    position: fixed;
    inset: 0;
    z-index: 9;
    background: rgba(0, 0, 0, 0.3);
    width: 750rem;
    margin: 0 auto;
}

.bet-type {
    position: fixed;
    z-index: 10;
    left: 0;
    right: 0;
    width: 750rem;
    margin: 0 auto;
    

    .content {
        display: flex;
        align-items: center;
        flex-direction: column;
        padding: 0rem 20rem;
        margin-top: -20rem;
        transition: all .5s;
        overflow: hidden;
        position: relative;
        z-index: 10;

        .type-img{
            width: 180rem;
            height: 70rem;
            z-index: 2;
        }

        .time-type {
            background: #fff2d5;
            width: 100%;
            padding-top: 30rem;
            border-radius: 22rem;
            margin-top: -20rem;
            background: url('/static/img/game/animal/bet-bg.png') no-repeat;
            background-size: 100% 100%;
            padding-bottom: 20rem;
        }

        .time-list {
            padding: 10rem 0rem 30rem;
            max-height: 360rem;
            overflow-y: auto;
            color: #666;
            padding: 0 20rem;

            .time-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24rem 16rem;
                background-image: linear-gradient(117deg, #FDF3CF 0%, #FEE7B5 100%);
                box-shadow: 1px 1px 4px 0px #00000014;
                position: relative;
                border: 4rem solid #fff;
                margin-top: 20rem;
                border-radius: 16rem;

                .ani-con {
                    position: absolute;
                    inset: 2rem;
                    overflow: hidden;
                }

                .ani-bg {
                    width: 50rem;
                    height: 90rem;
                    transform: rotate(50deg);
                    background: linear-gradient(177.16deg, #FFE8B9 2.68%, #FFDDA0 33.87%);
                    border-radius: 22px;
                    position: absolute;
                    bottom: -40rem;
                    left: 20rem;
                }

                .time {
                    font-size: 30rem;
                    color: #9A470C;
                    width: 130rem;
                    z-index: 3;
                }

                .result-list {
                    display: flex;

                    .result-item {
                        margin-right: 5rem;
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
                    font-size: 22rem;
                    min-width: 120rem;
                    text-align: right;
                }
            }
            .time-active {
                border: 4rem solid #FF4F4F;
                box-shadow: 0.5px 0.5px 4px 0px #FB5352CC;
            }
        }
    }
}
</style>