<template>
    <div class="title">
        <div class="l-name">{{ name }}</div>
        <div class="r-btn" v-show="showRight">
            <div class="btn" @click="emit('changeAll')" :style="{padding: !showPage ? '10rem 14rem': '6rem 20rem'}">
                <div class="name">All</div>
                <van-icon size="24rem" name="arrow" />
            </div>
            <div class="btn" style="margin-left: 20rem;" v-if="showPage">
                <van-icon size="24rem" color="#8a8a8a" name="arrow-left" />
            </div>
            <div class="btn" v-if="showPage">
                <van-icon size="24rem" name="arrow" />
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">

const props = defineProps({
    name: {
        default: ''
    },
    showRight: {
        default: true
    },
    showPage: {
        default: true
    }
})

const emit = defineEmits(['changeAll'])

</script>
<style lang="less" scoped>
.title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 24rem;
    .l-name{
        color: #fff;
        font-size: 28rem;
    }
    .r-btn {
        display: flex;

        .btn {
            display: flex;
            align-items: center;
            background: #394143;
            padding: 6rem 10rem;
            border-radius: 12rem;
            color: #FFF;
            font-size: 24rem;

            .name{
                color: #fff;
                margin-right: 10rem;
            }

            &:last-child {
                margin-left: 10rem;
            }
        }
    }
}
</style>