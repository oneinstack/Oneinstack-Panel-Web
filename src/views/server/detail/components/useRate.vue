<template>
  <div :class="props.type">
    <p class="title">{{ titleMap[props.type] }}</p>
    <p class="rate">{{ rate }}%</p>
    <div class="more" @click="goPage()">
      <van-icon class="icon" name="arrow" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { titleMap } from '@/utils'
const props = defineProps({
  type: {
    type: String,
    default: 'cpu'
  },
  serverInfo: {
    type: Object,
    required: true
  }
})

const rate = ref('0')

// 监听 serverInfo 变化
watch(() => props.serverInfo, (newInfo) => {
  if (newInfo && Object.keys(newInfo).length > 0) {
    getServerData(props.type)
  }
}, { deep: true })

const getServerData = (type: string) => {
  if (!props.serverInfo) return
  
  switch (type) {
    case 'ram': {
      const { usedPercent } = props.serverInfo.memory_usage
      rate.value = usedPercent.toFixed(2)
      break
    }
    case 'disk': {
      const rootDisk = props.serverInfo.disk_usage.find((disk: { path: string }) => disk.path === '/')
      const diskInfo = rootDisk || props.serverInfo.disk_usage[0]
      rate.value = diskInfo.usedPercent.toFixed(2)
      break
    }
    case 'cpu': {
      const [usedPercent] = props.serverInfo.cpu_usage
      rate.value = usedPercent.toFixed(2)
      break
    }
  }
}
const router = useRouter()
const goPage = () => {
  router.push({
    path: '/useRate',
    query: {
      type: props.type
    }
  })
}
</script>
<style lang="less" scoped>
.cpu,
.ram,
.disk {
  padding: 0 32rem;
  .title {
    font-size: 28rem;
    color: var(--font-dark-color);
    font-weight: 700;
    margin-top: 32rem;
    line-height: 24rem;
  }
  .rate {
    margin-top: 40rem;
    color: var(--primary-color);
    font-size: 40rem;
    line-height: 34rem;
  }
  .more {
    background: var(--primary-color);
    height: 32rem;
    width: 32rem;
    border-radius: 50%;
    margin-top: 40rem;
    display: flex;
    justify-content: center;
    align-items: center;
    .icon {
      color: var(--font-light-color);
      font-size: 22rem;
    }
  }
}
.cpu,
.ram {
  width: 328rem;
  height: 242rem;
  margin-top: 24rem;
}
.cpu {
  background: url('/static/img/server/cpu.png');
  background-size: 100%;
}
.ram {
  background: url('/static/img/server/ram.png');
  margin-left: 30rem;
  background-size: 100%;
}
.disk {
  width: 686rem;
  height: 242rem;
  margin-top: 24rem;
  background: url('/static/img/server/disk.png');
  background-size: 100%;
}
</style>
