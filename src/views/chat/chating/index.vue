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
      <div class="col" style="height: 100%; overflow: auto" ref="chatBoxRef">
        <div v-for="item in 200" :key="item">
          {{ item }}
        </div>
      </div>
      <div class="row items-end chat-bottom">
        <div class="flex flex-center" style="height: 72rem">
          <VSIcon name="chat-yy" :size="50" />
        </div>
        <div class="col input-box">
          <CInput />
        </div>
        <div class="flex flex-center" style="height: 72rem; gap: 20rem">
          <VSIcon name="chat-emoji" :size="50" />
          <VSIcon name="chat-plus" :size="50" />
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
const chatBoxRef = ref<HTMLElement | null>(null)
const conf = reactive({
  message: '',
  messageBlur: () => {
    setTimeout(() => {
      chatBoxRef.value?.scrollTo({
        top: chatBoxRef.value?.scrollHeight
      })
    }, 100)
  },
  sendMessage: () => {
    console.log('sendMessage', conf.message)
  }
})

onMounted(() => {
  event.on(EPage.changeHeight, () => {
    conf.messageBlur()
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
  padding: 15rem 32rem;
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
</style>
