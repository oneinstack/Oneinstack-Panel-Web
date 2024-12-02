<template>
  <div
    :style="{
      opacity: opacity,
      transform: `translate(${x}px,${y}px) scale(${(scale ? scale : scaleX) || 1},${(scale ? scale : scaleY) || 1}) rotateZ(${(rotate ? rotate : rotateZ) || 0}deg)`
    }"
  >
    <slot></slot>
  </div>
</template>
<script>
import { stween } from '@/sstore/stween'
import { Scope } from 'tools-vue3';
export default {
  components: {},
  props: {
    name: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
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
    }
  },
  created() {
    this.event = Scope.Event()
    this.timer = Scope.Timer()
    this.id = StrUtil.getId()
    stween.sprite.add(this)
  },
  mounted() {},
  onLoad(option) {},
  onShow() {},
  onHide() {},
  onUnload() {},
  methods: {}
}
</script>
<style lang="less"></style>
