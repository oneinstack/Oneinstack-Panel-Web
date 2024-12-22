<template>
  <x-page>
    <template #title>
      <span class="title">{{ $t('chatRoom.my_grps') }}</span>
    </template>
    <headSearch />
    <div class="content">
      <template v-for="item in cscontact.groupList" :key="item.groupID">
        <groupItem :groupInfo="item"></groupItem>
      </template>
      <div class="group_num">{{ cscontact.groupList.length }} {{ $t('chatRoom.sgrops') }}</div>
      <div style="padding-top: 120rem;" v-if="!cscontact.groupList.length">
        <x-no-data></x-no-data>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import cscontact from '@/modules/chat/sstore/cscontact';
import headSearch from '../com/headSearch.vue';
import groupItem from './com/groupItem.vue';
import { onMounted, reactive } from 'vue';

const conf = reactive({
  isGroup: false
})
onMounted(() => {
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
  .group_num{
    color: #999;
    font-size: 28rem;
    text-align: center;
    margin-top: 20rem;
  }
}
</style>
