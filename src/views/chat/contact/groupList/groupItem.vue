<template>
    <div class="item">
        <img class="avatar-img" src="/static/img/home-banner.png" />
        <div class="name">似水流</div>
    </div>
</template>
<script setup lang="ts">
import { computed, reactive } from 'vue';
const props = defineProps({
    application: {
        default: {} as any
    },
    isRecv: {
        default: false
    }
})

const conf = reactive({
    
})


</script>
<style lang="less" scoped>
.item {
    padding: 20rem 30rem;
    display: flex;
    align-items: center;
    border-bottom: 2rem #F6F7FA solid;

    .avatar-img {
        width: 80rem;
        height: 80rem;
        border-radius: 8rem;
    }

    .name {
        color: #333;
        font-size: 30rem;
        margin-left: 16rem;
    }
}
</style>
