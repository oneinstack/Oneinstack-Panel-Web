<template>
  <div class="row fit-width" :class="{ reverse: item.isme }" style="padding: 0rem 32rem 30rem 32rem; min-height: 80rem">
    <template v-if="!item.noticeContent">
      <div class="face">
        <headImg :src="item.senderFaceUrl" />
      </div>
      <div style="margin: 0 20rem">
        <div
          v-if="item.groupID && !item.isme"
          class="row"
          :class="{ reverse: item.isme }"
          style="font-size: 24rem; color: #808080"
        >
          {{ item.senderNickname }}
        </div>
        <div class="relative">
          <ItemText v-if="textRenderTypes.includes(item.contentType)" :item="item" />
          <ItemMedia v-else-if="mediaRenderTypes.includes(item.contentType)" :item="item" />
          <div v-else>未知的消息类型</div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="row flex-center fit-width" v-html="item.noticeContent"></div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { MessageItem, MessageType } from 'openim-uniapp-polyfill'
import headImg from '../../components/headImg.vue'
import ItemMedia from './item-media.vue'
import ItemText from './item-text.vue'
const textRenderTypes = [MessageType.TextMessage, MessageType.AtTextMessage, MessageType.QuoteMessage]
const mediaRenderTypes = [MessageType.VideoMessage, MessageType.PictureMessage]
defineProps<{
  item: MessageItem & { isme: boolean; noticeContent: string }
}>()
</script>
<style lang="less" scoped>
.face {
  width: 80rem;
  height: 80rem;
  border-radius: 8rem;
  overflow: hidden;
}
</style>
