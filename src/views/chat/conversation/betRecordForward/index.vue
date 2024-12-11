<template>
  <x-page>
    <template #title>
      <span class="title">{{ $t('chatRoom.Selected') }}</span>
    </template>
    <template #right>
      <bet-record-header class="header" :isSingleSelection="conf.isSingleSelection" :selectTotal="selectTotal"
        @change-select-mode="conf.hanldeChangeSelectMode" @click-send="conf.modal.show = true" />
    </template>

    <bet-record-filter v-show="conf.isSingleSelection" @search="conf.hanldeFilter" />

    <recently-forwarded v-if="conf.recentlyForwardedData.length" :list="conf.recentlyForwardedData"
      :checkeds="conf.selectedChats" :isSingleSelection="conf.isSingleSelection" @select="conf.handleSelect"
      @item-click="conf.hanldeItemClick" />

    <recently-chatting :list="conf.chatListData" :checkeds="conf.selectedChats"
      :isSingleSelection="conf.isSingleSelection" class="recently_chatting" @select="conf.handleSelect"
      @row-click="conf.hanldeItemClick" />

    <van-dialog :show="conf.modal.show" showCancelButton :confirmButtonText="conf.modal.confirmText" :cancelButtonText="conf.modal.cancelText"
      @cancel="conf.modal.handleCancel" @confirm="conf.modal.handleConfirm">
      <div class="modal_container">
        <div class="title" v-if="!conf.isComplete">{{ $t('chatRoom.sendTo') }}：</div>
        <div class="title" v-else>{{ $t('chatRoom.sharingSuccess') }}!</div>
        <div class="chats" v-show="!conf.isComplete">
          <div v-for="itemId in conf.selectedChats" :key="itemId" class="flex items-center">
            <img class="group_chat_img" :src="conf.getChatItemById(itemId).imgUrl" alt="" srcset="" />
            <span v-if="conf.isSingleSelection">{{ conf.getChatItemById(itemId).name }}</span>
          </div>
        </div>
      </div>
    </van-dialog>
  </x-page>
</template>

<script setup lang="ts">
import BetRecordHeader from './components/BetRecordHeader.vue'
import BetRecordFilter from './components/BetRecordFilter.vue'
import RecentlyForwarded from './components/RecentlyForwarded.vue'
import RecentlyChatting from './components/RecentlyChatting.vue'
// import IMSDK, { IMMethods, SessionType } from 'openim-uniapp-polyfill'
// import MyAvatar from '@/components/MyAvatar/index.vue'
// import { CustomData } from '@/sstore/sim'
// import { mapGetters } from 'vuex'
// import { offlinePushInfo } from '@/util/imCommon'
import i18n from '@/lang'
import { computed, onMounted, reactive } from 'vue'
import System from '@/utils/System'
import sutil from '@/sstore/sutil'

const conf = reactive({
  isSingleSelection: true, // 是否单选
  chatListData: [] as any[],
  copyChatlistData: [] as any[],
  recentlyForwardedData: [] as any[], // 最近转发数据
  selectedChats: [] as any[], // 选择的聊天
  isComplete: false,
  modal: {
    show: false, // 模态框是否显示
    confirmText: i18n.t('chatRoom.confirm'),
    cancelText: i18n.t('chat.cancle'),
    handleCancel: () => {
      if (conf.modal.confirmText != i18n.t('chatRoom.backGamePage')) conf.modal.show = false
      else System.router.push('/chat/conversation')
      // conf.modal.show = false
      // conf.selectedChats = []
      // conf.isComplete = false
      // conf.modal.confirmText = '发送'
      // conf.modal.cancelText = '取消'
    },
    handleConfirm: () => {
      if (!conf.isComplete) return conf.handleSend()
      sutil.pageBack()
    }
  },
  isGroup(type: any) {
    // return type === SessionType.WorkingGroup
  },

  getChatItemById(id: any) {
    return conf.chatListData.find((item: any) => item.id === id)
  },

  hanldeFilter(keyword: any) {
    console.log(keyword);
    conf.modal.show = true
    if (!keyword) return conf.chatListData = conf.copyChatlistData
    conf.chatListData = conf.chatListData.filter((item: any) => item.name.toLowerCase().includes(keyword.toLowerCase()))
  },

  hanldeChangeSelectMode(active: any) {
    conf.isSingleSelection = active
  },

  handleSelect(isSelect: any, selectItem: any) {
    if (!isSelect && conf.selectedChats.includes(selectItem.id)) {
      conf.selectedChats = conf.selectedChats.filter((item) => item !== selectItem.id)
    } else conf.selectedChats.push(selectItem.id)
  },

  hanldeItemClick(item: any) {
    if (conf.isSingleSelection) {
      conf.selectedChats = [item.id]
      conf.modal.show = true
      return
    }
    conf.handleSelect(!conf.selectedChats.includes(item.id), item)
  },

  handleSend() {
    // 发送消息
    // const data = CustomData.ShareBet
    // const shareName = conf.storeSelfInfo.nickname
    // const betRecord = JSON.parse(Cookie.get('betRecord'))
    // conf.selectedChats.forEach(async (itemid) => {
    //   const sitem = conf.getChatItemById(itemid)
    //   console.log('sitem', sitem);
    //   const betList = [betRecord]
    //   betList.forEach(async (betitem) => {
    //     betitem.shareName = shareName
    //     betitem.betUserId = sitem.userID
    //     const extension = {
    //       data: betitem
    //     }
    //     try {
    //       IMSDK.asyncApi(IMMethods.CreateCustomMessage, IMSDK.uuid(), {
    //         data,
    //         extension: JSON.stringify(extension),
    //         description: data
    //       }).then((message) => {
    //         const sendMessage = (message, info) => {
    //           IMSDK.asyncApi(IMMethods.SendMessage, IMSDK.uuid(), {
    //             recvID: info.userID,
    //             groupID: info.groupID,
    //             message,
    //             offlinePushInfo
    //           })
    //             .then(({ data }) => {
    //               System.toast(i18n.t('chatRoom.sharingSuccess'),'success')
    //               conf.isComplete = true
    //               conf.modal.confirmText = i18n.t('chatRoom.backGamePage')
    //               conf.modal.cancelText = i18n.t('chatRoom.toImPage')
    //               conf.modal.show = true
    //             })
    //             .catch(({ data, errCode, errMsg }) => {
    //             })
    //         }
    //         sendMessage(message, {
    //           userID: sitem.userID,
    //           groupID: sitem.groupID
    //         })
    //         if (!conf.recentlyForwardedData.find((item:any) => item.id === sitem.id)) conf.recentlyForwardedData.unshift(sitem)
    //         Cookie.set('recentlyForwardedData', JSON.stringify(conf.recentlyForwardedData))
    //       })
    //     } catch (e) {
    //       console.log(e);
    //     }
    //   })
    // })
    // conf.modal.show = false
    // conf.selectedChats = []
  },

  initData() {
    // System.loading()
    // IMSDK.asyncApi('getAllConversationList', IMSDK.uuid())
    //   .then(({ data }) => {
    //     System.loading(false)
    //     conf.chatListData = data.map((item:any) => ({
    //       id: item.userID || item.groupID,
    //       imgUrl: item.faceURL,
    //       name: item.showName,
    //       conversationID: item.conversationID,
    //       groupID: item.groupID,
    //       userID: item.userID,
    //       type: item.conversationType,
    //     }))
    //     conf.copyChatlistData = conf.chatListData
    //   })
    //   .catch(({ errCode, errMsg }) => {
    //     uni.showToast({
    //       title: '获取列表失败请重试',
    //       icon: 'error'
    //     })
    //   })
  }
})

const selectTotal = computed(() => {
  return conf.selectedChats.length
  // ...mapGetters(['storeSelfInfo'])

})

onMounted(() => {
  const storageData = Cookie.get('recentlyForwardedData')
  if (storageData) conf.recentlyForwardedData = JSON.parse(storageData)
  conf.initData()
})

</script>

<style scoped lang="less">
.title {
  font-size: 32rem;
  color: #000;
}

.modal_container {
  width: 100%;
  display: flex;
  flex-flow: column;
  padding: 30rem;

  .title {
    margin-bottom: 12rem;
    font-weight: bold;
  }

  .chats {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-flow: row wrap;
    margin: 20rem 0;
    gap: 12rem;

    .group_chat_img {
      width: 72rem;
      height: 72rem;
      border-radius: 8rem;
      margin-right: 24rem;
    }
  }

  .text {
    padding-left: 12rem;
    color: #666;
  }
}
</style>