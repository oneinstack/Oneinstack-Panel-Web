<template>
  <x-page headerBgColor="#fff">
    <template #title>
      <span class="head-title">Chat Messages</span>
    </template>
    <!-- 成员列表 -->
    <div class="user">
      <div class="user-list">
        <template v-for="(item) in 19" :key="item">
          <div class="info">
            <img src="/static/img/home-banner.png" />
            <van-text-ellipsis :content="'input dield input'" />
          </div>
        </template>
        <img src="/static/img/chat/setting_add.svg" />
      </div>
      <div class="more flex-center">
        <span>View more group members</span>
        <van-icon name="arrow" size="30rem" color="#B8B8B8" />
      </div>
    </div>

    <!-- 名称公告 -->
    <div class="m-t20">
      <div class="edit border_b flex-b-c">
        <div class="title">Group Name</div>
        <div class="more flex-center">
          <span>Zoo</span>
          <van-icon name="arrow" size="30rem" color="#B8B8B8" />
        </div>
      </div>
      <div class="edit border_b">
        <div class="title">Sticky on Top</div>
        <div class="more flex-b">
          <span>dsigjjhejahdsjzfdfjNWGJHFDJBNJXZCTREYTVSNVJKSndjkgvBNSFJKBNFDJKAGBDJVSNVJKSndjkgvBNSFJKBNFDJKAGBDJ
          </span>
          <van-icon style="margin-top: 8rem;" name="arrow" size="30rem" color="#B8B8B8" />
        </div>
      </div>
      <div class="edit flex-b-c" style="margin-top: 0;">
        <div class="title">Remark</div>
        <van-icon name="arrow" size="30rem" color="#B8B8B8" />
      </div>
    </div>

    <div class="edit flex-b-c">
      <div class="title">Search chat history</div>
      <van-icon name="arrow" size="30rem" color="#B8B8B8" />
    </div>

    <!-- 开关 -->
    <div class="m-t20">
      <div class="edit border_b flex-b-c">
        <div class="title">Mute Notification</div>
        <van-switch v-model="conf.muteChecked" size="33rem" active-color="#07c261" inactive-color="#95959D" />
      </div>
      <div class="edit border_b flex-b-c">
        <div class="title">-Minimize Group</div>
        <van-switch v-model="conf.alertChecked" size="33rem" active-color="#07c261" inactive-color="#95959D" />
      </div>
      <div class="edit flex-b-c" style="margin-top: 0;">
        <div class="title">Sticky on Top</div>
        <van-switch v-model="conf.topChecked" size="33rem" active-color="#07c261" inactive-color="#95959D" />
      </div>
    </div>

    <div class="m-t20">
      <div class="edit border_b flex-b-c">
        <div class="title">My Alias in Group</div>
        <div class="more flex-center">
          <span>Lucky boy</span>
          <van-icon name="arrow" size="30rem" color="#B8B8B8" />
        </div>
      </div>
      <div class="edit flex-b-c" style="margin-top: 0;">
        <div class="title">On-Screen Names</div>
        <van-switch v-model="conf.topChecked" size="33rem" active-color="#07c261" inactive-color="#95959D" />
      </div>
    </div>

    <div class="edit flex-b-c">
      <div class="title">Background</div>
      <van-icon name="arrow" size="30rem" color="#B8B8B8" />
    </div>

    <div class="edit flex-b-c">
      <div class="title">Clear Chat History</div>
    </div>

    <div class="edit flex-center">
      <div class="title" style="color: #f45551;">Leave</div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { reactive } from 'vue'
const conf = reactive({
  muteChecked: true,
  topChecked: true,
  alertChecked: false
})
</script>
<style lang="less" scoped>
.user {
  background: #fff;
  padding: 20rem 30rem 30rem;

  .user-list {
    display: flex;
    flex-wrap: wrap;

    .info {
      width: 15%;
      color: #999;
      font-size: 22rem;
      margin-right: 6.25%;
      margin-bottom: 20rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      &:nth-child(5n + 5) {
        margin-right: 0rem;
      }
    }

    img {
      width: 96rem;
      height: 96rem;
      border-radius: 8rem;
    }
  }
}
@import './index.less';
</style>
