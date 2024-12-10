<template>
  <x-page class="chating-box" no-footer log>
    <x-log />
    <template #title>
      <span class="title">{{ $t('chatRoom.contacts') }}</span>
    </template>
    <template #right>
      <div class="flex flex-center" style="width: 86rem; height: 100%" @click="">
        <van-icon name="ellipsis" size="48rem" color="#666" />
      </div>
    </template>
    <div class="col column relative">
      <div class="col" style="height: 100%; overflow: auto" ref="chatBoxRef" @click="conf.content.click">
        <div v-for="item in conf.chat.list" :key="item">
          <div v-html="item"></div>
        </div>
      </div>
      <div class="row items-end chat-bottom" :style="{ borderBottom: conf.emoji.show ? '1rem solid #d3d3d3' : 'none' }">
        <div class="flex flex-center" style="height: 72rem">
          <VSIcon name="chat-yy" :size="56" />
        </div>
        <div class="col input-box">
          <CInput ref="inputRef" @click="conf.input.click" v-model="conf.input.message" @enter="conf.sendMessage" />
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
              @click="conf.sendMessage"
              :class="{ 'show': conf.input.isNull() }"
            >
              发送
            </div>
          </div>
        </div>
      </div>
      <div class="bottom-box" v-if="!conf.input.hiddenBottomBox" :class="{ show: conf.emoji.show || conf.tools.show }">
        <div class="emoji-box column no-wrap" :class="{ show: conf.emoji.show }">
          <template v-if="conf.emoji.history.length">
            <div class="emoji-title">最近使用</div>
            <div class="row">
              <div class="emoji-item" v-for="item in conf.emoji.history">
                <img class="img" :src="`/static/chat/emoji/${item}.png`" @click="conf.emoji.insertEmoji(item)" />
              </div>
            </div>
          </template>
          <div class="emoji-title">全部表情</div>
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
import { onMounted, reactive, ref } from 'vue'
import { Scope } from 'tools-vue3'
import { EPage } from '@/enum/Enum'
import CInput from './com/cinput.vue'
import System from '@/utils/System'
import sapp from '@/sstore/sapp'
import toolsVue from './com/tools.vue'
const event = Scope.Event()
const chatBoxRef = ref<HTMLElement | null>()
const inputRef = ref({} as any)
const timer = Scope.Timer()
const conf = reactive({
  /**
   * 返回事件函数id
   */
  funId: '_chat_content',
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
        chatBoxRef.value?.scrollTo({
          top: chatBoxRef.value?.scrollHeight
        })
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
  sendMessage: () => {
    conf.chat.list.push(conf.input.message)
    conf.input.message = ''
    inputRef.value.clear()
  },
  content: {
    click: () => {
      conf.emoji.show = false
      conf.tools.show = false
    }
  },
  emoji: {
    show: false,
    open: async () => {
      const run = () => {
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
      conf.emoji.show = false
      conf.tools.show = true
      sapp.backbtn.funMap[conf.funId] = () => {
        conf.tools.show = false
      }
    }
  },
  chat: {
    list: [] as any
  }
})

onMounted(() => {
  event.on(EPage.changeHeight, () => {
    if (!conf.emoji.show && !conf.tools.show) conf.input.click()
  })
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
