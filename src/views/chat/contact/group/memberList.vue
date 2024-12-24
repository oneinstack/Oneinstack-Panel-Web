<template>
  <x-page :bgcolor="'#fff'">
    <template #title>
      <span class="title">{{ `${$t('chatRoom.grp_members')} (${conf.total})` }}</span>
    </template>
    <headSearch />
    <div>
      <div style="height: calc(100vh - 165rem);">
        <groupItem :groupID="conf.groupID" :isMore="false" :groupMemberList="conf.groupMemberList" @updteMember="conf.getGroupMemberList" />
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { capis } from '@/modules/chat/api';
import { onMounted, reactive } from 'vue';
import headSearch from '../com/headSearch.vue';
import groupItem from '../../conversation/details/com/groupItem.vue';
import System from '@/utils/System';
import csconversation from '@/modules/chat/sstore/csconversation';

const conf = reactive({
  groupMemberList: [] as any[],
  total: 0,
  groupID: '',
  async getGroupMemberList() {
    const { members, total } = await capis.getGroupMemberList(
      {
        filter: 0,
        groupID: conf.groupID,
        keyword: "",
        pagination: {
          pageNumber: 1,
          showNumber: 500,
        },
      }
    );
    conf.groupMemberList = members
    conf.total = total
  }
})

onMounted(async () => {
  const { groupID } = System.getRouterParams()
  conf.groupID = groupID
  let list = csconversation.groupMemberList
  if(list.length && list[0].groupID == groupID) {
    conf.groupMemberList = csconversation.groupMemberList
  }
  conf.getGroupMemberList()
});
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}
</style>
