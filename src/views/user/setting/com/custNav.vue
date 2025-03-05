<template>
    <div class="cust-list">
        <template v-for="(item, index) in dataArr" :key="index">
            <div class="nav-item" @click="conf.change(item, index)">
                <slot :item="item"></slot>
            </div>
        </template>
        <div :style="{ left: `calc( ${conf.navIndex} * 100% / ${dataArr.length})`, width: `calc(100% / ${dataArr.length})` }"
            class="nav-active"></div>
    </div>
</template>
<script setup lang="ts">
import { reactive, watch } from 'vue';


const props = defineProps({
    /**
     * 导航栏数组
     */
    dataArr: {
        default: (): any => []
    },
    /**
     * 初始默认选中项
     */
    active: {
        default: 0
    }
})

const emit = defineEmits(['change'])

const conf = reactive({
    navIndex: 0,
    change(item: any, index: any) {
        conf.navIndex = index
        emit('change', { item, index })
    }
})

watch(
    () => props.active,
    (val: any) => {
        if (props.active != conf.navIndex) conf.navIndex = props.active
    },
    { immediate: true, deep: true }
)

</script>
<style lang="less" scoped>
.cust-list {
    display: flex;
    background: #323838;
    height: 68rem;
    border-radius: 14rem;
    position: relative;

    .nav-item {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #BFBFBF;
        font-size: 24rem;
        position: relative;
        z-index: 3;
    }

    .nav-active {
        background: #394143;
        border-radius: 14rem;
        font-weight: 600;
        color: #fff;
        position: absolute;
        top: 0;
        height: 100%;
        transition-duration: 0.2s;
    }
}
</style>