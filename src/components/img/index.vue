<template>
  <van-image
    :src="src"
    :fit="fit"
    @error="$emit('error')"
    @load="$emit('load')"
    :lazy-load="lazyLoad"
    :width="width"
    :height="height"
  >
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
  },
  width: { default: '100%' },
  height: { default: '100%' }
})
</script>

<style lang="less" scoped></style>
