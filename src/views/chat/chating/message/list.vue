<template>
  <div
    class="relative"
    ref="listRef"
    @scroll="conf.scroll.event"
    @wheel="conf.scroll.event"
    @mousedown="conf.scroll.mousedown"
    @mouseup="conf.scroll.mouseup"
    @touchstart="conf.scroll.mousedown"
    @touchend="conf.scroll.mouseup"
  >
    <div v-for="item in csmessage.historyMessageList">
      <Item :item="item" />
    </div>
  </div>
</template>
<script setup lang="ts">
import csmessage from '@/modules/chat/sstore/csmessage'
import { Scope } from 'tools-vue3'
import { nextTick, reactive, ref } from 'vue'
import Item from './item.vue'

const timer = Scope.Timer()
const listRef = ref()

const props = defineProps({
  /**
   * 滚动到顶部回调
   */
  scrollTop: { default: null as any }
})

const conf = reactive({
  isInit: false,
  scroll: {
    /**
     * 临时y滚动距离
     */
    lastY: 9999,
    /**
     * 滚动方向
     * 1: 向上，-1：向下
     */
    direction: 0,

    /**
     * 等于的次数
     */
    eqnum: 0,

    /**
     * 是否是用户滚动
     */
    isUser: false,

    /**
     * 滚动事件
     */
    event: (e: any) => {
      if (!conf.scroll.isUser) return

      const tTop = listRef.value.scrollTop
      const lastTop = conf.scroll.lastY

      if (lastTop === 9999) {
        conf.scroll.lastY = tTop
        return
      }
      conf.scroll.lastY = tTop

      //获取滚动方向
      conf.scroll.direction = tTop > lastTop ? -1 : 1
      conf.scroll.getData()
    },
    isGetData: false,
    getData: async () => {
      if (conf.scroll.isGetData) return
      if (conf.scroll.direction === 1) {
        if (conf.scroll.lastY < 1) {
          conf.scroll.isGetData = true
          let _height = listRef.value.scrollHeight
          const res = await props.scrollTop()
          _height = listRef.value.scrollHeight - _height
          nextTick(() => {
            listRef.value.scrollTo({
              top: _height
            })
            conf.scroll.isGetData = false
          })
          return res
        }
      }
    },

    /**
     * 鼠标按下
     */
    mousedown: () => {
      conf.scroll.isUser = true
      timer.un(conf.scroll.mouseupTimer)
    },
    mouseupTimer: null as any,
    mouseup: () => {
      timer.un(conf.scroll.mouseupTimer)
      conf.scroll.mouseupTimer = timer.once(() => {
        conf.scroll.isUser = false
        conf.scroll.lastY = 9999
      }, 2000)
    },
    isRunBottom: false,
    /**
     * 滚动到底部
     * @param ani 是否使用动画
     */
    toBottom: async (ani = false) => {
      conf.scroll.isRunBottom = true
      const obj = {
        top: listRef.value.scrollHeight
      } as any
      if (ani || listRef.value.scrollTop > listRef.value.scrollHeight - listRef.value.clientHeight - 800)
        obj.behavior = 'smooth'
      listRef.value.scrollTo(obj)
      timer.once(() => {
        conf.scroll.isRunBottom = false
      }, 300)
    }
  }
})

defineExpose({
  init: () => {
    if (conf.isInit) return
    conf.isInit = true
    nextTick(() => {
      listRef.value.scrollTo({
        top: listRef.value.scrollHeight
      })
    })
  },
  toBottom: conf.scroll.toBottom,
  newMessage: () => {
    const _top = listRef.value.scrollHeight - listRef.value.clientHeight - listRef.value.scrollTop
    if (_top > 500) return
    conf.scroll.toBottom(true)
  }
})
</script>
<style lang="less" scoped></style>
