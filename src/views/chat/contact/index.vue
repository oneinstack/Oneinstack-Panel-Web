<template>
  <x-page :show-back="false" tabbar>
    <template #title>
      <span class="title">{{ $t('chatRoom.contacts') }}</span>
    </template>
    <template #right>
      <div class="flex flex-center" style="width: 86rem; height: 100%" @click="">
        <img style="width: 44rem;height: 44rem;" src="/static/img/chat/contacts_add.png" />
      </div>
    </template>
    <div>
      <headSearch />
      <div style="background: #fff;">
        <template v-for="(item, index) in conf.meaus" :key="index">
          <div class="anchor-item" @click="conf.goPages(null,item)">
            <div class="item-author">
              <img style="width: 100%; height: 100%" :src="item.icon" />
              <div class="message-count flex flex-center" v-if="item.badge > 0">
                {{ item.badge < 99 ? item.badge : '99+' }}
              </div>
            </div>
            <div class="item-name">{{ item.title }}</div>
          </div>
        </template>
      </div>
    </div>
    <van-index-bar style="background: #FFF;" :index-list="conf.indexList">
      <template v-for="(item, index) in conf.userList" :key="index">
        <van-index-anchor :index="item.index" />
        <template v-for="(user, i2) in item.list" :key="i2">
          <div class="anchor-item" @click="conf.goPages('/chat/userCard')">
            <div class="item-author">
              <img style="width: 100%; height: 100%" src="/static/img/home-banner.png" />
            </div>
            <div class="item-name">{{ user }}</div>
          </div>
        </template>
      </template>
    </van-index-bar>
  </x-page>
</template>
<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import i18n from '@/lang'
import System from '@/utils/System';
import headSearch from './headSearch.vue';
import { ContactMenuTypes } from '@/modules/chat/constant'
const conf = reactive({
  indexList: [] as any[],
  meaus: [{
    idx: 0,
    type: ContactMenuTypes.NewFriend,
    title: i18n.t('chatRoom.new_friend'),
    icon: '/static/img/chat/new_friends.png',
    badge: 120
  },
  {
    idx: 1,
    type: ContactMenuTypes.NewGroup,
    title: i18n.t('chatRoom.new_grp'),
    icon: '/static/images/contact_new_group.png',
    badge: 5
  },
  {
    idx: 2,
    type: ContactMenuTypes.MyGroup,
    title: i18n.t('chatRoom.my_grps'),
    icon: '/static/img/chat/new_group.png',
    badge: 12
  }],
  userList: [{
    index: 'A',
    list: ['a11', 'a22', 'a33', 'a44', 'a55', 'a66']
  }, {
    index: 'B',
    list: ['b11', 'b22', 'b33', 'b44', 'b55', 'b66']
  }, {
    index: 'C',
    list: ['c11', 'c22', 'c33', 'c44', 'c55', 'c66']
  }, {
    index: '#',
    list: ['/1223', '!22', '#33', '%44', '*55', '*66']
  }],
  goPages(url: any,item = null as any) {
    if(url && url != null) return System.router.push(url)

    if(item.idx < 2) return System.router.push({ path: '/chat/applicationList', query: { type: item.type} })
  }
})
const init = () => {
  conf.indexList = conf.userList.map((item:any) => {
    return item.index
  })
}
onMounted(() => {
  init()
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

.anchor-item {
  display: flex;
  align-items: center;
  border-bottom: 2rem #F6F7FA solid;
  padding: 20rem 24rem;

  .item-author {
    width: 76rem;
    height: 76rem;
    border-radius: 8rem;
    margin-right: 26rem;
    position: relative;
    .message-count {
      position: absolute;
      top: 0;
      right: 0;
      height: 36rem;
      background-color: #f45551;
      border-radius: 18rem;
      padding: 0 10rem;
      text-align: center;
      line-height: 36rem;
      transform: translate(50%, -50%);
      color: #fff;
    }
  }

  .item-name {
    font-size: 30rem;
    color: #333333;
    font-weight: 500;
  }
}
::v-deep .van-index-bar__sidebar{
  position: absolute;
}
</style>
