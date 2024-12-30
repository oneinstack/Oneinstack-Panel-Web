<template>
  <x-route-event></x-route-event>
  <x-router-view :show="conf.show"></x-router-view>
</template>

<script setup lang="ts">
import { nextTick, reactive } from 'vue'
import { apis } from './api'
import { ERouter } from './enum/Enum'
import sconfig from './sstore/sconfig'

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

CEvent.on(ERouter.reload, conf.reload)
</script>
