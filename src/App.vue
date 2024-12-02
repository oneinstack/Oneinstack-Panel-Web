<template>
  <x-route-event></x-route-event>
  <router-view v-if="conf.show"></router-view>
</template>

<script setup lang="ts">
import { nextTick, reactive } from 'vue'
import { ERouter } from './enum/Enum'

const conf = reactive({
  show: true,
  reload: () => {
    conf.show = false
    nextTick(() => {
      conf.show = true
    })
  }
})

CEvent.on(ERouter.reload, conf.reload)
</script>
