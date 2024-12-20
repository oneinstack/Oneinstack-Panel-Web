<template>
  <div
    ref="itemRef"
    class="row fit-width"
    :class="{ reverse: item.isme }"
    :style="{ height: height ? height + 'px' : undefined }"
    style="padding: 0rem 32rem 30rem 32rem; min-height: 80rem"
  >
    <template v-if="conf.show && !item.noticeContent">
      <img class="face" :src="item.senderFaceUrl" />
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
          <div v-else-if="mediaRenderTypes.includes(item.contentType)">
            <img :src="item.content" />
          </div>
        </div>
      </div>
    </template>
    <template v-else-if="conf.show">
      <div class="row flex-center fit-width" v-html="item.noticeContent"></div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { MessageItem, MessageType } from 'openim-uniapp-polyfill'
import { Scope } from 'tools-vue3'
import { onMounted, reactive, ref, watch } from 'vue'
import ItemText from './item-text.vue'
const textRenderTypes = [MessageType.TextMessage, MessageType.AtTextMessage, MessageType.QuoteMessage]
const mediaRenderTypes = [MessageType.VideoMessage, MessageType.PictureMessage]

const timer = Scope.Timer()
const props = defineProps<{
  info: any
  item: MessageItem & { isme: boolean; noticeContent: string }
  height: any
}>()

watch(
  () => props.info.isRender,
  () => {
    if (props.info.isRender) {
      conf.show = true
    }
  }
)

const itemRef = ref()

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!props.info.isRender) {
      conf.show = entry.isIntersecting
    }
  })
})

const init = () => {
  observer.observe(itemRef.value as Element)
}
const conf = reactive({
  show: true
})

onMounted(() => {
  timer.once(() => {
    init()
  }, 100)
})
</script>
<style lang="less" scoped>
.face {
  width: 80rem;
  height: 80rem;
  border-radius: 8rem;
}
</style>
