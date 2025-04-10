<template>
  <div :class="props.type">
    <p class="title">{{ titleMap[props.type] }}</p>
    <p class="rate">{{ rate }}%</p>
    <div class="more" @click="goPage()">
      <van-icon class="icon" name="arrow" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { apis } from '@/api'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const titleMap:any = {
  cpu: 'cpu使用率',
  ram: '内存使用率',
  disk: '硬盘使用率'
} 
const props = defineProps({
  type: {
    type: String,
    default: 'cpu'
  }
})
const goPage = () => {
  router.push({
    path: '/useRate',
    query: {
      type: props.type
    }
  })
}
const rate = ref('0')
const serverInfo = ref<any>({})
const getServerInfo = async () => {
  const { data: res } = await apis.getSysInfo()
  serverInfo.value = res;
} 
const getServerData = async (type: string) => {
  switch (type) {
    case 'ram':
      {
        const { total, used, available, usedPercent } = serverInfo.value.memory_usage
        rate.value = usedPercent.toFixed(2)
      }
      break
    case 'disk':
      {
        const rootDisk = serverInfo.value.disk_usage.find((disk: { path: string }) => disk.path === '/')
        if (!rootDisk) {
          // 如果没找到根目录，使用第一个磁盘信息
          const { total, free, used, usedPercent } = serverInfo.value.disk_usage[0]
          rate.value = usedPercent.toFixed(2)
        } else {
          // 使用根目录磁盘信息
          const { total, free, used, usedPercent } = rootDisk
          rate.value = usedPercent.toFixed(2)
        }
      }
      break
    case 'cpu':
      {
        const [usedPercent] = serverInfo.value.cpu_usage
        const { modelName, cores } = serverInfo.value.cpu_info[0]
        rate.value = usedPercent.toFixed(2)
      }
      break
  }
}
onMounted(async() => {
  await getServerInfo()
  getServerData(props.type)
})
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
