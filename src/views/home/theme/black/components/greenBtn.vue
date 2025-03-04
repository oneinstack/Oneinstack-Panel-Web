<template>
    <div class="g-btn" @click="conf.change">
        <div class="top"></div>
        <div class="bottom"></div>
        <div class="txt">
            <slot></slot>
        </div>
    </div>
</template>
<script setup lang="ts">
import { reactive } from 'vue';

const emit = defineEmits(['click'])
const conf = reactive({
    change() {
        emit('click')
    }
})
</script>
<style lang="less" scoped>
.g-btn {
    height: 100%;
    width: 100%;
    position: relative;

    .top {
        border-radius: 12rem;
        position: relative;
        z-index: 2;
        height: calc(100% - 4rem);
        box-shadow: 2px 2px 4px 0px #28C6654D;
        background: linear-gradient(90deg, #26F188 0%, #9FE781 100%);
    }

    .bottom {
        border-radius: 12rem;
        position: absolute;
        top: 4rem;
        left: 0;
        right: 0;
        height: calc(100% - 4rem);
        background: linear-gradient(90deg, #27D575 0%, #30C06B 100%);
        box-shadow: -2px -2px 4px 0px #28C6654D;
    }

    .txt {
        position: absolute;
        inset: 0;
        color: #1F1F1F;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3;
        font-weight: 600;
        font-family: Poppins;
    }
}
</style>