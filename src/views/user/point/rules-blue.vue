<template>
  <x-page :no-footer="true" :header-bg-color="stheme.theme.blue.headerBgColor()">
    <template #title>
      {{ $t('point.pointsRules') }}
    </template>
    <div class="content">
      <div v-html="conf.signRule"></div>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import stheme from '@/sstore/stheme';
import { index } from './rules'

const conf = index()
</script>

<style lang="less" scoped>
.content {
  padding: 20rem;
}
</style>
