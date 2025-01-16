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
  },
  leaveTime: 0
})

CEvent.on(ERouter.browserShow, async (isShow) => {
  if (sconfig.userInfo) {
    if (isShow) {
      // 上线
      await apis.backOnline({
        toast: () => {}
      })
      // 如果离开时间大于1分钟，则刷新页面
      if (conf.leaveTime && Date.now() - conf.leaveTime > 60 * 1000) {
        conf.reload()
      }
    } else {
      // 下线
      apis.offline({
        toast: () => {}
      })
      conf.leaveTime = Date.now()
    }
  }
})

CEvent.on(ERouter.reload, conf.reload)
</script>
