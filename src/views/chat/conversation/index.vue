<template>
  <x-page :show-back="false" tabbar>
    <template #title>
      <span class="title">{{ $t('chatRoom.messages') }}</span>
    </template>
    <template #right>
      <div class="flex flex-center" style="width: 86rem; height: 100%" @click="">
        <van-icon name="add-o" size="22" color="#333333" />
      </div>
    </template>
    <div>
      <div class="search-box flex flex-center">
        <van-icon name="search" size="15" color="#B9B9B9" />
        <span>Search</span>
      </div>
      <van-swipe-cell v-for="item in conf.list">
        <div class="user-item" :class="{ pinned: item.isPinned }">
          <div class="row items-center" style="height: 92rem">
            <div style="width: 92rem; height: 100%; border-radius: 8rem; overflow: hidden; margin-right: 26rem">
              <img style="width: 100%; height: 100%" :src="item.faceURL" />
            </div>
            <div class="col">
              <div class="row" style="width: 44rem; width: 100%">
                <div class="col" style="font-size: 32rem; color: #333333; font-weight: 500">
                  {{ item.remark || item.nickname || item.groupName || item.showName }}
                </div>
                <div style="font-size: 24rem; color: #808080">{{ sutil.getShowTime(item.latestMsgSendTime) }}</div>
              </div>
              <div class="row ellipsis" style="display: block; font-size: 28rem; color: #b1b1b1">
                {{ item.latestMsg }}
              </div>
            </div>
          </div>
        </div>
        <template #right>
          <van-button
            square
            type="primary"
            :text="item.isPinned ? '取消置顶' : '置顶'"
            style="height: 100%; width: 180rem"
            @click="conf.top(item)"
          />
          <van-button square type="danger" text="删除" style="height: 100%; width: 152rem" @click="conf.delete(item)" />
        </template>
      </van-swipe-cell>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import sutil from '../../../sstore/sutil'
import {
  ConversationItem,
  FriendUserItem,
  GroupAtType,
  GroupItem,
  MessageReceiveOptType,
  SessionType
} from 'openim-uniapp-polyfill'
const conf = reactive({
  list: [] as (ConversationItem & FriendUserItem & GroupItem)[],
  getList: async () => {
    for (let i = 0; i < 30; i++) {
      conf.list.push({
        userID: i + '',
        isPinned: MathUtil.getRandomInt(0, 10) > 9,
        conversationID: i + '',
        conversationType: 1 as SessionType,
        groupID: '',
        showName: '',
        faceURL: '/static/img/home-banner.png',
        recvMsgOpt: 0 as MessageReceiveOptType,
        unreadCount: 0,
        groupAtType: 0 as GroupAtType,
        latestMsg: 'hello-=-------==================' + i * MathUtil.getRandomInt(1, 3000),
        latestMsgSendTime: new Date().getTime() - MathUtil.getRandomInt(1, 1000000) * 36000,
        draftText: '',
        draftTextTime: 0,
        isNotInGroup: false,
        isPrivateChat: false,
        attachedInfo: '',
        ex: '',
        remark: 'Remark_' + i + ''
      } as any)
    }

    conf.listSort()
    return conf.list
  },
  listSort: () => {
    const plist = conf.list.filter((i) => i.isPinned)
    const nlist = conf.list.filter((i) => !i.isPinned)

    nlist.sort((a, b) => {
      return b.latestMsgSendTime - a.latestMsgSendTime
    })
    plist.sort((a, b) => {
      return b.latestMsgSendTime - a.latestMsgSendTime
    })

    conf.list = [...plist, ...nlist]
  },
  top: (item: any) => {
    item.isPinned = !item.isPinned
    conf.listSort()
  },
  delete: (item: any) => {
    conf.list = conf.list.filter((i) => i.conversationID !== item.conversationID)
  }
})

onMounted(() => {
  conf.getList()
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

.user-item {
  width: 100%;
  background: #fff;
  padding: 24rem 26rem;
  border-bottom: 2rem solid #f6f7fa;
  &.pinned {
    background-color: #f1f1f1;
  }
}
</style>
