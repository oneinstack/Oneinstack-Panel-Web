<template>
  <lazy-component>
    <van-image
      style="width: 100%; height: 100%"
      :src="src"
      :fit="fit"
      @error="$emit('error')"
      @load="$emit('load')"
      lazy-load
    >
      <template #error></template>
      <template #loading></template>
    </van-image>
  </lazy-component>
</template>
<script setup lang="ts">
defineProps({
  src: { default: '' },
  fit: { default: 'fill' as any }
})
</script>

<style lang="less" scoped></style>
