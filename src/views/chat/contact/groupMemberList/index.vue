<template>
  <x-page :bgcolor="'#fff'">
    <template #title>
      <span class="title">{{ `${$t('chatRoom.grp_members')} (${conf.total})` }}</span>
    </template>
    <headSearch />
    <div>
      <div style="height: calc(100vh - 165rem);">
        <groupItem :isMore="false" :groupMemberList="conf.groupMemberList" />
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { capis } from '@/modules/chat/api';
import { onMounted, reactive } from 'vue';
import headSearch from '../com/headSearch.vue';
import groupItem from '../../conversation/details/com/groupItem.vue';

const conf = reactive({
  groupMemberList: [] as any[],
  total: 0
})

onMounted(async () => {
  const { members,total } = await capis.getGroupMemberList(
    {
      filter: 0,
      groupID:"1888222333",
      keyword:"",
      pagination: {
        pageNumber: 1,
        showNumber: 50,
      },
    }
  );
  conf.groupMemberList = members
  conf.total = total
});
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}
</style>
