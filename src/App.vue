<template>
  <x-route-event></x-route-event>
  <x-router-view :show="conf.show"></x-router-view>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive } from 'vue'
import { ERouter } from './enum/Enum'
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

onMounted(() => {
  document.documentElement.style.setProperty('--navigation-bar-height', `${StatusBarConfig.bottomBarHeight}px`)
})

CEvent.on(ERouter.reload, conf.reload)
</script>
