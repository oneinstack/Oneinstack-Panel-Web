<template>
  <x-router-view></x-router-view>
  <tabbar :list="conf.list" @change="conf.change"></tabbar>
</template>
<script setup lang="ts">
import i18n from '@/lang'
import System from '@/utils/System'
import { reactive } from 'vue'
import tabbar from './tabbar.vue'

defineOptions({
  name: 'ChatHome'
})

const conf = reactive({
  list: [
    {
      path: '/chat/conversation',
      icon: 'bubble_circle_regular',
      iconActive: 'bubble_circle_filled',
      iconColor: ['#868686'],
      iconActiveColor: ['#07c261'],
      name: i18n.t('chatRoom.messages')
    },
    {
      path: '/chat/contact',
      icon: 'person_list_regular',
      iconActive: 'person_list_filled',
      iconColor: ['#868686'],
      iconActiveColor: ['#07c261'],
      name: i18n.t('chatRoom.contact')
    }
  ] as any[],
  change: (item: any) => {
    System.router.replace(item.path)
  }
})
</script>
<style lang="less" scoped></style>
