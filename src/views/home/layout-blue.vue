<template>
  <x-router-view></x-router-view>
  <tabbar :list="conf.list" @change="conf.change"></tabbar>
</template>
<script setup lang="ts">
import uspage from '@/components/page/uspage'
import { ERouter } from '@/enum/Enum'
import i18n from '@/lang'
import sapp from '@/sstore/sapp'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, onUnmounted, reactive } from 'vue'
import tabbar from './theme/blue/tabbar/index.vue'

defineOptions({
  name: 'Home'
})

const event = Scope.Event()

const conf = reactive({
  list: [
    {
      path: '/home/home',
      icon: 'Home',
      text: i18n.t('tabble.home'),
      auth: false
    },
    {
      path: '/home/promotions',
      icon: 'Promotions',
      text: i18n.t('tabble.promotions'),
      auth: false
    },
    {
      path: '/home/longQueue',
      icon: 'LongQueue',
      text: i18n.t('tabble.longQueue'),
      auth: false
    },
    {
      path: '/home/wallet',
      icon: 'Wallet',
      text: i18n.t('tabble.wallet'),
      auth: true
    },
    {
      path: '/home/me',
      icon: 'Me',
      text: i18n.t('tabble.me'),
      auth: false
    }
  ] as any[],
  change: (item: any) => {
    if (item.path === System.getRouterPath()) return
    if (item.auth) {
      if (!sconfig.userInfo) return System.router.push('/login')
      return System.router.push(item.path)
    }
    System.router.replace(item.path)
  }
})

conf.list.forEach((item, index) => {
  const _icon = item.icon
  item.iconActive = `${_icon}-blue`
  item.index = index
})

event.on(ERouter.change, (path: string) => {
  if (path.startsWith('/home')) {
    uspage.setConfig()
  }
})

onMounted(() => {
  sapp.isNav = true
  uspage.setConfig()
  System.setNavigationBarColor('#ffffff')
})

onUnmounted(() => {
  sapp.isNav = false
})
</script>
<style lang="less" scoped></style>
