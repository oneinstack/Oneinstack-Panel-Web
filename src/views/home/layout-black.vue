<template>
  <x-router-view></x-router-view>
  <tabbar :list="conf.list" @change="conf.change"></tabbar>
</template>
<script setup lang="ts">
import uspage from '@/components/page/uspage'
import { ERouter } from '@/enum/Enum'
import sapp from '@/sstore/sapp'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, onUnmounted, reactive } from 'vue'
import tabbar from './theme/black/tabbar/index.vue'
defineOptions({
  name: 'Home'
})

const event = Scope.Event()

const conf = reactive({
  list: [
    {
      path: '/home/me',
      icon: 'menu',
      name: 'Menu',
      auth: true
    },
    {
      path: '/home/promotions',
      icon: 'explore',
      name: 'Explore',
      auth: true
    },
    {
      path: '/home/home',
      icon: 'casino',
      name: 'Casino',
      auth: false
    },
    {
      path: '/home/wallet',
      icon: 'lottery',
      name: 'Lottery',
      auth: true
    },
    {
      path: '/home/longQueue',
      icon: 'sport',
      name: 'Sport',
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
  item.icon = `/static/img/icon/black/${_icon}.png`
  item.iconActive = `/static/img/icon/black/${_icon}-active.png`
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
