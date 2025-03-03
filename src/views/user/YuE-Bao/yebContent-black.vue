<template>
  <x-page>
    <template #title>
      {{ $t('yueb.IncomeRule') }}
    </template>
    <div v-html="conf.info" style="padding: 30rem;color: #bfbfbf;font-size: 28rem;"></div>
  </x-page>
</template>

<script setup lang="ts">
import stheme from '@/sstore/stheme';
import { index } from './yebContent'

const conf = index()
</script>

<style lang="less" scoped>
.content {
  font-size: 30rem;
  padding: 30rem;
}
.long-ico {
  color: #ffaf14;
  padding-left: 60rem;
  font-weight: bold;
}
.long-tab {
  padding-left: 60rem;
}
</style>
