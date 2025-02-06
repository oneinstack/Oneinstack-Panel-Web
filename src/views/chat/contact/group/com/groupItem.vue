<template>
    <div class="item" @click="conf.goChat">
        <div class="avatar-img">
            <headImg class="face" :src="groupInfo.faceURL" :isGroup="groupInfo.groupID ? true : false" />
        </div>
        <div class="name">{{ groupInfo.groupName }}</div>
    </div>
</template>
<script setup lang="ts">
import System from '@/utils/System';
import headImg from '@/views/chat/components/headImg.vue';
import { reactive } from 'vue';
const props = defineProps({
    groupInfo: {
        default: {} as any
    }
})

const conf = reactive({
    goChat() {
        System.router.push('/chat/chating?back2Tab=false')
    }
})

</script>
<style lang="less" scoped>
.item {
    padding: 20rem 30rem;
    display: flex;
    align-items: center;
    border-bottom: 2rem #F6F7FA solid;

    .avatar-img {
        width: 92rem;
        height: 92rem;
        border-radius: 8rem;
        overflow: hidden;
    }

    .name {
        color: #333;
        font-size: 30rem;
        margin-left: 16rem;
    }
}
</style>
