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
        <div v-for="item in 200" :key="item">
          {{ item }}
        </div>
      </div>
      <div class="row items-end chat-bottom">
        <div class="flex flex-center" style="height: 72rem">
          <VSIcon name="chat-yy" :size="56" />
        </div>
        <div class="col input-box">
          <CInput ref="inputRef" @click="conf.input.click" v-model="conf.input.message" />
        </div>
        <div class="flex flex-center" style="height: 72rem; gap: 10rem">
          <VSIcon name="chat-keybord" :size="56" @click="conf.input.focus" v-if="conf.emoji.show" />
          <VSIcon name="chat-emoji" :size="56" @click="conf.emoji.open" v-if="!conf.emoji.show" />
          <VSIcon name="chat-plus" :size="56" />
        </div>
      </div>
      <div class="emoji-box column no-wrap" v-if="conf.emoji.show">
        <template v-if="conf.emoji.history.length">
          <div class="emoji-title">最近使用</div>
          <div class="row">
            <div class="emoji-item" v-for="item in conf.emoji.history">
              <img class="img" :src="`/static/chat/emoji/${item}.png`" @click="conf.emoji.insertEmoji(item)" />
            </div>
          </div>
        </template>
        <div class="emoji-title">全部表情</div>
        <div class="row">
          <div class="emoji-item" v-for="(item, index) in 109">
            <img class="img" :src="`/static/chat/emoji/${index}.png`" @click="conf.emoji.insertEmoji(index)" />
          </div>
        </div>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Scope } from 'tools-vue3'
import { EPage } from '@/enum/Enum'
import CInput from './com/cinput.vue'
const event = Scope.Event()
const chatBoxRef = ref<HTMLElement | null>()
const inputRef = ref({} as any)
const conf = reactive({
  input: {
    message: '',
    click: () => {
      conf.emoji.show = false
      setTimeout(() => {
        chatBoxRef.value?.scrollTo({
          top: chatBoxRef.value?.scrollHeight
        })
      }, 100)
    },
    focus: () => {
      conf.emoji.show = false
      inputRef.value.focus()
    }
  },
  sendMessage: () => {
    console.log('sendMessage', conf.input.message)

    console.log('inputRef.value.getMessage()', inputRef.value.getMessage())
  },
  content: {
    click: () => {
      conf.emoji.show = false
    }
  },
  emoji: {
    show: false,
    open: () => {
      conf.emoji.show = true
      conf.emoji.history = Cookie.get('emojiHistory') || []
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
  }
})

onMounted(() => {
  event.on(EPage.changeHeight, () => {
    conf.input.click()
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

.emoji-box {
  width: 100%;
  height: 516rem;
  overflow: auto;
  padding-left: 30rem;

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
