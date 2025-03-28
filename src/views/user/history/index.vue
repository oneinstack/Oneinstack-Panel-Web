<script setup lang="ts">
import { index } from './index'

const conf = index()
</script>

<template>
  <x-page no-footer>
    <template #title>{{ 'History' }}</template>
    <div>
      content
    </div>
  </x-page>
</template>

<style scoped lang="less">
</style>
