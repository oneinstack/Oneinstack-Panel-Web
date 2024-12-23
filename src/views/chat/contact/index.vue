<template>
  <x-page :show-back="false" tabbar>
    <template #title>
      <span class="title">{{ $t('chatRoom.contacts') }}</span>
    </template>
    <template #right>
      <div class="flex flex-center" style="width: 86rem; height: 100%" @click="conf.goPages('/chat/add/list')">
        <img style="width: 44rem;height: 44rem;" src="/static/img/chat/contacts_add.png" />
      </div>
    </template>
    <div>
      <!-- 搜索 -->
      <headSearch />
      <!-- 新加、群聊 -->
      <div style="background: #fff;">
        <template v-for="(item, index) in conf.meaus" :key="index">
          <userItem :item="item" :lastItem="index == (conf.meaus.length-1)" @click="conf.goPages(null, item)" />
        </template>
      </div>
    </div>
    <!-- 联系人列表 -->
    <van-index-bar style="background: #FFF;height: 100%;" :index-list="getIndexData.indexList">
      <template v-for="(item, index) in getIndexData.dataList" :key="index">
        <van-index-anchor :index="getIndexData.indexList[index]" />
        <template v-for="(user, i2) in item" :key="i2">
          <userItem :item="user" :lastItem="i2 == (item.length-1)" @click="conf.goPages(`/chat/userCard?sourceID=${user.userID}`)" />
        </template>
      </template>
    </van-index-bar>
  </x-page>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import i18n from '@/lang'
import System from '@/utils/System';
import headSearch from './com/headSearch.vue';
import userItem from './com/userItem.vue';
import { ContactMenuTypes } from '@/modules/chat/constant'
import cscontact from '@/modules/chat/sstore/cscontact'
import { formatChooseData } from '@/modules/chat/utils/cUtil';
const conf = reactive({
  indexList: [] as any[],
  meaus: [{
    idx: 0,
    type: ContactMenuTypes.NewFriend,
    title: i18n.t('chatRoom.new_friend'),
    faceURL: '/static/img/chat/new_friends.png',
    badge: cscontact.unHandleFriendApplicationNum
  },
  {
    idx: 1,
    type: ContactMenuTypes.NewGroup,
    title: i18n.t('chatRoom.new_grp'),
    faceURL: '/static/images/contact_new_group.png',
    badge: cscontact.unHandleGroupApplicationNum
  },
  {
    idx: 2,
    type: ContactMenuTypes.MyGroup,
    title: i18n.t('chatRoom.my_grps'),
    faceURL: '/static/img/chat/new_group.png',
    url: '/chat/groupList',
    badge: 0
  }],
  goPages(url: any, item = null as any) {
    let routeUrl = url || item.url || null
    if (routeUrl) return System.router.push(routeUrl)

    System.router.push({ path: '/chat/applicationList', query: { type: item.type } })
  }
})

const getIndexData = computed(() =>{
  return formatChooseData(cscontact.friendList)
})

onMounted(() => {
  console.log(cscontact.unHandleFriendApplicationNum);
  console.log(cscontact.recvFriendApplications);
  
  // console.log('666501');
  // let a = formatChooseData(cscontact.friendList)
  // console.log(a);
})
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}

.search-box {
  width: 716rem;
  height: 68rem;
  background-color: #ffffff;
  margin: 0 auto;
  border-radius: 4rem;
  margin-bottom: 20rem;

  span {
    font-size: 32rem;
    color: #b9b9b9;
    margin-left: 16rem;
  }
}

@media (min-width: 500px) {
  ::v-deep .van-index-bar__sidebar {
    left: 700rem;
  }
}
</style>
