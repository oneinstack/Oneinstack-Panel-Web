<template>
  <x-page headerBgColor="#fff">
    <template #title>
      <span class="head-title">Chat Messages</span>
    </template>
    <!-- 成员列表 -->
    <groupItem
      :groupID="csconversation.currentConversation.groupID"
      :memberCount="csconversation.currentGroup.memberCount"
      :isNomal="!isAdmin && !isOwner"
      :groupMemberList="conf.groupMemberList"
    />

    <!-- 名称公告 -->
    <div class="m-t20">
      <div class="edit border_b flex-b-c">
        <div class="title">Group Name</div>
        <div class="more flex-center">
          <span>{{ csconversation.currentConversation.showName }}</span>
          <van-icon name="arrow" size="30rem" color="#B8B8B8" />
        </div>
      </div>
      <div class="edit flex-b-c" style="margin-top: 0;">
        <div class="title">Group QR code</div>
        <div class="more flex-center">
          <img style="width: 30rem;height: 30rem;" src="/static/images/group_setting_qrcode.png" />
          <van-icon name="arrow" size="30rem" color="#B8B8B8" />
        </div>
      </div>
    </div>
    <div class="edit flex-center">
      <div class="title" style="color: #f45551;">Leave</div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import groupItem from './groupItem.vue';
import IMSDK, {
  GroupMemberRole,
  IMMethods,
} from "openim-uniapp-polyfill";
import csconversation from '@/modules/chat/sstore/csconversation';
import { computed, onMounted, reactive } from 'vue'
const conf = reactive({
  groupMemberList: [] as any[],
  getGroupMemberList() {
    IMSDK.asyncApi(IMSDK.IMMethods.GetGroupMemberList, IMSDK.uuid(), {
      groupID: csconversation.currentConversation.groupID,
      filter: 0,
      offset: 0,
      count: !isAdmin && !isOwner ? 9 : 8,
    })
      .then(({ data }:any) => {
        console.log('6666');
        
        console.log(data);
        conf.groupMemberList = [...data];
        csconversation.groupMemberList = conf.groupMemberList
      })
      .catch((err:any) => {
        console.log(err);
      });
  },
})
const isOwner = computed(() => {
  return csconversation.currentMemberInGroup.roleLevel === GroupMemberRole.Owner;
})
const isAdmin = computed(() => {
  return csconversation.currentMemberInGroup.roleLevel === GroupMemberRole.Admin;
})

onMounted(() => {
  conf.groupMemberList = csconversation.groupMemberList
  conf.getGroupMemberList()

})
</script>
<style lang="less" scoped>
@import './index.less';
</style>
