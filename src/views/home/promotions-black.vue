<template>
  <x-page no-header tabbar>
    <div class="head">
      <x-statusbar />
      <topInfo />
    </div>
  </x-page>
</template>

<script setup lang="ts">
import topInfo from './theme/black/components/topInfo.vue'
</script>
<style lang="less" scoped>
.head {
  background: #323838;
  padding: 0rem 24rem;
}
</style>