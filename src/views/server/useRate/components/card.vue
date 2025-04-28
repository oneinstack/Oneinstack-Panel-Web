<template>
  <div class="card">
    <div class="left">
      <p class="name">当前使用率</p>
      <p class="rate">{{ rate }}%</p>
      <p class="num">剩余：{{ formatSizeUnits(available) || '--' }}</p>
    </div>
    <div class="right">
      <ECharts ref="chartRef" :option="option" />
    </div>
  </div>
</template>
<script setup lang="ts">
import echarts, { ECOption } from '@/components/ECharts/config/index'
import ECharts from '@/components/ECharts/index.vue'
import { getThemeColor,formatSizeUnits } from '@/utils/index'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const props = defineProps({
  serverInfo: {
    type: Object,
    default: () => ({})
  }
})
const option: any = {
  series: [
    {
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      radius: '100%',
      zlevel: 2,
      pointer: {
        show: false
      },
      progress: {
        show: true,
        overlap: false,
        roundCap: true,
        clip: false,
        itemStyle: {
          borderWidth: 0,
          color: getThemeColor('--primary-color')
        }
      },
      axisLine: {
        lineStyle: {
          width: 15,
          color: [[1, `#DCDCDC`]]
        }
      },
      splitLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        show: false,
        distance: 50
      },
      data: [0],
      title: {
        fontSize: 12,
        color: getThemeColor('--primary-color'),
        offsetCenter: [0, '30%']
      },
      detail: {
        width: 100,
        height: 100,
        borderWidth: 0,
        offsetCenter: [0, '70%'],
        rich: {
          a: {
            fontSize: 18,
            color: getThemeColor('--primary-color'),
            fontWeight: 500
          },
          b: {
            fontSize: 18,
            color: getThemeColor('--primary-color'),
            fontWeight: 500
          }
        },
        formatter: (value: any) => {
          const int = value.toFixed(2).split('.')[0]
          const flt = value.toFixed(1).split('.')[1]
          return `{a|${int}}{b|.${flt}%}`
        },
        valueAnimation: true
      }
    },
    {
      animationType: 'scale',
      color: getThemeColor('--font-light-color'),
      name: 'Access From',
      type: 'pie',
      radius: '75%',
      label: {
        show: false
      },
      labelLine: {
        show: false
      },
      data: [{ value: 100, name: 'Search Engine' }]
    }
  ]
}
const chartRef = ref()
const rate = ref(0)
const available = ref<number>(0)
const getServerData = () => {
  switch (route.query.type) {
    case 'cpu':
      const [usedPercent] = props.serverInfo.cpu_usage
      option.series[0].data[0] = usedPercent.toFixed(2)
      rate.value = usedPercent.toFixed(2)
      available.value = 0
      break
    case 'ram':
      const ramUsedPercent = props.serverInfo.memory_usage.usedPercent
      const use = props.serverInfo.memory_usage.available
      option.series[0].data[0] = ramUsedPercent
      rate.value = ramUsedPercent.toFixed(2)
      available.value = parseInt(use)
      break
    case 'disk':
      const rootDisk = props.serverInfo.disk_usage.find((disk: { path: string }) => disk.path === '/')
      const diskInfo = rootDisk || props.serverInfo.disk_usage[0]
      option.series[0].data[0] = diskInfo.usedPercent.toFixed(2)
      rate.value = diskInfo.usedPercent.toFixed(2)
      available.value = parseInt(diskInfo.free)
      break
  }
  chartRef.value.draw()
}
watch(
  () => props.serverInfo,
  (newVal) => {
    getServerData()
  }
)
</script>
<style lang="less" scoped>
.card {
  height: 238rem;
  background: var(--card-bg-color);
  width: 686rem;
  margin: 0 auto;
  margin-top: 20rem;
  border-radius: 12rem;
  padding: 0 56rem 0 32rem;
  display: flex;
  justify-content: space-between;
  .left {
    margin-top: 32rem;
    .name {
      font-size: 24rem;
      font-weight: 700;
    }
    .rate {
      margin-top: 40rem;
      font-size: 48rem;
      color: var(--primary-color);
      line-height: 42rem;
    }
    .num {
      margin-top: 40rem;
      color: var(--font-gray-color);
      line-height: 20rem;
    }
  }
}
</style>
