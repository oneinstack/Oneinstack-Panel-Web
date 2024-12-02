<template>
  <div class="time row">
    <div class="item">{{ times[1] || '00' }}</div>
    <div class="item row flex-center alone">:</div>
    <div class="item" style="min-width: 72rem;">{{ times[2] || '00' }}</div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps({
  times: {
      default: [] as any
    }
})
</script>

<style lang="less" scoped>
.time {
  font-size: 58rem;
  font-weight: 600;
  color: #fff;
  gap: 10rem;
  .item {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: #ffffff4d;
    border-radius: 4rem;
    padding: 0 7rem;
  }
}
</style>
