<template>
  <div class="row">
    <div class="face">
      <img :src="item.face" />
    </div>
    <div class="item-content">
      <div v-if="item.type == 'text'" v-html="item.content"></div>
      <div v-else-if="item.type == 'img'">
        <img :src="item.content" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive } from 'vue'
defineProps<{
  item: { type: string; content: string; sendId: string; receiveId: string; face: string }
}>()
const conf = reactive({})
</script>
<style lang="less" scoped></style>
