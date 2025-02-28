<template>
    <div class="popular-item">
        <div class="top flex-b-c">
            <img class="l-img" src="/static/theme/black/popular.png" />
            <img class="r-img" :src="`/static/theme/black/${item.imgUrl}.png`" />
        </div>
        <div class="draw">Next Draw in 02h16m54s</div>
        <div class="p-game">Satta king-10Mins</div>
        <div class="p-price flex-b-c">
            <div class="name">Top price</div>
            <div class="money">$872,322.19</div>
        </div>
        <div class="btn flex-center">Bet Now</div>
    </div>
</template>
<script setup lang="ts">

const props = defineProps({
    item: {
        default: (): any => { }
    }
})

</script>
<style lang="less" scoped>
.popular-item {
    width: 49%;
    background: #323738;
    border-radius: 20rem;
    padding: 20rem;
    color: #fff;
    margin-right: 2%;
    margin-bottom: 16rem;

    &:nth-child(2n+2) {
        margin-right: 0rem;
    }

    .top {
        margin-bottom: 30rem;

        .l-img {
            width: 40rem;
            height: 40rem;
        }

        .r-img {
            width: 48rem;
            height: 48rem;
        }
    }

    .draw {
        color: #BFBFBF;
        font-size: 20rem;
        margin-bottom: 30rem;
    }

    .p-game {
        font-size: 24rem;
        font-weight: 600;
        margin-bottom: 20rem;
    }

    .p-price {
        color: #BFBFBF;
        font-size: 20rem;

        .money {
            color: #fff;
            font-size: 24rem;
            transform: skew(-10deg);
        }
    }

    .btn {
        background: #4A5354;
        height: 64rem;
        border-radius: 12rem;
        font-size: 28rem;
        margin-top: 30rem;
    }
}
</style>