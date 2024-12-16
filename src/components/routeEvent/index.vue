<template></template>

<script setup lang="ts">
import { ERouter } from '@/enum/Enum'
import sapp from '@/sstore/sapp'
import System from '@/utils/System'
import { App } from '@capacitor/app'
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

//添加页面离开和进入事件
if (System.isNative) {
  //处理原生
  App.addListener('appStateChange', ({ isActive }) => {
    CEvent.emit(ERouter.browserShow, isActive)
  })
} else {
  //处理浏览器
  document.addEventListener('visibilitychange', () => {
    CEvent.emit(ERouter.browserShow, !document.hidden)
  })
}
</script>
