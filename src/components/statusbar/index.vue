<template>
  <div :style="{ height: StatusBarConfig.statusHeight + 'px', background: background }"></div>
  <div :style="{ height: uspage.header.height }" v-if="header !== false"></div>
</template>
<script setup lang="ts">
import { uspage } from '@/components/page/uspage'
import StatusBarConfig from '@/utils/StatusBarConfig'
defineProps({
  header: {
    default: false
  },
  background: {
    default: 'transparent'
  }
})
</script>
