<template>
  <x-page no-header tabbar no-footer>
    <div class="header">
      <x-statusbar />
      <van-nav-bar :title="title" left-arrow @click-left="router.back()"></van-nav-bar>
    </div>
    <div class="top">
      <p class="title">{{ title }}</p>
      <div class="tabs">
        <div class="tab" :class="activeTab == item.value ? 'active' : ''" v-for="item in list" @click="onTab(item)">
          <p>{{ item.label }}</p>
          <div v-if="activeTab == item.value" class="tab-line"></div>
        </div>
      </div>
    </div>
    <div class="chart">
      <ECharts ref="lineRef" v-if="isServerType" :option="lineOption" />
      <ECharts ref="linesRef" v-else :option="linesOption" />
    </div>
    <card v-if="isServerType" :server-info="serverInfo" />
    <listCard v-else :monitor-info="monitorInfo" />
  </x-page>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import card from './components/card.vue'
import listCard from './components/listCard.vue'
import echarts, { ECOption } from '@/components/ECharts/config/index'
import ECharts from '@/components/ECharts/index.vue'
import { toPx, titleMap, getThemeColor, formatSizeUnits } from '@/utils'
import { apis } from '@/api'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
type ServerMetricType = 'cpu' | 'ram' | 'disk' | 'io' | 'flow' // 定义明确类型
const router = useRouter()
const route = useRoute()
const title = computed(() => {
  return titleMap[route.query.type as ServerMetricType]
})
const isServerType = computed(() => {
  return ['cpu', 'ram', 'disk'].includes(route.query.type as ServerMetricType)
})
const activeTab = ref('1')
const onTab = (item: any) => {
  activeTab.value = item.value
}
const list = reactive([
  {
    label: '昨天',
    value: '1'
  },
  {
    label: '今天',
    value: '2'
  },
  {
    label: '最近七天',
    value: '3'
  },
  {
    label: '自定时间',
    value: '4'
  }
])
const flow = [t('home.upstream'), t('home.downstream'), t('home.totalSend'), t('home.totalReceive')]
const io = [t('home.read'), t('home.write'), t('home.readNum'), t('home.readLatency')]
const isFlow = computed(() => {
  console.log(route.query.type)
  return route.query.type == 'flow'
})
const lineOption = ref<any>({
  grid: {
    top: toPx(10),
    left: 0,
    right: 0,
    bottom: 0,
    containLabel: true
  },
  xAxis: [
    {
      type: 'category',
      boundaryGap: false,
      data: [],
      axisLabel: {
        color: getThemeColor('--font-gray-color')
      },
      axisTick: {
        show: false
      }
    }
  ],
  yAxis: [
    {
      type: 'value',
      axisLabel: {
        color: getThemeColor('--font-gray-color')
      },
      axisTick: {
        show: false
      }
    }
  ],
  series: [
    {
      symbol: 'none', //去掉折线图中的节点
      smooth: false, //true 为平滑曲线，false为直线
      name: 'Direct',
      type: 'line',
      stack: 'Total',
      lineStyle: {
        color: getThemeColor('--primary-color')
      },
      areaStyle: {
        // 颜色自上而下渐变
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: getThemeColor('--primary-color')
          },
          {
            offset: 1,
            color: getThemeColor('--font-light-color')
          }
        ]),
        opacity: 1 // 填充区域透明度
      },
      emphasis: {
        focus: 'series'
      },
      data: []
    }
  ]
})
const linesOption = computed(() => ({
  color: [getThemeColor('--primary-color'), '#FF455A', '#FFD226', '#27D7D7'],
  legend: {
    icon: 'roundRect',
    itemWidth: toPx(10),
    itemHeight: toPx(10),
    itemGap: toPx(28),
    borderRadius: toPx(5),
    data: route.query.type === 'flow' ? flow : io
  },
  grid: {
    top: toPx(20),
    left: 0,
    right: 0,
    bottom: 0,
    containLabel: true
  },
  xAxis: [
    {
      type: 'category',
      boundaryGap: false,
      data: [],
      axisLabel: {
        color: getThemeColor('--font-gray-color')
      },
      axisTick: {
        show: false
      }
    }
  ],
  yAxis: [
    {
      type: 'value',
      axisLabel: {
        color: getThemeColor('--font-gray-color')
      },
      axisTick: {
        show: false
      }
    }
  ],
  series: [
    {
      symbol: 'none', //去掉折线图中的节点
      smooth: true, //true 为平滑曲线，false为直线
      name: route.query.type === 'flow' ? t('home.upstream') : t('home.read'),
      type: 'line',
      stack: 'top',
      lineStyle: {
        color: getThemeColor('--primary-color')
      },
      areaStyle: {
        // 颜色自上而下渐变
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: getThemeColor('--primary-color')
          },
          {
            offset: 1,
            color: getThemeColor('--font-light-color')
          }
        ]),
        opacity: 1 // 填充区域透明度
      },
      emphasis: {
        focus: 'series'
      },
      data: []
    },
    {
      symbol: 'none', //去掉折线图中的节点
      smooth: true, //true 为平滑曲线，false为直线
      name: route.query.type === 'flow' ? t('home.downstream') : t('home.write'),
      type: 'line',
      stack: 'bottom',
      lineStyle: {
        color: '#FF455A'
      },
      areaStyle: {
        // 颜色自上而下渐变
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: '#FF455A'
          },
          {
            offset: 1,
            color: getThemeColor('--font-light-color')
          }
        ]),
        opacity: 1 // 填充区域透明度
      },
      emphasis: {
        focus: 'series'
      },
      data: []
    },
    {
      symbol: 'none', //去掉折线图中的节点
      smooth: true, //true 为平滑曲线，false为直线
      name: route.query.type === 'flow' ? t('home.totalSend') : t('home.readNum'),
      type: 'line',
      stack: 'send',
      lineStyle: {
        color: '#FFD226'
      },
      areaStyle: {
        // 颜色自上而下渐变
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: '#FFD226'
          },
          {
            offset: 1,
            color: getThemeColor('--font-light-color')
          }
        ]),
        opacity: 1 // 填充区域透明度
      },
      emphasis: {
        focus: 'series'
      },
      data: []
    },
    {
      symbol: 'none', //去掉折线图中的节点
      smooth: true, //true 为平滑曲线，false为直线
      name: route.query.type === 'flow' ? t('home.totalReceive') : t('home.readLatency'),
      type: 'line',
      stack: 'accept',
      lineStyle: {
        color: '#27D7D7'
      },
      areaStyle: {
        // 颜色自上而下渐变
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: '#27D7D7'
          },
          {
            offset: 1,
            color: getThemeColor('--font-light-color')
          }
        ]),
        opacity: 1 // 填充区域透明度
      },
      emphasis: {
        focus: 'series'
      },
      data: []
    }
  ]
})) as any;

// 修改数据更新方法
const getMonitorTypeData = async () => {
  // 限制数据点数量
  if (linesOption.value.xAxis[0].data.length > 20) {
    linesOption.value.xAxis[0].data.shift()
    linesOption.value.series.forEach((series:any) => series.data.shift())
  }

  const flow = monitorInfo.value.network[1]
  const io = monitorInfo.value.disk[3]
  linesOption.value.xAxis[0].data.push(new Date().toLocaleTimeString())
  
  switch (route.query.type) {
    case 'flow':
      linesOption.value.series[0].data.push(Number(parseFloat(formatSizeUnits(flow.SendRate))))
      linesOption.value.series[1].data.push(Number(parseFloat(formatSizeUnits(flow.RecvRate))))
      linesOption.value.series[2].data.push(Number(parseFloat(formatSizeUnits(flow.BytesSent))))
      linesOption.value.series[3].data.push(Number(parseFloat(formatSizeUnits(flow.BytesRecv))))
      break
    case 'io':
      linesOption.value.series[0].data.push(Number(parseFloat(formatSizeUnits(io.ReadSpeed))))
      linesOption.value.series[1].data.push(Number(parseFloat(formatSizeUnits(io.WriteSpeed))))
      linesOption.value.series[2].data.push(Number(io.ReadOpsPerSec))
      linesOption.value.series[3].data.push(Number(io.AvgIoLatency.toFixed(2)))
      break
  }
  
  // 强制更新图表
  nextTick(() => {
    if (linesRef.value) {
      linesRef.value.draw()
    }
  })
}
const serverInfo = ref<any>({})
const lineRef = ref<any>()
const linesRef = ref<any>()
const getServerInfo = async () => {
  const { data: res } = await apis.getSysInfo()
  serverInfo.value = res
  getServerTypeData()
}
const getServerTypeData = async () => {
  lineOption.value.xAxis[0].data.push(new Date().toLocaleTimeString())
  switch (route.query.type) {
    case 'cpu':
      const [usedPercent] = serverInfo.value.cpu_usage
      lineOption.value.series[0].data.push(usedPercent.toFixed(2))
      break
    case 'ram':
      const ramUsedPercent = serverInfo.value.memory_usage.usedPercent
      lineOption.value.series[0].data.push(ramUsedPercent.toFixed(2))
      break
    case 'disk':
      const rootDisk = serverInfo.value.disk_usage.find((disk: { path: string }) => disk.path === '/')
      const diskInfo = rootDisk || serverInfo.value.disk_usage[0]
      lineOption.value.series[0].data.push(diskInfo.usedPercent.toFixed(2))
      break
  }
  if (lineRef.value) {
    lineRef.value.draw()
  }
}
const monitorInfo = ref<any>({})
const getMonitorInfo = async () => {
  const { data: res } = await apis.getSysMonitor()
  monitorInfo.value = res
  getMonitorTypeData()
}
const getInfo = async () => {
  if (isServerType.value) {
    getServerInfo()
  } else {
    getMonitorInfo()
  }
}
let timer: any = null
onMounted(async () => {
  getInfo();
  timer = setInterval(() => {
    getInfo();
  }, 3000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>
<style lang="less" scoped>
.header {
  background: var(--card-bg-color);
  position: fixed;
  width: 100%;
  .van-nav-bar {
    // margin-top: 128rem;
    line-height: 120rem;
  }
}
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 686rem;
  height: 88rem;
  margin: 0 auto;
  // margin-top: 24rem;
  margin-top: calc(24rem + 88rem);
  background-color: var(--card-bg-color);
  border-radius: 12rem;
  padding: 0 32rem;
  .title {
    font-size: 28rem;
    font-weight: 700;
  }
  .tabs {
    display: flex;
    overflow-x: scroll;
    align-items: center;
    height: 100%;
    .tab {
      margin-left: 24rem;
      white-space: nowrap;
      text-align: center;
      position: relative;
      color: var(--font-gray-color);
      font-size: 20rem;
    }
    .tab:first-child {
      margin-left: 0;
    }
    .tab-line {
      position: absolute;
      bottom: -12rem;
      left: 0;
      width: -webkit-fill-available;
      height: 4rem;
      background: var(--primary-color);
    }
    .active {
      font-weight: 800;
    }
  }
}
.chart {
  height: 324rem;
  background: var(--card-bg-color);
  width: 686rem;
  margin: 0 auto;
  margin-top: 20rem;
  border-radius: 12rem;
  padding: 36rem 28rem 40rem 18rem;
}
</style>
