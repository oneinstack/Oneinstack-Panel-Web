<template>
  <div class="relative text-box" :class="{ reverse: item.isme }">
    <div class="absolute text-bg-arrow" :class="{ reverse: !item.isme }"></div>
    <div v-html="conf.getContent(item)" style="word-break: break-all"></div>
  </div>
</template>
<script setup lang="ts">
import { parseAt, parseBr, parseLink } from '@/modules/chat/utils/cUtil'
import { MessageType } from 'openim-uniapp-polyfill'
import { reactive } from 'vue'
const props = defineProps<{
  item: any
}>()
const conf = reactive({
  getContent: (item: any) => {
    if (item.contentType === MessageType.QuoteMessage) {
      return item.quoteElem.text
    }
    if (item.contentType === MessageType.AtTextMessage) {
      return parseAt(item.atTextElem)
    }
    return parseLink(parseBr(item.textElem?.content))
  }
})
</script>
<style lang="less" scoped>
.text-box {
  ---text-box-bg: #fff;
  padding: 20rem 16rem;
  background-color: var(---text-box-bg);
  margin: 0 10rem;
  border-radius: 8rem;
  max-width: 464rem;
  font-size: 28rem;
  color: #333333;
  &.reverse {
    ---text-box-bg: #95ec69;
  }
}

.text-bg-arrow {
  top: 0;
  right: 0;
  width: 20rem;
  height: 20rem;
  background-color: var(---text-box-bg);
  border-radius: 4rem;
  margin-top: 30rem;
  margin-right: -10rem;
  transform: rotateZ(45deg);

  &.reverse {
    right: '';
    left: 0;
    margin-left: -10rem;
  }
}
</style>
