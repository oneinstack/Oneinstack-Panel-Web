<template>
    <van-popup class="popup-bottom-center" :show="show" position="bottom" borderRadius='16' :round="true"
        @close="emit('close')">
        <div class="popup-content">
            <div class="title flex-center">
                <span>{{ title }}</span>
                <div class="arrow flex-center" @click.stop="emit('close')">
                    <van-icon size="28rem" color="#fff" name="cross" />
                </div>
            </div>
            <slot></slot>
        </div>
    </van-popup>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';


const props = defineProps({
    show: {
        default: false
    },
    title: {
        default: 'Select'
    }
})

const emit = defineEmits(['close'])

</script>

<style lang="less" scoped>
.popup-content {
    background: #232626;

    .title {
        height: 100rem;
        color: #fff;
        font-size: 28rem;
        position: relative;

        .arrow {
            position: absolute;
            right: 24rem;
            top: calc(50% - 28rem);
            width: 48rem;
            height: 48rem;
            background: #464F50;
            border-radius: 12rem;
            z-index: 2;
        }
    }
}
</style>