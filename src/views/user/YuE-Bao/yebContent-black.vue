<template>
  <x-page pageType="black">
    <template #title>
      {{ $t('yueb.IncomeRule') }}
    </template>
    <div class="content">
      <div v-html="conf.info" style="color: #bfbfbf;font-size: 28rem;"></div>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import stheme from '@/sstore/stheme';
import { index } from './yebContent'

const conf = index()
</script>

<style lang="less" scoped>

.long-ico {
  color: #ffaf14;
  padding-left: 60rem;
  font-weight: bold;
}

.long-tab {
  padding-left: 60rem;
}

.content {
  background: #323738;
  border-radius: 12rem;
  margin: 24rem;
  padding: 30rem;
}
</style>
