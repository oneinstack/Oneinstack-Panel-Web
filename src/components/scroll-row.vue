<script setup>
import gsap from 'gsap'
import { onMounted, onUnmounted, useTemplateRef } from 'vue'

const props = defineProps({
  reverse: {
    type: Boolean,
    default: false,
  },
})

const box = useTemplateRef('box')
const child = useTemplateRef('child')

const tl = gsap.timeline({
  defaults: {
    repeat: -1,
    ease: 'none',
  },
  smoothChildTiming: true,
})

const startScroll = () => {
  if (box.value.scrollWidth > box.value.offsetWidth) {
    tl.to(child.value, {
      x: props.reverse ? '100%' : '-100%',
      duration: 15,
    })
  }
}

onMounted(() => {
  startScroll()
  child.value.addEventListener('mouseenter', () => tl.pause())
  child.value.addEventListener('mouseleave', () => tl.play())
})

onUnmounted(() => {
  child.value.removeEventListener('mouseenter')
  child.value.removeEventListener('mouseleave')
})
</script>

<template>
  <div ref="box" class="scroll-row-container">
    <div ref="child" class="scroll-row">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.scroll-row-container {
  width: 100%;
  height: 100%;
  overflow-x: hidden;

  .scroll-row {
    display: flex;
    align-items: center;
  }
}
</style>
