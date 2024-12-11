<template>
  <div class="relative" v-for="(item, index) in mconf.chat.list" :key="item">
    <Item :item="item" :style="{ paddingTop: index === 0 ? '46rem' : '' }" />
  </div>
</template>
<script setup lang="ts">
import { Scope } from 'tools-vue3'
import Item from './item.vue'
const mconf = Scope.getConf()
</script>
<style lang="less" scoped></style>
