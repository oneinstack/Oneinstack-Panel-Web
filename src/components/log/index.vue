<template>
  <div
    class="log-box"
    v-if="conf.show"
    :style="{ width: conf.scale.width, height: conf.scale.height }"
    @click="conf.scale.change"
  >
    <div>
      <div class="log-item" v-for="(item, index) in conf.list">
        <div class="row" v-if="index < max">
          <div style="width: 108rem">{{ item.time }}：</div>
          <span :style="{ color: item.color }">{{ item.content }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive } from 'vue'

const props = defineProps({
  max: { default: 10 },
  name: { default: 'cim' }
})
const conf = reactive({
  list: [] as { content: string; color: string; time: string }[],
  show: false,
  scale: {
    show: false,
    change: () => {
      conf.scale.show = !conf.scale.show
      conf.scale.width = conf.scale.show ? '100vw' : '100rem'
      conf.scale.height = conf.scale.show ? 'max-content' : '100rem'
    },
    width: '100rem' as any,
    height: '100rem' as any
  },
  //#ifvar-dev
  init: () => {
    const _log = console.log
    console.log = (...args: any[]) => {
      _log(...args)
      if (args[0]?.startsWith?.(props.name)) {
        let color = `#${Math.floor(Math.random() * 16777215).toString(16)}`
        if (
          color
            .slice(1)
            .split('')
            .every((item) => parseInt(item) > 100)
        ) {
          color = '#000000'
        }
        args = args.slice(1)
        conf.list.unshift({
          content: args
            .map((item) => {
              if (typeof item === 'object' && item !== null) {
                return JSON.stringify(item)
              }
              return item
            })
            .join(' '),
          color: color,
          time: new Date().Format('hh:mm:ss')
        })
      }
    }
    conf.show = true
  }
  //#endvar
})
onMounted(() => {
  //#ifvar-dev
  conf.init()
  //#endvar
})
</script>
<style lang="less" scoped>
//#ifvar-dev
.log-box {
  position: fixed;
  z-index: 9999;
  bottom: 50vh;
  right: 0;
  max-height: 40vh;
  min-height: 100rem;
  min-width: 100rem;
  background-color: rgba(255, 255, 255, 0.8);
  overflow: auto;
}
.log-item {
  min-width: 100vw;
}
//#endvar
</style>
