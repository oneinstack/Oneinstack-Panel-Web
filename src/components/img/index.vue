<template>
  <van-image :src="src" :fit="fit" @error="$emit('error')" @load="$emit('load')" :lazy-load="lazyLoad">
    <template #error></template>
    <template #loading></template>
  </van-image>
</template>
<script setup lang="ts">
defineProps({
  src: { default: '' },
  fit: { default: 'fill' as any },
  lazyLoad: {
    default: true
  }
})
</script>

<style lang="less" scoped></style>
