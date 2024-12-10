<template>
  <div class="tools-box" :class="{ show: show }">
    <div class="row" style="gap: 60rem">
      <template v-for="item in conf.list">
        <div class="tools-item flex flex-center" @click="item.fun">
          <VSIcon :name="item.icon" :size="56" />
        </div>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive } from 'vue'
defineProps<{
  show: boolean
}>()
const conf = reactive({
  list: [
    {
      icon: 'tools-img',
      fun: () => {}
    },
    {
      icon: 'tools-camera',
      fun: () => {}
    },
    {
      icon: 'tools-pack',
      fun: () => {}
    },
    {
      icon: 'tools-record',
      fun: () => {}
    }
  ]
})
</script>
<style lang="less" scoped>
.tools-box {
  width: 100%;
  height: 0rem;
  overflow: auto;
  padding: 40rem;
  opacity: 0;
  transition: all 0.3s;
  &.show {
    opacity: 1;
    height: 210rem;
  }
}
.tools-item {
  width: 120rem;
  height: 120rem;
  background-color: #fff;
  border-radius: 28rem;
}
</style>
