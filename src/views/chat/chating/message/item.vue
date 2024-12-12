<template>
  <template v-if="conf.show">
    <div
      class="row fit-width"
      :class="{ reverse: item.isme }"
      style="padding: 0rem 32rem 30rem 32rem; min-height: 80rem"
    >
      <img class="face" :src="item.face" />
      <div style="margin: 0 20rem">
        <div
          v-if="item.isGroup && !item.isme"
          class="row"
          :class="{ reverse: item.isme }"
          style="font-size: 24rem; color: #808080"
        >
          {{ item.sendnickname }}
        </div>
        <div class="relative">
          <template v-if="item.type == 'text'">
            <div class="relative text-box" :class="{ reverse: item.isme }">
              <div class="absolute text-bg-arrow" :class="{ reverse: !item.isme }"></div>
              <div v-html="item.content" style="word-break: break-all"></div>
            </div>
          </template>
          <div v-else-if="item.type == 'img'">
            <img :src="item.content" />
          </div>
        </div>
      </div>
    </div>
  </template>
</template>
<script setup lang="ts">
import { onMounted, reactive } from 'vue'

defineProps<{
  item: {
    type: string
    content: string
    sendId: string
    receiveId: string
    face: string
    sendnickname: string
    isme: boolean
    isGroup: boolean
  }
}>()

const conf = reactive({
  show: true
})

onMounted(() => {
})
</script>
<style lang="less" scoped>
.face {
  width: 80rem;
  height: 80rem;
  border-radius: 8rem;
}

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
