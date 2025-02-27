<template>
    <div class="menu flex-b-c" @click="emit('change', menuInfo)">
        <div class="l-name">
            <img v-if="menuInfo.imgUrl == 'logo-img'" class="logo-img" :src="`/static/img/home/black/${menuInfo.imgUrl}.png`" />
            <img v-else class="l-img" :src="`/static/img/home/black/${menuInfo.imgUrl}.png`" />
            <div class="l-content">
                <div>{{ menuInfo.name }}</div>
                <div class="num" v-if="menuInfo.num">{{ menuInfo.num }}</div>
            </div>
        </div>
        <img v-if="menuInfo.rNum" class="bg" src="/static/img/home/black/tocken-bg.png" />
        <div class="r-arrow" v-if="menuInfo.isArrowRight != undefined">
            <div class="r-content" v-if="menuInfo.rNum">
                <div>{{ menuInfo.rNum }}</div>
                <div class="r-num">{{ menuInfo.rPrice }}</div>
            </div>
            <div class="arrow flex-center">
                <van-icon size="24rem" color="#bfbfbf" name="arrow" v-if="menuInfo.isArrowRight" />
                <van-icon size="24rem" color="#bfbfbf" name="arrow-up" v-else-if="menuInfo.isMore" />
                <van-icon size="24rem" color="#bfbfbf" name="arrow-down" v-else />
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">

const props = defineProps({
    menuInfo: {
        default: (): any => { }
    }
})

const emit = defineEmits(['change'])

</script>
<style lang="less" scoped>
.menu {
    // background: #323738;
    padding: 0rem 20rem;
    border-radius: 16rem;
    position: relative;
    overflow: hidden;
    height: 100%;

    .l-name {
        display: flex;
        align-items: center;

        .logo-img {
            width: 48rem;
            height: 48rem;
            margin-right: 24rem;
        }

        .l-img{
            width: 40rem;
            height: 40rem;
            margin-right: 32rem;
        }

        .l-content {
            color: #fff;
            font-size: 28rem;

            .num {
                color: #1CF187;
                font-size: 24rem;
            }
        }
    }

    .bg {
        position: absolute;
        right: 0rem;
        width: 340rem;
        height: 140rem;
        top: 0rem;
    }

    .r-arrow {
        display: flex;
        align-items: center;

        .r-content {
            font-size: 24rem;
            color: #fff;
            text-align: right;
        }

        .arrow {
            width: 44rem;
            height: 44rem;
            background: #464F50;
            border-radius: 12rem;
            margin-left: 24rem;
            position: relative;
            z-index: 2;
        }
    }
}
</style>