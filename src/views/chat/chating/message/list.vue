<template>
  <div v-for="item in mconf.chat.list" :key="item">
    <Item :item="item" />
  </div>
</template>
<script setup lang="ts">
import { Scope } from 'tools-vue3'
import Item from './item.vue'
const mconf = Scope.getConf()
</script>
<style lang="less" scoped></style>
