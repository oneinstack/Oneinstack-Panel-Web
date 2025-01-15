<template>
  <div
    class="ball-box flex flex-center"
    :style="{
      'background-image': `url('/static/img/game/marksix/${img}.webp')`,
      'width': `${props.size}rem`,
      'height': `${props.size}rem`,
      'color': color,
      'font-size': `${props.size / 2}rem`
    }"
  >
    <div>{{ val }}</div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  size: number
  val: string
  img: string
  color: string
}>()
</script>
<style lang="less" scoped>
.ball-box {
  background-repeat: no-repeat;
  background-size: 100% 100%;
}
</style>
