<template>
    <div class="podiun">
        <div class="p-content">
            <div class="sort1" :class="getSortName(1)" >
                <lottie-player autoplay loop mode="normal" :src="`/static/lottie/${getSortName(1)}-win.json`" />
            </div>
            <div class="flower">
                <lottie-player autoplay loop mode="normal" src="/static/lottie/flower.json" />
            </div>
            <img class="sort2" :src="`/static/img/game/animal/${getSortName(2)}-win.png`" />
            <img class="sort3" :src="`/static/img/game/animal/${getSortName(3)}-win.png`" />
        </div>
    </div>
    <div class="mask"></div>
</template>
<script setup lang="ts">
import System from '@/utils/System';

System.loadModule('lottie')

const props = defineProps({
    winList: {
        default: [] as any[],
    }
})

const getSortName = (num: number) => {
    let current:any = props.winList.filter(item => item.sort == num)
    return current[0].name
}

</script>
<style lang="less" scoped>
.podiun {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 40%;

    .p-content {
        width: 650rem;
        background: url('/static/img/game/animal/podium.png') no-repeat;
        height: 250rem;
        background-size: 100% 100%;
        position: relative;
        transform: scale(1);
        animation: img-animation 0.3s linear;

        .sort1 {
            height: 460rem;
            position: absolute;
            bottom: 116rem;
            left: 109rem;
        }

        .exb{
            bottom: 135rem;
            left: 110rem;
        }

        .hm{
            bottom: 134rem;
            left: 114rem;
        }

        .pp{
            bottom: 120rem;
            left: 105rem;
        }

        .xz{
            bottom: 142rem;
            left: 107rem;
        }

        .zxb{
            bottom: 122rem;
            left: 106rem;
        }

        .hx{
            bottom: 116rem;
            left: 109rem;
        }

        .flower {
            height: 480rem;
            position: absolute;
            bottom: 200rem;
            left: 76rem;
        }

        .sort2 {
            height: 260rem;
            position: absolute;
            bottom: 160rem;
            left: -5rem;
        }

        .sort3 {
            height: 250rem;
            position: absolute;
            bottom: 135rem;
            right: 2rem;
        }
    }
}

@keyframes img-animation {
    0% {
        transform: scale(0.4);
    }

    100% {
        transform: scale(1);
    }
}

.mask {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 9;
}
</style>