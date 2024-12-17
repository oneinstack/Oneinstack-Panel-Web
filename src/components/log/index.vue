<template>
  <div class="log-box" v-if="conf.show">
    <div>
      <div class="log-item" v-for="(item, index) in conf.list" :key="item">
        <div v-if="index < max">
          {{ item }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive } from 'vue'

const props = defineProps({
  max: { default: 10 },
  name: { default: 't' }
})
const conf = reactive({
  list: [] as string[],
  show: false,
  //#ifvar-dev
  init: () => {
    const _log = console.log
    console.log = (...args: any[]) => {
      if (args[0].startsWith(props.name)) {
        conf.list.unshift(args.join(' '))
      }
      _log(...args)
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
  width: 400rem;
  height: max-content;
  max-height: 400rem;
  background-color: rgba(0, 0, 0, 0.3);
}
//#endvar
</style>
