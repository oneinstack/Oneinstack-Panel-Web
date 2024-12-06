<template>
  <x-page backColor="#666" headerBgColor="#fff">
    <template #title>
      <span class="title">Chat Messages</span>
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
        <van-icon name="arrow" size="16" color="#B8B8B8" />
      </div>
    </div>

    <!-- 名称公告 -->
    <div style="margin-top: 20rem;">
      <div class="edit border_b flex-b-c">
        <div class="title">Group Name</div>
        <div class="more flex-center">
          <span>Zoo</span>
          <van-icon name="arrow" size="16" color="#B8B8B8" />
        </div>
      </div>
      <div class="edit border_b">
        <div class="title">Sticky on Top</div>
        <div class="more flex-b">
          <span>dsigjjhejahdsjzfdfjNWGJHFDJBNJXZCTREYTVSNVJKSndjkgvBNSFJKBNFDJKAGBDJVSNVJKSndjkgvBNSFJKBNFDJKAGBDJ
          </span>
          <van-icon style="margin-top: 8rem;" name="arrow" size="16" color="#B8B8B8" />
        </div>
      </div>
      <div class="edit flex-b-c" style="margin-top: 0;">
        <div class="title">Remark</div>
        <van-icon name="arrow" size="16" color="#B8B8B8" />
      </div>
    </div>

    <div class="edit flex-b-c">
      <div class="title">Search chat history</div>
      <van-icon name="arrow" size="16" color="#B8B8B8" />
    </div>

    <!-- 开关 -->
    <div style="margin-top: 20rem;">
      <div class="edit border_b flex-b-c">
        <div class="title">Mute Notification</div>
        <van-switch v-model="conf.muteChecked" size="18" active-color="#07c261" inactive-color="#95959D" />
      </div>
      <div class="edit border_b flex-b-c">
        <div class="title">-Minimize Group</div>
        <van-switch v-model="conf.alertChecked" size="18" active-color="#07c261" inactive-color="#95959D" />
      </div>
      <div class="edit flex-b-c" style="margin-top: 0;">
        <div class="title">Sticky on Top</div>
        <van-switch v-model="conf.topChecked" size="18" active-color="#07c261" inactive-color="#95959D" />
      </div>
    </div>

    <div style="margin-top: 20rem;">
      <div class="edit border_b flex-b-c">
        <div class="title">My Alias in Group</div>
        <div class="more flex-center">
          <span>Lucky boy</span>
          <van-icon name="arrow" size="16" color="#B8B8B8" />
        </div>
      </div>
      <div class="edit flex-b-c" style="margin-top: 0;">
        <div class="title">On-Screen Names</div>
        <van-switch v-model="conf.topChecked" size="18" active-color="#07c261" inactive-color="#95959D" />
      </div>
    </div>

    <div class="edit flex-b-c">
      <div class="title">Background</div>
      <van-icon name="arrow" size="16" color="#B8B8B8" />
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
.title {
  font-size: 30rem;
  color: #000;
}

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

.more {
  color: #999;
  font-size: 26rem;
  margin-top: 10rem;

  span {
    margin-right: 10rem;
    word-wrap: break-word;
    word-break: break-all;
  }
}

.flex-b {
  display: flex;
  justify-content: space-between;
}
.flex-b-c {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit {
  background: #FFF;
  padding: 24rem 24rem;
  margin-top: 20rem;

  .title {
    font-size: 28rem;
    font-weight: 500;
    color: #000;
  }
}

.border_b {
  border-bottom: 2rem solid #F6F7FA;
  margin-top: 0rem;
}
</style>
