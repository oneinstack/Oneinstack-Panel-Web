<template>
    <div class="search">
        <div class="l-type" v-if="typeName">
            <div class="type">
                <span>Casino</span>
                <van-icon size="24rem" color="#fff" name="arrow-down" />
            </div>
            <div class="line"></div>
        </div>
        <div class="r-input flex-center">
            <van-icon size="36rem" color="#BFBFBF" name="search" />
            <input class="place" placeholder="Search Game" placeholder-class="input-placeholder" />
        </div>
    </div>
</template>

<script setup lang="ts">

const props = defineProps({
    typeName: {
        default: '' as any
    }
})

</script>

<style lang="less" scoped>
.search {
    height: 80rem;
    background: #292D2E;
    border: 1px solid #383E3E;
    display: flex;
    align-items: center;
    margin: 24rem 24rem;
    border-radius: 14rem;
    padding: 0rem 16rem;
    flex-shrink: 0;
    .l-type{
        display: flex;
        align-items: center;
        .type{
            display: flex;
            align-items: center;
            color: #fff;
            font-size: 24rem;
            span{
                margin-right: 12rem;
            }
        }
        .line{
            background: rgba(255, 255, 255, 0.1);
            width: 2rem;
            height: 50rem;
            margin: 0rem 16rem;
        }
    }
    .place {
        color: #BFBFBF;
        font-size: 25rem;
        margin-left: 20rem;
    }
}
</style>