<template>
  <x-page>
    <template #title>
      <span class="head-title">Chat details</span>
    </template>
    <div class="user">
      <div class="info" @click="conf.toUserCard">
        <img :src="csconversation.currentConversation.faceURL" />
        <van-text-ellipsis :content="csconversation.currentConversation.showName" />
      </div>
      <img style="margin-left: 30rem;" src="/static/img/chat/setting_add.svg" @click="conf.toGroup" />
    </div>
  </x-page>
</template>
<script setup lang="ts">
import cscontact from '@/modules/chat/sstore/cscontact';
import csconversation from '@/modules/chat/sstore/csconversation';
import System from '@/utils/System';
import { onMounted, reactive } from 'vue'
const conf = reactive({
  muteChecked: false,
  topChecked: true,
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
onMounted(() => {
  console.log(csconversation.currentConversation);

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

  img {
    width: 90rem;
    height: 90rem;
    border-radius: 8rem;
  }
}

@import './index.less';
</style>
