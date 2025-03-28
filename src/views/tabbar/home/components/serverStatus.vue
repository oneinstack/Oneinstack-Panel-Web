<template>
  <div class="card-list">
    <div class="item_card" v-for="(item, index) in serverList">
      <div class="icon_box">
        <van-image width="68rem" height="68rem" :src="item.icon" />
      </div>
      <p class="rate" :class="serverNameClass[index]">{{ item.rate }}%</p>
      <p class="name">{{ item.name }}</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive,onMounted } from "vue";
import { apis } from '@/api/index'
const serverList = reactive([
  {
    icon: 'cpu',
    name: 'cpu使用率',
    rate: '38.7'
  },
  {
    icon: 'ram',
    name: '内存使用率',
    rate: '38.7'
  },
  {
    icon: 'disk',
    name: '磁盘使用率',
    rate: '38.7'
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
const getServerList = async (type:number) => {
  const { data: res } = await apis.getSysInfo()
  switch (type) {
    case 1:
      {
        const { total, used, available, usedPercent } = res.memory_usage
        // conf.statusData.usage.total = sutil.bytesTransform(total).strValue
        // conf.statusData.usage.used = sutil.bytesTransform(used).strValue
        // conf.statusData.usage.available = sutil.bytesTransform(available).strValue
        // conf.statusData.usage.usedPercent = usedPercent
        serverList[0].rate = usedPercent
      }
      break
    case 2:
      {
        const rootDisk = res.disk_usage.find((disk: { path: string }) => disk.path === '/')
        if (!rootDisk) {
          // 如果没找到根目录，使用第一个磁盘信息
          const { total, free, used, usedPercent } = res.disk_usage[0]
          // conf.statusData.usage.total = sutil.bytesTransform(total).strValue
          // conf.statusData.usage.used = sutil.bytesTransform(used).strValue
          // conf.statusData.usage.available = sutil.bytesTransform(free).strValue
          // conf.statusData.usage.usedPercent = usedPercent
          serverList[1].rate = usedPercent
        } else {
          // 使用根目录磁盘信息
          const { total, free, used, usedPercent } = rootDisk
          // conf.statusData.usage.total = sutil.bytesTransform(total).strValue
          // conf.statusData.usage.used = sutil.bytesTransform(used).strValue
          // conf.statusData.usage.available = sutil.bytesTransform(free).strValue
          // conf.statusData.usage.usedPercent = usedPercent
          serverList[1].rate = usedPercent
        }
      }
      break
    case 3:
      {
        const [usedPercent] = res.cpu_usage
        const { modelName, cores } = res.cpu_info[0]
        // conf.statusData.usage.total = '--'
        // conf.statusData.usage.used = '--'
        // conf.statusData.usage.available = '--'
        // conf.statusData.usage.usedPercent = usedPercent
        // conf.statusData.cpuInfo = `${modelName} ${cores}核`
        serverList[2].rate = usedPercent
      }
      break
  }
}
onMounted(() => {
  getServerList(1)
  getServerList(2)
  getServerList(3)
})
</script>
<style lang="less" scoped>
.card-list {
  display: flex;
  justify-content: space-between;
  .item_card {
    margin-top: 32rem;
    width: 212rem;
    height: 262rem;
    background: #ffffff;
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
      color: #acacac;
      font-size: 24rem;
      margin-top: 14rem;
    }
  }
}
</style>
