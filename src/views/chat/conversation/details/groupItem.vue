<template>
  <div class="user">
    <div class="user-list">
      <template v-for="item in groupMemberList" :key="item.userID">
        <div class="info" @click="conf.goPages(`/chat/userCard?sourceID=${item.userID}`)">
          <img :src="item.faceURL" />
          <van-text-ellipsis :content="item.nickname" />
        </div>
      </template>
      <img src="/static/img/chat/setting_add.svg" />
    </div>
    <div class="more flex-center" v-if="groupMemberList.length>19">
      <span>View more group members</span>
      <van-icon name="arrow" size="30rem" color="#B8B8B8" />
    </div>
  </div>
</template>
<script setup lang="ts">
import System from '@/utils/System';
import { reactive } from 'vue';

const props = defineProps({
  groupID:{
    default: ''
  },
  memberCount: {
    default: 0
  },
  isNomal: {
    default: false
  },
  groupMemberList: {
    default: [] as any[]
  }
})
const conf = reactive({
  goPages(url:any) {
    System.router.push(url)
  }
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
