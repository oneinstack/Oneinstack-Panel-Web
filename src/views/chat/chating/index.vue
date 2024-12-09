<template>
  <x-page class="chating-box">
    <template #title>
      <span class="title">{{ $t('chatRoom.contacts') }}</span>
    </template>
    <template #right>
      <div class="flex flex-center" style="width: 86rem; height: 100%" @click="">
        <van-icon name="ellipsis" size="24" color="#666" />
      </div>
    </template>
    <div class="col">
      <div>+666</div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { reactive } from 'vue'
import i18n from '@/lang'
import System from '@/utils/System'
const conf = reactive({})
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
</style>
