<template></template>

<script setup lang="ts">
import { ERouter } from '@/enum/Enum'
import System from '@/utils/System'
import { watch } from 'vue'

watch(
  () => System.router.currentRoute.value.path,
  (newPath, oldPath) => {
    CEvent.emit(ERouter.change, newPath)
  },
  { immediate: true }
)
</script>
