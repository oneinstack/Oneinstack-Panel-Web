<template>
  <div v-for="item in mconf.chat.list" :key="item">
    <div v-if="item.type == 'text'" v-html="item.content"></div>
    <div v-else-if="item.type == 'img'">
      <img :src="item.content" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { Scope } from 'tools-vue3'
import { reactive } from 'vue'
const mconf = Scope.getConf()
const conf = reactive({})
</script>
<style lang="less" scoped></style>
