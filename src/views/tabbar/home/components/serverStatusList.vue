<template>
  <div class="server_status">
    <div class="item-title">
      <p class="name">{{ $t('home.serverStatus') }}</p>
      <p class="more" @click="goDetail()">
        {{ $t('commons.button.more') }}
        <span><van-icon name="arrow" /></span>
      </p>
    </div>
    <div class="card-list">
      <div class="item_card" v-for="(item, index) in serverList">
        <div class="icon_box">
          <van-image width="68rem" height="68rem" :src="item.icon" />
        </div>
        <p class="rate" :class="serverNameClass[index]">{{ item.rate }}%</p>
        <p class="name">{{ item.name }}</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive, onMounted, ref, onUnmounted } from 'vue'
import { apis } from '@/api/index'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const serverList = reactive([
  {
    icon: 'cpu',
    name: t('home.cpuUsage'),
    rate: '0'
  },
  {
    icon: 'ram',
    name: t('home.memoryUsage'),
    rate: '0'
  },
  {
    icon: 'disk',
    name: t('home.diskUsage'),
    rate: '0'
  }
])
serverList.forEach((item, index) => {
  const _icon = item.icon
  item.icon = `/static/img/home/${_icon}.png`
})
const serverNameClass: any = {
  0: 'green',
  1: 'yellow',
  2: 'blue'
}
const serverInfo = ref<any>({})
const getServerInfo = async () => {
  const { data: res } = await apis.getSysInfo()
  serverInfo.value = res
}
const getServerData = async (type: string) => {
  // const { data: res } = await apis.getSysInfo()
  switch (type) {
    case 'ram':
      {
        const { total, used, available, usedPercent } = serverInfo.value.memory_usage
        // conf.statusData.usage.total = sutil.bytesTransform(total).strValue
        // conf.statusData.usage.used = sutil.bytesTransform(used).strValue
        // conf.statusData.usage.available = sutil.bytesTransform(available).strValue
        // conf.statusData.usage.usedPercent = usedPercent
        serverList[0].rate = usedPercent.toFixed(2)
      }
      break
    case 'disk':
      {
        const rootDisk = serverInfo.value.disk_usage.find((disk: { path: string }) => disk.path === '/')
        if (!rootDisk) {
          // 如果没找到根目录，使用第一个磁盘信息
          const { total, free, used, usedPercent } = serverInfo.value.disk_usage[0]
          // conf.statusData.usage.total = sutil.bytesTransform(total).strValue
          // conf.statusData.usage.used = sutil.bytesTransform(used).strValue
          // conf.statusData.usage.available = sutil.bytesTransform(free).strValue
          // conf.statusData.usage.usedPercent = usedPercent
          serverList[1].rate = usedPercent.toFixed(2)
        } else {
          // 使用根目录磁盘信息
          const { total, free, used, usedPercent } = rootDisk
          // conf.statusData.usage.total = sutil.bytesTransform(total).strValue
          // conf.statusData.usage.used = sutil.bytesTransform(used).strValue
          // conf.statusData.usage.available = sutil.bytesTransform(free).strValue
          // conf.statusData.usage.usedPercent = usedPercent
          serverList[1].rate = usedPercent.toFixed(2)
        }
      }
      break
    case 'cpu':
      {
        const [usedPercent] = serverInfo.value.cpu_usage
        const { modelName, cores } = serverInfo.value.cpu_info[0]
        // conf.statusData.usage.total = '--'
        // conf.statusData.usage.used = '--'
        // conf.statusData.usage.available = '--'
        // conf.statusData.usage.usedPercent = usedPercent
        // conf.statusData.cpuInfo = `${modelName} ${cores}核`
        serverList[2].rate = usedPercent.toFixed(2)
      }
      break
  }
}
const router = useRouter()
const goDetail = () => {
  router.push({
    path: '/serverDetail'
  })
}
let timer: any = null
onMounted(async () => {
  timer = setInterval(async () => {
    await getServerInfo()
    getServerData('cpu')
    getServerData('ram')
    getServerData('disk')
  }, 3000)
})
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>
<style lang="less" scoped>
.server_status {
  .item-title {
    margin-top: 44rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .name {
      font-size: 32rem;
      font-family: 'PingFang SC-Medium';
      font-weight: 700;
      position: relative;
      display: inline-block;

      &::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: -4rem;
        width: 44rem;
        height: 8rem;
        background: var(--primary-color);
        border-radius: 5rem;
      }
    }
    .more {
      color: var(--font-gray-color);
    }
  }
  .app-list {
    display: flex;
    flex-wrap: wrap;
    .app_card {
      margin-top: 32rem;
      margin-right: 40rem;
      text-align: center;
      .icon_box {
        width: 140rem;
        height: 140rem;
        background: var(--card-bg-color);
      }
      .name {
        margin-top: 16rem;
      }
    }
    .app_card:nth-of-type(4n) {
      margin-right: 0;
    }
  }
}
.card-list {
  display: flex;
  justify-content: space-between;
  .item_card {
    margin-top: 32rem;
    width: 212rem;
    height: 262rem;
    background: var(--card-bg-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    .icon_box {
      width: 68rem;
      height: 68rem;
      margin-top: 36rem;
    }
    .rate {
      font-size: 40rem;
      font-family: 'PingFang SC-Medium';
      margin-top: 44rem;
    }
    .name {
      color: var(--font-gray-color);
      font-size: 24rem;
      margin-top: 14rem;
    }
  }
}
.green {
  color: var(--success-color);
}
.yellow {
  color: var(--warning-color);
}
.blue {
  color: var(--primary-color);
}
</style>
