<template></template>

<script setup lang="ts">
import { ERouter } from '@/enum/Enum'
import sapp from '@/sstore/sapp'
import System from '@/utils/System'
import { watch } from 'vue'

watch(
  () => System.router.currentRoute.value.path,
  (newPath, oldPath) => {
    CEvent.emit(ERouter.change, newPath)
  },
  { immediate: true }
)
// 添加键盘事件
sapp.addKeyboardEvent()
// 添加返回事件
sapp.addBackButton()
</script>
