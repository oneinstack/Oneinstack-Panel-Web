<template>
  <x-page class="chating-box" no-footer log>
    <x-log />
    <template #title>
      <span class="title">{{ csconversation.currentConversation.showName }}</span>
      <span class="title" v-if="csconversation.currentConversation.conversationType !== SessionType.Single">
        {{ '(' + (csconversation.currentGroup?.memberCount || 0) + ')' }}
      </span>
    </template>
    <template #right>
      <div class="flex flex-center" style="width: 86rem; height: 100%" @click="conf.goSetting">
        <van-icon name="ellipsis" size="48rem" color="#666" />
      </div>
    </template>
    <div class="col column relative">
      <MessageList
        class="col"
        style="height: 100%; overflow: auto"
        ref="chatBoxRef"
        :scrollTop="conf.chat.scrollTop"
        @click="conf.content.click"
      />
      <div
        class="row items-end chat-bottom"
        :style="{
          borderBottom: conf.emoji.show ? '1rem solid #d3d3d3' : 'none',
          pointerEvents: conf.getPlaceholder() ? 'none' : 'auto'
        }"
      >
        <div class="flex flex-center" style="height: 72rem">
          <VSIcon name="chat-yy" :size="56" />
        </div>
        <div class="col input-box" :class="{ 'disabled': conf.getPlaceholder() }">
          <div class="relative">
            <div class="absolute flex flex-center fit">{{ conf.getPlaceholder() }}</div>
            <CInput ref="inputRef" @click="conf.input.click" v-model="conf.input.message" @enter="conf.chat.send" />
          </div>
        </div>
        <div class="flex flex-center" style="height: 72rem; gap: 10rem">
          <VSIcon name="chat-keybord" :size="56" @click="conf.input.focus" v-if="conf.emoji.show" />
          <VSIcon name="chat-emoji" :size="56" @click="conf.emoji.open" v-if="!conf.emoji.show" />
          <div class="relative row flex-center no-wrap">
            <div class="chat-plus" :class="{ 'show': !conf.input.isNull() }">
              <VSIcon class="absolute" name="chat-plus" :size="56" @click="conf.tools.open" />
            </div>
            <div
              class="android-send-btn flex flex-center"
              @click="conf.chat.send"
              :class="{ 'show': conf.input.isNull() }"
            >
              {{ $t('chatRoom.send') }}
            </div>
          </div>
        </div>
      </div>
      <div class="bottom-box" v-if="!conf.input.hiddenBottomBox" :class="{ show: conf.emoji.show || conf.tools.show }">
        <div class="emoji-box column no-wrap" :class="{ show: conf.emoji.show }">
          <template v-if="conf.emoji.history.length">
            <div class="emoji-title">{{ $t('chatRoom.RecentlyUsed') }}</div>
            <div class="row">
              <div class="emoji-item" v-for="item in conf.emoji.history">
                <img class="img" :src="`/static/chat/emoji/${item}.png`" @click="conf.emoji.insertEmoji(item)" />
              </div>
            </div>
          </template>
          <div class="emoji-title">{{ $t('chatRoom.AllStickers') }}</div>
          <div class="row" v-if="conf.emoji.show">
            <div class="emoji-item" v-for="(item, index) in 109">
              <x-img
                class="img"
                :src="`/static/chat/emoji/${index}.png`"
                @click="conf.emoji.insertEmoji(index)"
                cache
              />
            </div>
          </div>
        </div>

        <toolsVue :show="conf.tools.show" />
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { EPage } from '@/enum/Enum'
import { noticeMessageTypes } from '@/modules/chat/constant'
import cscontact from '@/modules/chat/sstore/cscontact'
import csconversation from '@/modules/chat/sstore/csconversation'
import csmessage from '@/modules/chat/sstore/csmessage'
import csuser from '@/modules/chat/sstore/csuser'
import { tipMessaggeFormat } from '@/modules/chat/utils/cUtil'
import sapp from '@/sstore/sapp'
import System from '@/utils/System'
import { GroupMemberRole, GroupStatus, MessageItem, SessionType } from 'openim-uniapp-polyfill'
import { Scope } from 'tools-vue3'
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import CInput from './com/cinput.vue'
import toolsVue from './com/tools.vue'
import MessageList from './message/list.vue'
const event = Scope.Event()
const chatBoxRef = ref<any>()
const inputRef = ref({} as any)
const timer = Scope.Timer()

const conf = reactive({
  /**
   * 返回事件函数id
   */
  funId: '_chat_content' + StrUtil.getId(),
  input: {
    message: '',
    isNull: () => {
      let _msg = conf.input.message.trim()
      _msg = _msg
        .replace(/<br>/g, '')
        .replace(/<div>/g, '')
        .replace(/<\/div>/g, '')
      return _msg.length > 0 && System.platform === 'android'
    },
    click: () => {
      conf.emoji.show = false
      conf.tools.show = false
      timer.once(() => {
        conf.content.toBottom()
      }, 100)

      conf.input.hiddenBottomBox = true
      timer.once(() => {
        conf.input.hiddenBottomBox = false
      }, 100)
    },
    focus: () => {
      conf.emoji.show = false
      conf.tools.show = false
      inputRef.value.focus()
      conf.input.hiddenBottomBox = true
      timer.once(() => {
        conf.input.hiddenBottomBox = false
      }, 100)
    },
    /**
     * 强制控制底部隐藏
     */
    hiddenBottomBox: false
  },
  content: {
    toBottom: async (ani = false, time = 0) => {
      chatBoxRef.value.showLastData()
      timer.once(() => {
        chatBoxRef.value.toBottom(ani)
      }, time)
    },
    click: () => {
      conf.emoji.show = false
      conf.tools.show = false
    }
  },
  emoji: {
    show: false,
    open: async () => {
      const run = () => {
        conf.content.toBottom(false, 300)
        conf.tools.show = false
        conf.emoji.show = true
        conf.emoji.history = Cookie.get('emojiHistory') || []
        sapp.backbtn.funMap[conf.funId] = () => {
          conf.emoji.show = false
        }
      }
      if (!System.isNative && !conf.tools.show) timer.once(run, 100)
      else run()
    },
    history: Cookie.get('emojiHistory') || [],
    historyArr: Cookie.get('emojiHistory') || [],
    insertEmoji: (index: number) => {
      let _url = `/static/chat/emoji/${index}.png`
      inputRef.value.insertEmoji(_url)

      if (conf.emoji.historyArr.includes(index)) {
        conf.emoji.historyArr.splice(conf.emoji.historyArr.indexOf(index), 1)
      }
      conf.emoji.historyArr.unshift(index)
      conf.emoji.historyArr = conf.emoji.historyArr.splice(0, 9)
      Cookie.set('emojiHistory', conf.emoji.historyArr)
    }
  },
  tools: {
    show: false,
    open: () => {
      conf.content.toBottom(false, 300)
      conf.emoji.show = false
      conf.tools.show = true
      sapp.backbtn.funMap[conf.funId] = () => {
        conf.tools.show = false
      }
    },
    close: () => {
      conf.tools.show = false
      delete sapp.backbtn.funMap[conf.funId]
    }
  },
  chat: {
    firstItem: {} as MessageItem,
    lastItem: {} as MessageItem,
    list: [] as any,
    messageLoadState: {
      lastMinSeq: 0,
      loading: false
    },
    /**
     * 滚动到顶部事件通知
     */
    async scrollTop() {
      return new Promise(async (resolve) => {
        System.loading()
        //等待数据处理完毕
        event.once('scrollTopFinish', () => {
          System.loading(false)
          resolve(true)
        })
        let l = csmessage.historyMessageList.length
        if (!conf.chat.messageLoadState.loading && csmessage.hasMoreMessage) {
          await conf.chat.loadMessageList(true)
        }
        //如果数据没有变化，则数据处理完毕
        if (l === csmessage.historyMessageList.length) {
          System.loading(false)
          resolve(true)
        }
      })
    },
    async loadMessageList(isLoadMore = false) {
      conf.chat.messageLoadState.loading = true
      const lastMsgID = csmessage.historyMessageList[0]?.clientMsgID
      const options = {
        conversationID: csconversation.currentConversation.conversationID,
        userID: '',
        groupID: '',
        count: 20,
        startClientMsgID: conf.chat.list[0]?.clientMsgID ?? '',
        lastMinSeq: conf.chat.messageLoadState.lastMinSeq
      }
      try {
        const { emptyFlag, lastMinSeq } = await csmessage.getHistoryMessageList(options)
        conf.chat.messageLoadState.lastMinSeq = lastMinSeq
        if (emptyFlag) {
          console.log('initSuccess')
        }
      } catch (e) {
        console.log(e)
      }
      nextTick(function () {
        conf.chat.messageLoadState.loading = false
      })
    },
    send: async () => {
      const message: any = await csmessage.createTextMessage(inputRef.value.getMessage())
      conf.input.message = ''
      inputRef.value.clear(!conf.emoji.show)
      csmessage.sendMessage(message)
    },
    isInit: false
  },
  goSetting() {
    const url =
      csconversation.currentConversation.conversationType == SessionType.Single
        ? '/chat/details/friend'
        : '/chat/details/group'
    System.router.push(url)
  },
  /**
   * 设置额外数据
   */
  setItem: (item: (typeof csmessage.historyMessageList)[0]) => {
    item.senderFaceUrl = item.senderFaceUrl || '/static/img/home-banner.png'
    item.isme = item.sendID === csuser.selfInfo.userID

    // 通知内容
    const isNoticeMessage = noticeMessageTypes.includes(item.contentType)
    item.noticeContent = !isNoticeMessage ? '' : tipMessaggeFormat(item, csuser.selfInfo.userID)
  },
  getPlaceholder: () => {
    const isSingle = csconversation.currentConversation.conversationType === SessionType.Single
    if (!isSingle && csconversation.currentGroup.status === GroupStatus.Muted) {
      return csconversation.currentMemberInGroup.roleLevel !== GroupMemberRole.Nomal ? '' : '群主或管理员已开启全体禁言'
    }
    if (
      !isSingle &&
      (csconversation.currentGroup.status === GroupStatus.Dismissed ||
        csconversation.currentMemberInGroup.groupID !== csconversation.currentGroup.groupID)
    ) {
      return '您已不在该群组'
    }
    if (!isSingle && csconversation.currentMemberInGroup.muteEndTime > Date.now()) {
      return `你已被禁言`
    }
    if (isSingle && cscontact.blackList.find((black) => black.userID === csconversation.currentConversation.userID)) {
      return '对方已被拉入黑名单'
    }
    return ''
  }
})

watch(
  () => csmessage.historyMessageList,
  async () => {
    if (!csmessage.historyMessageList.length) return
    //设置额外数据
    csmessage.historyMessageList.forEach((item) => conf.setItem(item))

    if (conf.chat.isInit) {
      const newData = [...csmessage.historyMessageList]
      const lastItem = newData.findIndex((item) => item.clientMsgID === conf.chat.lastItem.clientMsgID)
      const firstItem = newData.findIndex((item) => item.clientMsgID === conf.chat.firstItem.clientMsgID)
      const lastItemData = newData.slice(lastItem + 1)
      const firstItemData = newData.slice(0, firstItem)
      if (lastItemData.length > 0) {
        //向尾部插入数据
        conf.chat.lastItem = lastItemData[lastItemData.length - 1]
        for (let i = 0; i < lastItemData.length; i++) {
          await chatBoxRef.value.insertData(lastItemData[i])
        }
      } else {
        //向头部插入数据
        conf.chat.firstItem = firstItemData[0]
        await chatBoxRef.value.unshiftData(firstItemData)
        //刷新顶部才会向头部插入数据，通知数据处理完毕
        event.emit('scrollTopFinish')
      }
    } else {
      conf.chat.isInit = true
      conf.chat.list = [...csmessage.historyMessageList]
      conf.chat.firstItem = csmessage.historyMessageList[0]
      conf.chat.lastItem = csmessage.historyMessageList[csmessage.historyMessageList.length - 1]
      await chatBoxRef.value.initData(csmessage.historyMessageList)
    }
  }
)

Scope.setConf(conf)
onMounted(() => {
  event.on(EPage.changeHeight, () => {
    if (!conf.emoji.show && !conf.tools.show) {
      conf.input.click()
    }
  })
  conf.chat.loadMessageList()
})
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}

.chating-box {
  ::v-deep(.c-head-nav) {
    border-bottom: 1rem solid #d3d3d3 !important;
  }
}
.chat-bottom {
  min-height: 98rem;
  width: 100%;
  padding: 15rem 20rem;
  border-top: 1rem solid #d3d3d3;
}
.input-box {
  width: 100%;
  background: #fff;
  margin: 0 20rem;
  padding: 0 10rem;
  border-radius: 6rem;
  min-height: 72rem;
  .input {
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
  }
  &.disabled {
    background-color: #dedede;
  }
}

.chat-plus {
  width: 0rem;
  height: 56rem;
  opacity: 0;
  transition: all 0.3s;
  pointer-events: none;
  &.show {
    width: 56rem;
    opacity: 1;
    pointer-events: all;
  }
}

.android-send-btn {
  width: 0rem;
  height: 60rem;
  background: #07c261;
  color: #fff;
  border-radius: 8rem;
  opacity: 0;
  transition: all 0.3s;
  font-size: 30rem;
  right: 0rem;
  pointer-events: none;
  &.show {
    opacity: 1;
    width: 112rem;
    pointer-events: all;
  }
}

.bottom-box {
  max-height: 0rem;
  transition: all 0.3s;
  overflow: hidden;
  &.show {
    max-height: 356rem;
  }
}

.emoji-box {
  width: 100%;
  height: 0rem;
  overflow: auto;
  padding-left: 30rem;
  background-color: #f1f1f1;
  opacity: 0;
  transition: all 0.3s;

  &.show {
    opacity: 1;
    height: 356rem;
  }

  .emoji-title {
    font-size: 24rem;
    color: #000;
    margin: 10rem 0;
  }
  .emoji-item {
    width: 52rem;
    height: 52rem;
    margin: 12rem;
    img {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
