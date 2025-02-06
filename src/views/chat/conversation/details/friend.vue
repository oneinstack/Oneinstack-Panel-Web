<template>
  <x-page>
    <template #title>
      <span class="head-title">{{ $t('chatRoom.chatDetails') }}</span>
    </template>
    <div class="user">
      <div class="info" @click="conf.toUserCard">
        <div class="img">
          <headImg :src="csconversation.currentConversation.faceURL" />
        </div>
        <van-text-ellipsis :content="csconversation.currentConversation.showName" />
      </div>
      <img class="img" style="margin-left: 30rem;" src="/static/img/chat/setting_add.svg" @click="conf.toGroup" />
    </div>
    <conversationSetting />
  </x-page>
</template>
<script setup lang="ts">
import cscontact from '@/modules/chat/sstore/cscontact';
import csconversation from '@/modules/chat/sstore/csconversation';
import conversationSetting from './com/conversationSetting.vue';
import System from '@/utils/System';
import headImg from '@/views/chat/components/headImg.vue';
import { reactive } from 'vue'
const conf = reactive({
  muteChecked: false,
  isPinned: false,
  alertChecked: false,
  toUserCard() {
    System.router.push(`/chat/userCard?sourceID=${csconversation.currentConversation.userID}`)
  },
  toGroup() {
    cscontact.getCheckedList = []
    let info = {
      userID: csconversation.currentConversation.userID,
      faceURL: csconversation.currentConversation.faceURL,
      nickname: csconversation.currentConversation.showName,
    }
    System.router.push(`/chat/createGroup?sourceInfo=${JSON.stringify(
      info,
    )}`)
  }
})
</script>
<style lang="less" scoped>
.user {
  display: flex;
  background: #fff;
  padding: 20rem 30rem;

  .info {
    width: 96rem;
    color: #999;
    font-size: 22rem;
    text-align: center;
  }

  .img {
    width: 90rem;
    height: 90rem;
    border-radius: 8rem;
    overflow: hidden;
  }
}

@import './index.less';
</style>
