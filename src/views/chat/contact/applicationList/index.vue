<template>
  <x-page>
    <template #title>
      <span class="title">{{ conf.isGroup ? $t('chatRoom.new_grp_chat') : $t('chatRoom.new_friend') }}</span>
    </template>
    <headSearch />
    <div class="content">
      <template v-for="item in getRecvRenderData" :key="item">
        <applicationItem :isRecv="true" :application="item"></applicationItem>
      </template>
      <div style="padding-top: 120rem;" v-if="!getRecvRenderData.length">
        <x-no-data></x-no-data>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router';
import headSearch from '../com/headSearch.vue';
import applicationItem from './applicationItem.vue';
import { computed, onMounted, reactive } from 'vue';
import { ContactMenuTypes } from '@/modules/chat/constant'
import cscontact from '@/modules/chat/sstore/cscontact';

const conf = reactive({
  isGroup: false
})
const getRecvRenderData = computed(() => {
    const tmpList = conf.isGroup
        ? cscontact.recvGroupApplications
        : cscontact.recvFriendApplications;
    tmpList.sort((a:any, b:any) => (a.handleResult === 0 ? -1 : 1));
    return tmpList
})
const route = useRoute()
onMounted(() => {
	const { type } = route.query;
  conf.isGroup = type === ContactMenuTypes.NewGroup;
  console.log(conf.isGroup);
  
})
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}
.content{
  background: #fff;
  height: 100%;
}
</style>
