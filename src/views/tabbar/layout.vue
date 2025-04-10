<template>
  <x-router-view></x-router-view>
  <x-tabbar :list="conf.list" @change="conf.change"></x-tabbar>
</template>
<script setup lang="ts">
import i18n from '@/lang'
import uspage from '@/components/page/uspage'
import { ERouter } from '@/enum/Enum'
import sapp from '@/sstore/sapp'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, onUnmounted, reactive } from 'vue'
defineOptions({
  name: 'Home'
})
const event = Scope.Event()

const conf = reactive({
  list: [
    {
      path: '/home/home',
      icon: 'home',
      name:'tabbar.home',
      auth: false
    },
    {
      path: '/home/app',
      icon: 'app',
      name:'tabbar.application',
      auth: false
    },
    {
      path: '/home/file',
      icon: 'file',
      name:'tabbar.file',
      auth: false
    },
    {
      path: '/home/me',
      icon: 'me',
      name:'tabbar.me',
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
