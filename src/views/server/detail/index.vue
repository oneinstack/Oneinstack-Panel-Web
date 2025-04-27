<template>
  <x-page no-header tabbar no-footer>
    <Header />
    <div class="content">
      <Memo />
      <div class="server-info">
        <useRate type="cpu" :server-info="serverInfo" />
        <useRate type="ram" :server-info="serverInfo" />
        <useRate type="disk" :server-info="serverInfo" />
        <TrafficDisk type="flow" :monitor-info="monitorInfo" />
        <TrafficDisk type="io" :monitor-info="monitorInfo" />
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import Header from './components/header.vue'
import Memo from './components/memo.vue'
import useRate from './components/useRate.vue'
import TrafficDisk from './components/trafficDisk.vue'
import { apis } from '@/api'

const serverInfo = ref<any>({})
const getServerInfo = async () => {
  const { data: res } = await apis.getSysInfo()
  serverInfo.value = res
}
const monitorInfo = ref<any>({})
const getMonitorInfo = async () => {
  const { data: res } = await apis.getSysMonitor()
  monitorInfo.value = res
}
let timer: any = null
onMounted(async () => {
  timer = setInterval(() => {
    getServerInfo()
    getMonitorInfo()
  }, 3000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>
<style lang="less" scoped>
.content {
  margin-top: calc(24rem + 566rem + 32rem - 100rem);
  padding: 0 32rem;
  height: 100%;
  overflow-y: scroll;
  padding-bottom: 36rem;
  .server-info {
    display: flex;
    flex-wrap: wrap;
  }
}
:deep(.van-hairline--bottom:after) {
  border-bottom-width: 0;
}
:deep(.van-nav-bar__title) {
  font-size: 32rem;
  color: var(--card-bg-color);
}
:deep(.van-nav-bar .van-icon) {
  color: var(--card-bg-color);
}
</style>
