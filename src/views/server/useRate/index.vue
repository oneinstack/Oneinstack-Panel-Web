<template>
  <x-page no-header tabbar no-footer>
    <x-statusbar />
    <div class="header">
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
      <ECharts v-if="['cpu', 'ram', 'disk'].includes(route.query.type as ServerMetricType)" :option="option" />
      <ECharts v-else :option="option1" />
    </div>
    <card v-if="['cpu', 'ram', 'disk'].includes(route.query.type as ServerMetricType)" />
    <listCard v-else />
  </x-page>
</template>
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import card from './components/card.vue'
import listCard from './components/listCard.vue'
import echarts, { ECOption } from '@/components/ECharts/config/index'
import ECharts from '@/components/ECharts/index.vue'
import { toPx } from '@/utils'
type ServerMetricType = 'cpu' | 'ram' | 'disk' | 'io' | 'flow' // 定义明确类型
const router = useRouter()
const route = useRoute()
const title = computed(() => {
  return routeTitle[route.query.type as ServerMetricType]
})
const routeTitle = {
  'cpu': 'cpu使用率',
  'ram': '内存使用率',
  'disk': '硬盘使用率',
  'io': '磁盘IO',
  'flow': '流量'
}
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
const option: ECOption = {
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
      data: ['9:46:11', '9:46:15', '9:46:18', '9:46:21', '9:46:24', '9:46:27'],
      axisLabel: {
        color: '#a1a1a1'
      },
      axisTick: {
        show: false
      }
    }
  ],
  yAxis: [
    {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        color: '#a1a1a1'
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
      name: 'Direct',
      type: 'line',
      stack: 'Total',
      lineStyle: {
        color: '#F98F18'
      },
      areaStyle: {
        // 颜色自上而下渐变
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: '#F98F18'
          },
          {
            offset: 1,
            color: '#ffffff'
          }
        ]),
        opacity: 1 // 填充区域透明度
      },
      emphasis: {
        focus: 'series'
      },
      data: [75, 40, 52, 24, 11, 23, 23]
    }
  ]
}
const option1: ECOption = {
    color:['#F98F18', '#FF455A', '#FFD226', '#27D7D7'],
  legend: {
    icon: 'roundRect',
    itemWidth: toPx(10),
    itemHeight: toPx(10),
    itemGap: toPx(28),
    borderRadius:toPx(5),
    data: ['上行', '下行', '总发送', '总接收']
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
      data: ['9:46:11', '9:46:15', '9:46:18', '9:46:21', '9:46:24', '9:46:27'],
      axisLabel: {
        color: '#a1a1a1'
      },
      axisTick: {
        show: false
      }
    }
  ],
  yAxis: [
    {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        color: '#a1a1a1'
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
      name: '上行',
      type: 'line',
      stack: 'top',
      lineStyle: {
        color: '#F98F18'
      },
      areaStyle: {
        // 颜色自上而下渐变
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: '#F98F18'
          },
          {
            offset: 1,
            color: '#ffffff'
          }
        ]),
        opacity: 1 // 填充区域透明度
      },
      emphasis: {
        focus: 'series'
      },
      data: [45, 20, 32, 24, 14, 65, 83]
    },
    {
      symbol: 'none', //去掉折线图中的节点
      smooth: true, //true 为平滑曲线，false为直线
      name: '下行',
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
            color: '#ffffff'
          }
        ]),
        opacity: 1 // 填充区域透明度
      },
      emphasis: {
        focus: 'series'
      },
      data: [75, 40, 52, 24, 11, 23, 23]
    },
    {
      symbol: 'none', //去掉折线图中的节点
      smooth: true, //true 为平滑曲线，false为直线
      name: '总发送',
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
            color: '#ffffff'
          }
        ]),
        opacity: 1 // 填充区域透明度
      },
      emphasis: {
        focus: 'series'
      },
      data: [25, 40, 26, 54, 33, 73, 45]
    },
    {
      symbol: 'none', //去掉折线图中的节点
      smooth: true, //true 为平滑曲线，false为直线
      name: '总接收',
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
            color: '#ffffff'
          }
        ]),
        opacity: 1 // 填充区域透明度
      },
      emphasis: {
        focus: 'series'
      },
      data: [80, 55, 82, 74, 18, 23, 65]
    }
  ]
}
</script>
<style lang="less" scoped>
.header {
  background: #ffffff;
  .van-nav-bar {
    margin-top: 128rem;
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
  margin-top: 24rem;
  background-color: #ffffff;
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
      color: #5d5d5d;
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
      background: #f98f18;
    }
    .active {
      font-weight: 800;
    }
  }
}
.chart {
  height: 324rem;
  background: #ffffff;
  width: 686rem;
  margin: 0 auto;
  margin-top: 20rem;
  border-radius: 12rem;
  padding: 36rem 28rem 40rem 18rem;
}
</style>
