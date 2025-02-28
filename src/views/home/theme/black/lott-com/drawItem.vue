<template>
    <div class="draw-item" :style="{ background: item.bg }">
        <div class="draw-name">{{ item.name }}</div>
        <div class="draw-money">{{ item.money }}</div>
        <div class="line"></div>
        <div class="next-start">Next Draw Starts in</div>
        <div class="time-list">
            <div class="time-item flex-center">00h</div>
            <span>:</span>
            <div class="time-item flex-center">00m</div>
            <span>:</span>
            <div class="time-item flex-center">00s</div>
        </div>
        <div class="draw-btn">
            <greenBtn>
                <span style="font-size: 28rem;">Bet Now</span>
            </greenBtn>
        </div>
        <img class="draw-img" :src="`/static/theme/black/${item.imgUrl}.png`" />
    </div>
</template>
<script setup lang="ts">
import greenBtn from '../components/greenBtn.vue';

const props = defineProps({
    item: {
        default: (): any => {}
    }
})

</script>
<style lang="less" scoped>
.draw-item {
    color: #fff;
    width: 310rem;
    // background: linear-gradient(180deg, #343739 0%, #A23F6B 100%);
    padding: 20rem;
    border-radius: 20rem;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
    margin-right: 16rem;

    .draw-name {
        font-size: 24rem;
    }

    .draw-money {
        font-size: 26rem;
        margin-top: 40rem;
        font-weight: 700;
        transform: skew(-10deg);
    }

    .line {
        height: 1rem;
        background: #FFFFFF1A;
        width: 100%;
        margin: 10rem 0rem;
    }

    .next-start {
        color: #BFBFBF;
        font-size: 20rem;
    }

    .time-list {
        display: flex;
        align-items: center;
        margin-top: 10rem;

        span {
            margin: 0rem 10rem;
        }

        .time-item {
            flex: 1;
            background: #0000001A;
            height: 44rem;
            border-radius: 8rem;
            font-size: 24rem;
        }
    }

    .draw-btn {
        height: 64rem;
        width: 100%;
        margin-top: 20rem;
    }

    .draw-img {
        position: absolute;
        right: -12rem;
        top: -18rem;
        width: 80rem;
        height: 80rem;
    }
}
</style>