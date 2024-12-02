<template>
  <div :style="{ height: StatusBarConfig.statusHeight + 'px' }"></div>
  <div style="height: 104rem" v-if="header !== false"></div>
</template>
<script setup lang="ts">
import StatusBarConfig from '@/utils/StatusBarConfig'
defineProps({
  header: {
    default: false
  }
})
</script>
