<template>
  <transition name="fade">
    <div class="absolute ad-box" v-if="show">
      <div class="relative" style="height: 0rem; width: 100%">
        <div class="absolute ad-point" :class="{ active: conf.list[0].active }"></div>
      </div>
      <template v-for="(item, index) in conf.list">
        <div
          class="flex items-center relative ad-item"
          @touchstart="conf.mouseDown(item)"
          @mousedown="conf.mouseDown(item)"
          @click="item.fun(item)"
          :class="{ active: item.active, top: index == 0, bottom: index == conf.list.length - 1 }"
        >
          <VSIcon lib="wx" :name="item.icon" size="48" :color="['#ffffff', '#ffffff', '#ffffff']" />
          <div style="margin-left: 16rem; font-size: 28rem">{{ item.title }}</div>
        </div>
        <div v-if="index < conf.list.length - 1" style="width: 100%; overflow: hidden">
          <div class="ad-line"></div>
        </div>
      </template>
    </div>
  </transition>
</template>
<script setup lang="ts">
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { reactive, watch } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['update:show'])
const timer = Scope.Timer()
watch(
  () => props.show,
  (val) => {
    if (val) {
      const fun = () => {
        emit('update:show', false)
        document.removeEventListener('click', fun)
      }
      timer.clear()
      timer.once(() => {
        document.addEventListener('click', fun)
      }, 300)
    }
  }
)

const conf = reactive({
  list: [
    {
      icon: 'bubble_circle_filled',
      title: 'New Chat',
      active: false,
      fun: (item: any) => {
        item.active = false
        console.log('new chat')
        System.router.push(`/chat/createGroup`)
      }
    },
    {
      icon: 'icons_filled_add_friends',
      title: 'Add Contacts',
      active: false,
      fun: (item: any) => {
        item.active = false
        System.router.push(`/chat/add`)
      }
    }
  ],
  mouseDown: (item: any) => {
    item.active = true
    const fun = () => {
      item.active = false
      document.removeEventListener('mouseup', fun)
      document.removeEventListener('touchend', fun)
    }
    document.addEventListener('mouseup', fun)
    document.addEventListener('touchend', fun)
  }
})
</script>
<style lang="less" scoped>
.ad-box {
  top: 106rem;
  right: 16rem;
  background-color: #404040;
  border-radius: 8rem;
  width: max-content;
  transform-origin: top right;

  .active {
    background-color: #4c4c4c;
  }
}
.ad-point {
  height: 20rem;
  width: 20rem;
  right: 18rem;
  top: -7rem;
  background-color: #404040;
  transform: rotate(45deg);
}
.ad-item {
  height: 104rem;
  padding: 0 20rem;
  &.top {
    border-top-left-radius: 8rem;
    border-top-right-radius: 8rem;
  }
  &.bottom {
    border-bottom-left-radius: 8rem;
    border-bottom-right-radius: 8rem;
  }
}
.ad-line {
  height: 2rem;
  width: 100%;
  background-color: #4d4d4d;
  transform: translateX(66rem);
}
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
