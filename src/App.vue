<template>
  <x-route-event></x-route-event>
  <x-router-view :show="conf.show"></x-router-view>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive } from 'vue'
import { apis } from './api'
import { ERouter } from './enum/Enum'
import sconfig from './sstore/sconfig'
import StatusBarConfig from './utils/StatusBarConfig'

defineOptions({
  name: 'App'
})

const conf = reactive({
  show: true,
  reload: () => {
    conf.show = false
    nextTick(() => {
      conf.show = true
    })
  }
})

CEvent.on(ERouter.browserShow, (isShow) => {
  if (sconfig.userInfo) {
    if (isShow) {
      // 上线
      apis.backOnline({
        toast: () => {}
      })
    } else {
      // 下线
      apis.offline({
        toast: () => {}
      })
    }
  }
})

onMounted(() => {
  document.documentElement.style.setProperty('--navigation-bar-height', `${StatusBarConfig.bottomBarHeight}px`)
})

CEvent.on(ERouter.reload, conf.reload)
</script>
