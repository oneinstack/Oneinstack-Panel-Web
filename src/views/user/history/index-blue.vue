<script setup lang="ts">
import stheme from '@/sstore/stheme'
import { index } from './index'

const conf = index()
</script>

<template>
  <x-page no-footer :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>{{ 'History' }}</template>
    <div>
      content
    </div>
  </x-page>
</template>

<style scoped lang="less">
</style>
