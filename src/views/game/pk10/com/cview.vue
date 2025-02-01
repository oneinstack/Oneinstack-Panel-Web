<template>
  <div
    :style="{
      opacity: conf.opacity,
      transform: `translate(${conf.x}px,${conf.y}px) scale(${(conf.scale ? conf.scale : conf.scaleX) || 1},${(conf.scale ? conf.scale : conf.scaleY) || 1}) rotateZ(${(conf.rotate ? conf.rotate : conf.rotateZ) || 0}deg)`
    }"
  >
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { stween } from '@/sstore/stween'
import { Scope } from 'tools-vue3';
import { onMounted, reactive } from 'vue';

const props = defineProps({
  name: {
    type: String,
    default: ''
  }
})

const conf = reactive({
  name: props.name,
  id: '',
  x: 1,
  y: 1,
  opacity: 1,
  scale: undefined,
  scaleX: undefined,
  scaleY: undefined,
  rotate: undefined,
  rotateX: undefined,
  rotateY: undefined,
  rotateZ: undefined
})

onMounted(() => {
  conf.id = StrUtil.getId()
  stween.sprite.add(conf)
})
</script>
<style lang="less"></style>
