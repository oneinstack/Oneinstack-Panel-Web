<template>
  <router-view></router-view>
  <tabbar :list="conf.list" @change="conf.change"></tabbar>
</template>
<script setup lang="ts">
import i18n from '@/lang'
import System from '@/utils/System'
import { reactive } from 'vue'
import tabbar from './tabbar.vue'

const conf = reactive({
  list: [
    {
      path: '/chat/conversation',
      icon: 'chat',
      name: i18n.t('chatRoom.messages')
    },
    {
      path: '/chat/contact',
      icon: 'chat-user',
      name: i18n.t('chatRoom.contact')
    }
  ] as any[],
  change: (item: any) => {
    System.router.push(item.path)
  }
})

conf.list.forEach((item, index) => {
  item.iconActive = item.icon + '-active'
  item.index = index
})
</script>
<style lang="less" scoped></style>
