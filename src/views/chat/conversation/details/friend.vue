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
      <img style="margin-left: 30rem;" src="/static/img/chat/setting_add.svg" />
    </div>
    <!-- <div class="edit flex-b-c">
      <div class="title">Search chat history</div>
      <van-icon name="arrow" size="30rem" color="#B8B8B8" />
    </div>
    <div class="m-t20">
      <div class="edit border_b flex-b-c">
        <div class="title">Mute Notification</div>
        <van-switch v-model="conf.muteChecked" size="33rem" active-color="#07c261" inactive-color="#95959D" />
      </div>
      <div class="edit border_b flex-b-c">
        <div class="title">Sticky on Top</div>
        <van-switch v-model="conf.topChecked" size="33rem" active-color="#07c261" inactive-color="#95959D" />
      </div>
      <div class="edit flex-b-c" style="margin-top: 0;">
        <div class="title">Alert</div>
        <van-switch v-model="conf.alertChecked" size="33rem" active-color="#07c261" inactive-color="#95959D" />
      </div>
    </div>
    <div class="edit flex-b-c">
      <div class="title">Background</div>
      <van-icon name="arrow" size="30rem" color="#B8B8B8" />
    </div>
    <div class="edit">
      <div class="title">Clear Chat History</div>
    </div> -->
  </x-page>
</template>
<script setup lang="ts">
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
