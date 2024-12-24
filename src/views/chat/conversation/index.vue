<template>
  <x-page :show-back="false" tabbar>
    <template #title>
      <span class="title">{{ $t('chatRoom.messages') }}</span>
    </template>
    <template #right>
      <div class="flex flex-center relatvie" style="width: 86rem; height: 100%" @click="conf.addDialog.show = true">
        <van-icon name="add-o" size="44rem" color="#333333" />
        <addDialog v-model:show="conf.addDialog.show" />
      </div>
    </template>
    <div class="relative">
      <div class="search-box flex flex-center">
        <van-icon name="search" size="15" color="#B9B9B9" />
        <span>{{ $t('chatRoom.search') }}</span>
      </div>
      <template v-if="csconversation.conversationList.length > 0">
        <van-swipe-cell v-for="(item, index) in csconversation.conversationList">
          <div class="user-item" :class="{ pinned: item.isPinned }" @click="conf.toChating(item)">
            <div class="row items-center" style="height: 92rem">
              <div class="relative face-box">
                <headImg class="face" :src="item.faceURL" :isGroup="item.groupID ? true : false" />
                <div class="message-count flex flex-center" v-if="item.unreadCount > 0">
                  {{ item.unreadCount < 99 ? item.unreadCount : '99+' }}
                </div>
              </div>
              <div class="col">
                <div class="row" style="width: 44rem; width: 100%">
                  <div class="col" style="font-size: 32rem; color: #333333; font-weight: 500">
                    {{ item.remark || item.nickname || item.groupName || item.showName }}
                  </div>
                  <div style="font-size: 24rem; color: #808080">{{ sutil.getTimeTip(item.latestMsgSendTime) }}</div>
                </div>
                <div
                  v-html="item.latestMessage"
                  class="row ellipsis"
                  style="display: block; font-size: 28rem; color: #b1b1b1"
                ></div>
              </div>
            </div>
            <div class="border-bottom" v-if="index !== conf.list.length - 1"></div>
          </div>
          <template #right>
            <van-button
              square
              type="primary"
              :text="item.isPinned ? $t('chatRoom.cancel') : $t('chatRoom.pin')"
              style="height: 100%; width: 180rem"
              @click="conf.top(item)"
            />
            <van-button
              square
              type="danger"
              :text="$t('chatRoom.remove')"
              style="height: 100%; width: 152rem"
              @click="conf.delete(item)"
            />
          </template>
        </van-swipe-cell>
      </template>
      <div class="border-right"></div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import csconversation from '@/modules/chat/sstore/csconversation'
import { parseMessageByType, prepareConversationState } from '@/modules/chat/utils/cUtil'
import System from '@/utils/System'
import IMSDK, { ConversationItem, FriendUserItem, GroupItem } from 'openim-uniapp-polyfill'
import { onMounted, reactive, watch } from 'vue'
import sutil from '../../../sstore/sutil'
import headImg from '../components/headImg.vue'
import addDialog from './components/addDialog.vue'
const conf = reactive({
  list: [] as (ConversationItem & FriendUserItem & GroupItem)[],
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
  top: async (item: any) => {
    IMSDK.asyncApi(IMSDK.IMMethods.PinConversation, IMSDK.uuid(), {
      conversationID: item.conversationID,
      isPinned: !item.isPinned
    })
      .then(() => {
        item.isPinned = !item.isPinned
        conf.listSort()
      })
      .catch(() => System.toast('置顶失败'))
  },
  delete: (item: any) => {
    IMSDK.asyncApi(IMSDK.IMMethods.DeleteConversationAndDeleteAllMsg, IMSDK.uuid(), item.conversationID)
      .then(() => csconversation.delConversationByCID(item.conversationID))
      .catch(() => System.toast('移除失败'))
  },
  toChating: (item: any) => {
    prepareConversationState(item)
  },
  initList: () => {
    //解析最新消息
    csconversation.conversationList.forEach((item) => {
      let parsedMessage = ''
      try {
        if (item.latestMsg !== '') parsedMessage = JSON.parse(item.latestMsg)
        parsedMessage = parseMessageByType(parsedMessage)
      } catch (e) {}
      item.latestMessage = parsedMessage
      if (item.groupID) {
        IMSDK.asyncApi(IMSDK.IMMethods.GetGroupMemberList, IMSDK.uuid(), {
          groupID: item.groupID,
          filter: 0,
          offset: 0,
          count: 9
        }).then(({ data }: any) => {
          if (data.length) {
            item.faceURL = data.map((v: any) => v.faceURL)
          }
        })
      }
    })

    csconversation.conversationList.sort((a, b) => b.isPinned - a.isPinned)
    console.log('cim', csconversation.conversationList)
    conf.listSort()
  },
  addDialog: {
    show: false
  }
})

watch(() => csconversation.conversationList, conf.initList)
onMounted(() => {
  conf.initList()
})
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}
.border-right {
  position: absolute;
  top: 0;
  right: 0;
  width: 1rem;
  height: 100%;
  background-color: #efefef;
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
  position: relative;
  &:active {
    background-color: #e5e5e5;
  }
  &.pinned {
    background-color: #efefef;
  }
  .border-bottom {
    position: absolute;
    bottom: 0;
    left: 138rem;
    right: 0;
    border-bottom: 2rem solid #e1e1e1;
  }
}

.face-box {
  width: 92rem;
  height: 100%;
  margin-right: 26rem;
  .face {
    width: 100%;
    height: 100%;
    border-radius: 8rem;
    object-fit: cover;
    overflow: hidden;
  }
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
</style>
