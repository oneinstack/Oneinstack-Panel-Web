<template>
  <x-router-view></x-router-view>
  <x-tabbar :list="conf.list" @change="conf.change"></x-tabbar>
</template>
<script setup lang="ts">
import uspage from '@/components/page/uspage'
import sapp from '@/sstore/sapp'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'
import { onMounted, onUnmounted, reactive } from 'vue'
uspage.setConfig()

defineOptions({
  name: 'Home'
})

const conf = reactive({
  list: [
    {
      path: '/home/home',
      icon: 'home',
      auth: false
    },
    {
      path: '/home/promotions',
      icon: 'promotions',
      auth: false
    },
    {
      path: '/home/longQueue',
      icon: 'longQueue',
      auth: false
    },
    {
      path: '/home/wallet',
      icon: 'wallet',
      auth: true
    },
    {
      path: '/home/me',
      icon: 'me',
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
  item.icon = `/static/img/icon/${_icon}.png`
  item.iconActive = `/static/img/icon/${_icon}-active.png`
  item.index = index
})

onMounted(() => {
  sapp.isNav = true
})

onUnmounted(() => {
  sapp.isNav = false
})
</script>
<style lang="less" scoped></style>
