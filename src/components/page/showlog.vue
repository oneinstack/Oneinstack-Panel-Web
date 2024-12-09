<template>
  <div class="log-box">
    <div>
      <div class="log-item" v-for="(item,index) in logList" :key="item">
        <div v-if="index<10">
            {{ item }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const logList = ref<string[]>([])
//#ifvar-dev
const _log = console.log
console.log = (...args: any[]) => {
  logList.value.unshift(args.join(' '))
  _log(...args)
}
//#endvar
</script>
<style lang="less" scoped>
//#ifvar-dev
.log-box {
  position: fixed;
  bottom: 50vh;
  right: 0;
  width: 400rem;
  height: max-content;
  max-height: 400rem;
  background-color: rgba(0, 0, 0, 0.3);
}
//#endvar
</style>
