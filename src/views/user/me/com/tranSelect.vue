<template>
    <div class="tran-item flex-b-c" @click="emit('click')">
        <div class="lable">{{ label }}</div>
        <div class="r-arrow flex-center">
            <van-icon size="24rem" color="#fff" name="arrow-down" />
        </div>
    </div>
</template>
<script setup lang="ts">

const props = defineProps({
    label: {
        default: ''
    }
})

const emit = defineEmits(['click'])

</script>

<style lang="less" scoped>
.tran-item {
    background: #363B3C;
    border: 2rem solid #4B5253;
    height: 80rem;
    padding: 0rem 20rem;
    border-radius: 12rem;
    color: #fff;
    font-size: 24rem;
    font-weight: 600;
    width: 100%;

    .r-arrow {
        height: 44rem;
        width: 44rem;
        background: #464F50;
        border-radius: 12rem;
    }
}
</style>