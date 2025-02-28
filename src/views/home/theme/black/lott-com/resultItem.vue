<template>
    <div class="result-item">
        <div class="l-type">
            <img class="game-img" :src="`/static/theme/black/${item.imgUrl}.png`" />
            <div class="game-name">{{ item.name }}</div>
            <div class="game-time">26/02/2025, 16:03:10</div>
        </div>
        <div class="result-open">
            <div class="dice" v-if="item.lotteryTypeCode == '3D'">
                <template v-for="(a, i) in item.openCode.split(',')" :key="i">
                    <img class="dice-img" :src="`/static/img/share-${a}.webp`" />
                </template>
            </div>
            <div class="num-img" v-else-if="item.lotteryTypeCode == 'COLOR'">
                <img class="img" :src="`/static/img/${conf.getColor(item.openCode)}.webp`" />
                <div class="num flex-center">{{ item.openCode }}</div>
            </div>
            <div class="winGo" v-else-if="item.lotteryTypeCode == 'Trx_Win_Go'">
                <div class="ball flex-center" :class="['qkball_' + conf.getWinGo(item.openCode)]">
                    <span class="txt">{{ item.openCode }}</span>
                </div>
            </div>
            <div class="open-img" v-else-if="item.lotteryTypeCode == 'PK10'">
                <template v-for="(a, i) in item.openCode.split(',')" :key="i">
                    <img class="img" :src="`/static/img/game/pk10/speed_pinball${ a<10 ? '0' + a : a}.png`" />
                </template>
            </div>
            <div class="flex" v-else-if="item.lotteryTypeCode == '5D'">
                <template v-for="(a, i) in item.openCode.split(',')" :key="i">
                    <div class="num-img" style="color: #000;">
                        <img class="img" src="/static/img/poinits.webp" />
                        <div class="num flex-center">{{ a }}</div>
                    </div>
                </template>
            </div>
            <div class="num-img" v-else-if="item.lotteryTypeCode == 'SATTA_KING'">
                <img class="img" src="/static/img/color-red.webp" />
                <div class="num flex-center" style="font-size: 25rem;">{{ item.openCode }}</div>
            </div>
            <div class="open-img" v-else-if="item.lotteryTypeCode == 'ANIMALS_RUNNING'">
                <template v-for="(a, i) in item.openCode.split(',')" :key="i">
                    <img class="img" :src="`/static/img/game/animal/${a}.png`" />
                </template>
            </div>
            <div class="open-img" v-else-if="item.lotteryTypeCode == '3D_LOTTERY'">
                <template v-for="(a, i) in item.openCode.split(',')" :key="i">
                    <img class="img" :src="`/static/img/game/3d/d${a}.png`" />
                </template>
            </div>
            <div style="display: flex;" v-else-if="item.lotteryTypeCode == 'MARK_SIX'">
                <template v-for="(a, i) in item.openCode.split(',')" :key="i">
                    <resultBall :num="a" :size="42"/>
                </template>
                
            </div>
        </div>
        <van-icon size="24rem" color="#BFBFBF" name="arrow" />
    </div>
</template>
<script setup lang="ts">
import resultBall from '@/views/game/MarkSix/components/resultBall.vue';
import { reactive } from 'vue';


const props = defineProps({
    item: {
        default: (): any => { }
    }
})

const conf = reactive({
    getColor(code: any) {
        if (code == 0) return 'color2'
        if (code == 5) return 'color1'
        const evenTArr = [2, 4, 6, 8]
        if (evenTArr.includes(code)) return 'color-red'
        return 'color-green'
    },
    getWinGo(code: any) {
        if (code == 0) return 'rv'
        if (code == 5) return 'gv'
        const evenTArr = [2, 4, 6, 8]
        if (evenTArr.includes(code)) return 'r'
        return 'g'
    }
})

</script>
<style lang="less" scoped>
@import '@/styles/resultHistory.less';

.result-item {
    display: flex;
    align-items: center;
    padding: 20rem;
    border-top: 2rem solid #FFFFFF1A;
    color: #fff;
    font-size: 24rem;

    .l-type {
        margin-right: 40rem;

        .game-img {
            width: 48rem;
            height: 48rem;
            margin-bottom: 12rem;
        }

        .game-time {
            color: #BFBFBF;
            font-size: 20rem;
            margin-top: 6rem;
        }
    }

    .result-open {
        flex: 1;
        display: flex;
        justify-content: flex-end;
        margin-right: 30rem;
        color: #fff;
        font-size: 28rem;
        font-weight: 700;

        .dice {
            display: flex;

            .dice-img {
                height: 48rem;
            }
        }

        .num-img {
            width: 48rem;
            height: 48rem;
            position: relative;
            margin-left: 4rem;

            .img {
                width: 100%;
                height: 100%;
            }

            .num {
                position: absolute;
                top: 0;
                bottom: 0;
                width: 100%;
            }
        }

        .winGo {
            width: 48rem;
            height: 48rem;

            .ball {
                width: 100%;
                height: 100%;
            }
        }

        .open-img {
            display: flex;
            .img{
                width: 48rem;
                height: 48rem;
                margin-left: 4rem;
            }
        }
    }
}
</style>