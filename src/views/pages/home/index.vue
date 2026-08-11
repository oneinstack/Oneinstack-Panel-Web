<script setup lang="ts">
import memo from './components/memo.vue'
import { markRaw, onMounted, reactive } from 'vue'
import { useAppStore } from '@/stores/modules/app';
import { Api } from '@/api/modules'
import sutil from '@/utils/sutil'
import { Scope } from 'tools-vue3'
import { EChartsOption } from 'echarts'
import * as echarts from 'echarts'
import basicChart from '@/components/echarts/basic-chart.vue'
import { ElMessage } from 'element-plus'
import System from '@/utils/System'
import { useConfigStore } from '@/stores/modules/config';
import { resolveMenuLabelByKey } from '@/utils/access'
import i18n from '@/lang'

const sapp = useAppStore()
const sconfig = useConfigStore()

type MonitorType = 'network' | 'disk'

interface Options {
  label: string
  labelKey?: string
  value: string | number | object
}

interface HomeCategory {
  name: string
  nameKey: string
  icon: string
  value: string | number
  matrixKey?: string
  permissionKey?: string
  linkFn?: () => void
}

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

interface ChartData {
  times: string[]
  ascend: { value: number; strValue: string }[]
  descend: { value: number; strValue: string }[]
}

const monitorChartMaxPoints = 60

const conf = reactive({
  themeColor: {
    light: ['#F7911C'],
    dark: ['#EAB170']
  },
  category: [
    {
      name: '网站-全部',
      nameKey: 'home.websiteAll',
      icon: 'home-website',
      value: 0,
      matrixKey: 'website',
      permissionKey: 'layout.menu.website',
      linkFn: () => System.router.push('/website')
    },
    {
      name: '数据-全部',
      nameKey: 'home.databaseAll',
      icon: 'home-data',
      value: 0,
      matrixKey: 'database',
      permissionKey: 'layout.menu.database',
      linkFn: () => System.router.push('/database')
    },
    {
      name: '安全风险',
      nameKey: 'home.securityRisk',
      icon: 'home-software',
      value: 0
    },
    {
      name: '备忘录',
      nameKey: 'home.memo',
      icon: 'home-mome',
      value: '',
      linkFn: () => conf.memo.open()
    }
  ] as HomeCategory[],
  handleCategoryClick: (item: HomeCategory) => {
    if (item.matrixKey && !sconfig.hasMenuAccess(item.matrixKey)) {
      const name = item.permissionKey ? t(item.permissionKey, item.name) : resolveMenuLabelByKey(item.matrixKey) || t(item.nameKey, item.name)
      ElMessage.warning(t('home.noMenuPermission', `当前账号暂无${name}菜单权限`, { name }))
      return
    }
    item.linkFn?.()
  },
  getSysCount: async () => {
    const { data: wbsiteCount } = await Api.getWebsiteCount()
    const { data: databaseCount } = await Api.getDatabaseCount()
    conf.category[0].value = wbsiteCount
    conf.category[1].value = databaseCount
  },
  monitorData: {
    selectedType: 'network' as MonitorType,
    selectedCard: {
      label: 'all',
      value: 0
    },
    network: [
      {
        label: '上行',
        labelKey: 'home.upload',
        value: '--'
      },
      {
        label: '下行',
        labelKey: 'home.download',
        value: '--'
      },
      {
        label: '总发送',
        labelKey: 'home.totalSent',
        value: '--'
      },
      {
        label: '总接收',
        labelKey: 'home.totalReceived',
        value: '--'
      }
    ] as Options[],
    disk: [
      {
        label: '读取',
        labelKey: 'home.read',
        value: '--'
      },
      {
        label: '写入',
        labelKey: 'home.write',
        value: '--'
      },
      {
        label: '读取',
        labelKey: 'home.ioCount',
        value: '--'
      },
      {
        label: '写入',
        labelKey: 'home.averageLatency',
        value: '--'
      }
    ] as Options[],
    options: [] as Options[],
    handleChangeType: (type: MonitorType) => {
      conf.monitorData.selectedType = type
      conf.monitorData.chartData = {
        times: [],
        ascend: [],
        descend: []
      }
      conf.monitorData.update(true)
    },
    handleChangeCard: () => conf.monitorData.update(),
    chartData: {
      times: [],
      ascend: [],
      descend: []
    } as ChartData,
    chartOptions: null as EChartsOption | null,
    draw: ({ ascend, descend }: { ascend: ChartData['ascend'][0]; descend: ChartData['descend'][0] }) => {
      conf.monitorData.chartData.times.push(new Date().toLocaleTimeString())
      conf.monitorData.chartData.ascend.push(ascend)
      conf.monitorData.chartData.descend.push(descend)
      const overflow = conf.monitorData.chartData.times.length - monitorChartMaxPoints
      if (overflow > 0) {
        conf.monitorData.chartData.times.splice(0, overflow)
        conf.monitorData.chartData.ascend.splice(0, overflow)
        conf.monitorData.chartData.descend.splice(0, overflow)
      }
      conf.monitorData.chartOptions = {
        color: ['#FFAD79', '#79D1FF'],
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          },
          formatter: (params: any) => {
            const { name, marker: marker1, data: data1, seriesName: seriesName1 } = params[0]
            const { marker: marker2, data: data2, seriesName: seriesName2 } = params[1]
            return `${name} </br> ${seriesName1} ${marker1} ${data1.strValue}/s </br> ${seriesName2} ${marker2} ${data2.strValue}/s`
          }
        },
        grid: {
          left: 0,
          right: '4%',
          top: '5%',
          bottom: '5% ',
          containLabel: true
        },
        xAxis: [
          {
            type: 'category',
            boundaryGap: false,
            data: conf.monitorData.chartData.times,
            axisLabel: {
              margin: 20,
              color: sapp.theme == 'light' ? '#A2A2A2' : '#A2A2A2'
            },
            axisLine: {
              show: false
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
              margin: 20,
              color: sapp.theme == 'light' ? '#A2A2A2' : '#A2A2A2'
            },
            splitLine: {
              lineStyle: {
                color: sapp.theme == 'light' ? '#D6D6D699' : '#435B7199',
                type: [5]
              }
            }
          }
        ],
        series: [
          {
            name: conf.monitorData.selectedType == 'network' ? t('home.upload', '上行') : t('home.read', '读取'),
            type: 'line',
            smooth: 0.42,
            smoothMonotone: 'x',
            lineStyle: {
              width: 2.5,
              cap: 'round',
              join: 'round',
              color: '#FFAD79'
            },
            showSymbol: true,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: {
              color: '#FFAD79',
              borderColor: '#FFFFFF',
              borderWidth: 1.5
            },
            areaStyle: {
              opacity: 1,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(255, 173, 121, 0.42)' },
                { offset: 0.55, color: 'rgba(255, 173, 121, 0.16)' },
                { offset: 1, color: 'rgba(255, 173, 121, 0)' }
              ])
            },
            emphasis: {
              focus: 'series',
              scale: 1.35
            },
            animationDurationUpdate: 500,
            animationEasingUpdate: 'cubicOut',
            data: conf.monitorData.chartData.ascend
          },
          {
            name: conf.monitorData.selectedType == 'network' ? t('home.download', '下行') : t('home.write', '写入'),
            type: 'line',
            smooth: 0.42,
            smoothMonotone: 'x',
            lineStyle: {
              width: 2.5,
              cap: 'round',
              join: 'round',
              color: '#79D1FF'
            },
            showSymbol: true,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: {
              color: '#79D1FF',
              borderColor: '#FFFFFF',
              borderWidth: 1.5
            },
            areaStyle: {
              opacity: 1,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(121, 209, 255, 0.42)' },
                { offset: 0.55, color: 'rgba(121, 209, 255, 0.16)' },
                { offset: 1, color: 'rgba(121, 209, 255, 0)' }
              ])
            },
            emphasis: {
              focus: 'series',
              scale: 1.35
            },
            animationDurationUpdate: 500,
            animationEasingUpdate: 'cubicOut',
            data: conf.monitorData.chartData.descend
          }
        ]
      }
    },
    update: async (isCardChange = false) => {
      const { data: res } = await Api.getSysMonitor()
      if (!conf.monitorData.options.length || isCardChange) {
        conf.monitorData.options = (res[conf.monitorData.selectedType] as any[])
          .map((item: any, i: number) => {
            const option = { label: item.Name, value: i }
            if (item.Name == 'all') conf.monitorData.selectedCard = option
            return option
          })
          .sort((a, b) => a.label.localeCompare(b.label))
      }
      let ascend: ChartData['ascend'][0], descend: ChartData['descend'][0]
      switch (conf.monitorData.selectedType) {
        case 'network':
          {
            const { SendRate, RecvRate, BytesSent, BytesRecv } = res.network.find(
              (item: any) => item.Name == conf.monitorData.selectedCard.label
            )
            ascend = {
              value: parseFloat((SendRate / 1024 / 1024).toFixed(2)),
              strValue: sutil.bytesTransform(SendRate).strValue
            }
            descend = {
              value: parseFloat((RecvRate / 1024 / 1024).toFixed(2)),
              strValue: sutil.bytesTransform(RecvRate).strValue
            }
            conf.monitorData.network = [
              { label: '上行', labelKey: 'home.upload', value: `${sutil.bytesTransform(SendRate).strValue}/s` },
              { label: '下行', labelKey: 'home.download', value: `${sutil.bytesTransform(RecvRate).strValue}/s` },
              { label: '总发送', labelKey: 'home.totalSent', value: sutil.bytesTransform(BytesSent).strValue },
              { label: '总接收', labelKey: 'home.totalReceived', value: sutil.bytesTransform(BytesRecv).strValue }
            ]
          }
          break
        case 'disk':
          {
            const { ReadSpeed, WriteSpeed, ReadOpsPerSec, WriteOpsPerSec, AvgIoLatency } = res.disk.find(
              (item: any) => item.Name == conf.monitorData.selectedCard.label
            )
            ascend = {
              value: parseFloat((ReadSpeed / 1024 / 1024).toFixed(2)),
              strValue: sutil.bytesTransform(ReadSpeed).strValue
            }
            descend = {
              value: parseFloat((WriteSpeed / 1024 / 1024).toFixed(2)),
              strValue: sutil.bytesTransform(WriteSpeed).strValue
            }
            conf.monitorData.disk = [
              { label: '读取', labelKey: 'home.read', value: sutil.bytesTransform(ReadSpeed).strValue },
              { label: '写入', labelKey: 'home.write', value: sutil.bytesTransform(WriteSpeed).strValue },
              { label: '读写次数', labelKey: 'home.ioCount', value: `${ReadOpsPerSec + WriteOpsPerSec}${t('home.timesPerSecond', '次/s')}` },
              { label: '平均延迟', labelKey: 'home.averageLatency', value: `${AvgIoLatency.toFixed(2)}ms` }
            ]
          }
          break
      }
      conf.monitorData.draw({ ascend, descend })
    }
  },
  statusData: {
    chartOptions: null as EChartsOption | null,
    draw: () => {
      const gaugeData = [
        {
          value: conf.statusData.usage.usedPercent,
          name: conf.statusData.getStatusLabel(conf.statusData.selected)
        }
      ]
      conf.statusData.chartOptions = {
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
                color: conf.themeColor[sapp.theme][0]
              }
            },
            axisLine: {
              lineStyle: {
                width: 20,
                color: [[1, `rgba(${sutil.getCssVariable('--category-item-bg-color')}, 0.88)`]]
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
            data: gaugeData,
            title: {
              fontSize: 14,
              color: sutil.getCssVariable('--font-color-gray-light'),
              offsetCenter: [0, '30%']
            },
            detail: {
              width: 200,
              height: 200,
              borderWidth: 0,
              offsetCenter: [0, '60%'],
              rich: {
                a: {
                  fontSize: 24,
                  color: sutil.getCssVariable('--font-color-black'),
                  fontWeight: 500
                },
                b: {
                  fontSize: 18,
                  color: sutil.getCssVariable('--font-color-black'),
                  fontWeight: 500,
                  padding: [5, 0, 0, 0]
                }
              },
              formatter: (value) => {
                const int = value.toFixed(2).split('.')[0]
                const flt = value.toFixed(2).split('.')[1]
                return `{a|${int}}{b|.${flt}%}`
              },
              valueAnimation: true
            }
          },
          {
            animationType: 'scale',
            color: `rgba(${sutil.getCssVariable('--category-item-bg-color')}, 0.88)`,
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
    },
    selected: {
      value: 1,
      label: '内存',
      labelKey: 'home.memory'
    },
    options: markRaw([
      {
        value: 1,
        label: '内存',
        labelKey: 'home.memory'
      },
      {
        value: 2,
        label: '磁盘',
        labelKey: 'home.disk'
      },
      {
        value: 3,
        label: 'CPU',
        labelKey: 'home.cpu'
      }
    ]),
    usage: {
      total: '--',
      available: '--',
      used: '--',
      usedPercent: 0
    } as { total: string; available: string; used: string; usedPercent: number },
    cpuInfo: '',
    getStatusLabel: (item: Options) => item.labelKey ? t(item.labelKey, item.label) : item.label,
    handleStatusChange: () => conf.statusData.update(),
    update: async () => {
      const { data: res } = await Api.getSysinfo()
      switch (conf.statusData.selected.value) {
        case 1:
          {
            const { total, used, available, usedPercent } = res.memory_usage
            conf.statusData.usage.total = sutil.bytesTransform(total).strValue
            conf.statusData.usage.used = sutil.bytesTransform(used).strValue
            conf.statusData.usage.available = sutil.bytesTransform(available).strValue
            conf.statusData.usage.usedPercent = usedPercent
          }
          break
        case 2:
          {
            const rootDisk = res.disk_usage.find((disk: { path: string }) => disk.path === '/')
            if (!rootDisk) {
              // 如果没找到根目录，使用第一个磁盘信息
              const { total, free, used, usedPercent } = res.disk_usage[0]
              conf.statusData.usage.total = sutil.bytesTransform(total).strValue
              conf.statusData.usage.used = sutil.bytesTransform(used).strValue
              conf.statusData.usage.available = sutil.bytesTransform(free).strValue
              conf.statusData.usage.usedPercent = usedPercent
            } else {
              // 使用根目录磁盘信息
              const { total, free, used, usedPercent } = rootDisk
              conf.statusData.usage.total = sutil.bytesTransform(total).strValue
              conf.statusData.usage.used = sutil.bytesTransform(used).strValue
              conf.statusData.usage.available = sutil.bytesTransform(free).strValue
              conf.statusData.usage.usedPercent = usedPercent
            }
          }
          break
        case 3:
          {
            const [usedPercent] = res.cpu_usage
            const { modelName, cores } = res.cpu_info[0]
            conf.statusData.usage.total = '--'
            conf.statusData.usage.used = '--'
            conf.statusData.usage.available = '--'
            conf.statusData.usage.usedPercent = usedPercent
            conf.statusData.cpuInfo = `${modelName} ${cores}${t('home.cores', '核')}`
          }
          break
      }
      conf.statusData.draw()
    }
  },
  memo: {
    data: {
      id: 1,
      content: ''
    },
    show: false,
    open: async () => {
      await conf.memo.getData()
      conf.memo.show = true
    },
    close: () => (conf.memo.show = false),
    getData: async () => {
      const { data: res } = await Api.getSysRemark()
      conf.memo.data = res
      conf.category[3].value = res.content
    },
    update: async () => {
      await Api.updateSysRemark(conf.memo.data)
      ElMessage.success(t('home.saveSuccess', '保存成功'))
      conf.memo.getData()
      conf.memo.show = false
    }
  }
})

const timer = Scope.Timer()
onMounted(() => {
  timer.on(
    () => {
      conf.statusData.update()
      conf.monitorData.update()
    },
    5000,
    true
  )
  conf.monitorData.draw({ ascend: { value: 0, strValue: '0' }, descend: { value: 0, strValue: '0' } })
  conf.getSysCount()
  conf.memo.getData()
})
</script>

<template>
  <div class="home-container">
    <div class="column fit-height fit-width">
      <div class="col column fit-width">
        <div class="col relative fit-width">
          <div class="absolute fit-height fit-width flex column no-wrap" style="gap: 24px">
            <div class="dashboard-intro">
              <div>
                <div class="intro-eyebrow">{{ $t('home.overviewEyebrow') }}</div>
                <h2>{{ $t('home.overviewTitle') }}</h2>
                <p>{{ $t('home.overviewDescription') }}</p>
              </div>
              <div class="live-badge"><i></i> {{ $t('home.liveBadge') }}</div>
            </div>
            <el-row :gutter="20">
              <el-col v-for="item in conf.category" :key="item.name" :lg="6" :md="12" :sm="24">
                <div class="category-item" @click="conf.handleCategoryClick(item)">
                  <div class="icon">
                    <v-s-icon :name="item.icon" size="30" :color="conf.themeColor[sapp.theme]" />
                  </div>
                  <div class="text column items-center">
                    <span :class="{ 'link': typeof item.value === 'string' }">
                      {{ typeof item.value === 'string' && !item.value ? $t('home.emptyMemo') : item.value }}
                    </span>
                    <div class="name">{{ $t(item.nameKey) }}</div>
                  </div>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="24" style="flex: 1">
              <el-col :lg="16" :md="16" :sm="24">
                <div class="basic-card flex column no-wrap fit-height">
                  <div class="basic-card__header">
                    <div class="basic-card__title">{{ $t('home.monitor') }}</div>
                    <div class="miscellaneous">
                      <div class="switch">
                        <span>{{ conf.monitorData.selectedType == 'network' ? $t('home.networkCard') : $t('home.diskCard') }}</span>
                        <el-select
                          v-model="conf.monitorData.selectedCard"
                          :placeholder="$t('home.selectPlaceholder')"
                          style="width: 100%"
                          @change="conf.monitorData.handleChangeCard"
                        >
                          <el-option
                            v-for="item in conf.monitorData.options"
                            :key="item.label"
                            :label="item.label"
                            :value="item"
                          />
                        </el-select>
                      </div>
                      <div class="menu">
                        <div
                          class="item"
                          :class="conf.monitorData.selectedType == 'network' ? 'active' : ''"
                          @click="conf.monitorData.handleChangeType('network')"
                        >
                          {{ $t('home.traffic') }}
                        </div>
                        <div
                          class="item"
                          :class="conf.monitorData.selectedType == 'disk' ? 'active' : ''"
                          @click="conf.monitorData.handleChangeType('disk')"
                        >
                          {{ $t('home.diskIo') }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="basic-card__body flex column no-wrap fit-height">
                    <div class="flow">
                      <el-space class="lefts" :size="20" spacer="|">
                        <div
                          v-for="item in conf.monitorData[conf.monitorData.selectedType]"
                          :key="item.label"
                          class="item"
                        >
                          <span class="label">{{ item.labelKey ? $t(item.labelKey) : item.label }}：</span>
                          <span class="value">{{ item.value }}</span>
                        </div>
                      </el-space>
                      <div class="rights">
                        <div class="upper">
                          <div class="yuan"></div>
                          <span>{{ conf.monitorData.selectedType == 'network' ? $t('home.upload') : $t('home.read') }}</span>
                        </div>
                        <div class="below">
                          <div class="yuan"></div>
                          <span>{{ conf.monitorData.selectedType == 'network' ? $t('home.download') : $t('home.write') }}</span>
                        </div>
                      </div>
                    </div>
                    <basic-chart
                      v-if="conf.monitorData.chartOptions"
                      :option="conf.monitorData.chartOptions as EChartsOption"
                      class="chart-box"
                    />
                  </div>
                </div>
              </el-col>
              <el-col :lg="8" :md="8" :sm="24">
                <div ref="statusCard" class="basic-card flex column no-wrap fit-height">
                  <div class="basic-card__header">
                    <div class="basic-card__title">{{ $t('home.status') }}</div>
                    <div class="status-right">
                      <el-select
                        v-model="conf.statusData.selected"
                        :placeholder="$t('home.selectStatus')"
                        style="width: 100px; margin-right: 10px"
                        @change="conf.statusData.handleStatusChange"
                      >
                        <el-option
                          v-for="item in conf.statusData.options"
                          :key="item.value"
                          :label="item.labelKey ? $t(item.labelKey) : item.label"
                          :value="item"
                        />
                      </el-select>
                    </div>
                  </div>
                  <div class="basic-card__body" style="flex: 1">
                    <div class="norule">
                      <basic-chart
                        v-if="conf.statusData.chartOptions"
                        :option="conf.statusData.chartOptions as EChartsOption"
                        style="width: 256px; height: 256px"
                      />
                      <div class="status-title">
                        <span v-if="conf.statusData.selected.value !== 3">
                          {{ conf.statusData.usage.used }} / {{ conf.statusData.usage.total }}
                        </span>
                        <span v-else>{{ conf.statusData.cpuInfo }}</span>
                      </div>
                      <div class="status-menu" style="margin-bottom: 20px">
                        <div class="b1">
                          {{ $t('home.total') }}：
                          <span>{{ conf.statusData.usage.total }}</span>
                        </div>
                        <div class="b2">
                          {{ $t('home.used') }}：
                          <span>{{ conf.statusData.usage.used }}</span>
                        </div>
                      </div>
                      <div class="status-menu">
                        <div class="b1">
                          {{ $t('home.available') }}：
                          <span>{{ conf.statusData.usage.available }}</span>
                        </div>
                        <div class="b2">
                          {{ $t('home.usage') }}：
                          <span>{{ conf.statusData.usage.usedPercent.toFixed(2) }} %</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
            <div class="basic-card" style="background: transparent" />
          </div>
        </div>
      </div>
    </div>
    <memo :show="conf.memo.show" :memo="conf.memo.data" :close="conf.memo.close" :update="conf.memo.update" />
  </div>
</template>

<style scoped lang="less">
@media screen and (max-width: 1200px) {
  .category-item {
    margin-bottom: 16px;
  }
}

.home-container {
  width: 100%;
  height: 100%;
  padding-bottom: 50px;

  .basic-card {
    width: 100%;
    background: rgb(var(--bg-card-color));
    border-radius: 16px;
    padding: 21px 46px;

    &__title {
      display: flex;
      align-items: center;
      position: relative;
      font-family: PingFang SC;
      font-weight: 500;
      font-size: 16px;
      color: var(--font-color-black);

      &::before {
        content: '';
        background: var(--el-color-primary);
        width: 5px;
        height: 22px;
        margin-right: 18px;
      }
    }

    &__header {
      padding: 17px 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid rgb(var(--border-color-gray-light));
    }

    &__body {
      padding: 24px 0;
    }
  }

  .category-item {
    padding: 36px 32px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background: rgb(var(--bg-card-color));
    border-radius: 16px;
    border: 2px solid transparent;
    transition: border-color 0.3s;

    &:hover {
      border-color: rgba(var(--primary-color), 0.88);

      .icon {
        border-color: rgba(var(--primary-color), 0.63);
      }
    }

    .icon {
      width: 102px;
      height: 102px;
      background: rgba(var(--category-item-bg-color), 0.88);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      flex: 0 0 102px;
      border: 3px solid transparent;
    }

    .text {
      width: 100%;
      gap: 22px;

      span {
        font-weight: 500;
        font-size: 24px;
        color: var(--font-color-black);
        text-align: center;
        display: inline-block;
        width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &.link {
          font-weight: 400;
          font-size: 16px;
          cursor: pointer;
          text-decoration: underline;
        }
      }

      .name {
        font-size: 16px;
        color: var(--font-color-gray-light);
      }
    }
  }

  .miscellaneous {
    height: 36px;
    display: flex;
    flex-direction: row;
    align-items: center;

    .switch {
      width: 202px;
      height: 100%;
      border-radius: 2px;
      border: 0.4px solid rgb(var(--border-color-gray));
      margin-right: 14px;
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: space-between;

      span {
        flex: 0 0 45px;
        color: var(--font-color-gray-light);
        border-right: 1px solid rgba(var(--border-color-gray), 0.5);
        padding: 0 5px 0 10px;
        margin-right: 10px;
      }
    }

    .menu {
      height: 100%;
      display: flex;
      color: var(--font-color-black);
      border-radius: 2px;
      border: 0.4px solid rgb(var(--border-color-gray));
      overflow: hidden;

      .item {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 5px 10px;
        cursor: pointer;
      }

      .active {
        background: var(--el-color-primary);
        border: 1px solid var(--el-color-primary);
        color: var(--font-color-white);
      }
    }
  }

  .flow {
    width: 100%;
    display: flex;
    justify-content: space-between;

    .lefts {
      color: var(--font-color-gray);

      .value {
        color: var(--el-color-primary);
      }
    }

    .rights {
      display: flex;
      flex-direction: row;
      align-items: center;

      .upper,
      .below {
        display: flex;
        flex-direction: row;
        align-items: center;
        color: var(--font-color-gray-light);
        font-size: 14px;
        margin-right: 10px;

        .yuan {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgb(var(--primary-color));
          margin-right: 10px;
        }
      }

      .below .yuan {
        background: rgb(var(--blue-color));
        margin-left: 5px;
      }
    }
  }

  .chart-box {
    margin-top: 24px;
    width: 100%;
    height: 100%;
  }

  .status-right {
    width: 97px;
    height: 36px;
    border-radius: 2px;
    border: 0.4px solid rgb(var(--border-color-gray));
  }

  .norule {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .status-title {
      color: var(--font-color-black);
      margin-top: 26px;
      font-size: 18px;
      margin-bottom: 40px;
    }

    .status-menu {
      display: flex;

      .b1 {
        font-size: 14px;
        margin-right: 30px;
        padding-right: 20px;
        border-right: 1px solid rgba(var(--border-color-gray), 0.5);
        color: var(--font-color-gray);

        span {
          color: #EAB170;
        }
      }

      .b2 {
        font-size: 14px;
        color: var(--font-color-gray);

        span {
          color: #EAB170;
        }
      }
    }
  }

  :deep(.el-select) {
    &__placeholder {
      color: var(--font-color-black);
    }

    &__wrapper {
      border: none;
      background-color: transparent;
      box-shadow: none;
    }
  }

  .dashboard-intro {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;

    .intro-eyebrow {
      margin-bottom: 7px;
      color: rgb(var(--primary-color));
      font-size: 10px;
      font-weight: 750;
      letter-spacing: 0.15em;
    }

    h2 {
      color: var(--text-primary);
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.035em;
    }

    p {
      margin-top: 7px;
      color: var(--text-tertiary);
      font-size: 12px;
    }

    .live-badge {
      height: 34px;
      padding: 0 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid rgba(var(--success-color), 0.17);
      border-radius: 999px;
      color: rgb(var(--success-color));
      background: rgba(var(--success-color), 0.07);
      font-size: 10px;
      font-weight: 600;

      i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: currentColor;
        box-shadow: 0 0 0 4px rgba(var(--success-color), 0.11);
      }
    }
  }

  .basic-card {
    padding: 20px 22px;
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    background: var(--surface-card);
    box-shadow: var(--shadow-xs);

    &__title {
      font-size: 14px;
      font-weight: 650;

      &::before {
        width: 3px;
        height: 16px;
        margin-right: 9px;
        border-radius: 99px;
      }
    }

    &__header {
      padding: 0 0 17px;
      border-bottom: 1px solid var(--border-subtle);
    }

    &__body {
      padding: 20px 0 0;
    }
  }

  .category-item {
    min-height: 124px;
    padding: 20px;
    justify-content: flex-start;
    gap: 17px;
    border: 1px solid var(--border-subtle);
    border-radius: 15px;
    background: var(--surface-card);
    box-shadow: var(--shadow-xs);
    cursor: pointer;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-3px);
      border-color: rgba(var(--primary-color), 0.26);
      box-shadow: var(--shadow-sm);

      .icon {
        border-color: transparent;
        background: rgba(var(--primary-color), 0.13);
      }
    }

    .icon {
      width: 56px;
      height: 56px;
      flex: 0 0 56px;
      border: 0;
      border-radius: 15px;
      background: rgba(var(--primary-color), 0.08);
      transition: background-color 0.2s ease;
    }

    .text {
      width: auto;
      align-items: flex-start;
      gap: 8px;

      span {
        width: auto;
        max-width: 150px;
        color: var(--text-primary);
        font-size: 21px;
        font-weight: 700;
        text-align: left;

        &.link {
          color: rgb(var(--primary-color));
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }
      }

      .name {
        color: var(--text-tertiary);
        font-size: 11px;
      }
    }
  }

  .miscellaneous {
    .switch,
    .menu {
      height: 36px;
      overflow: hidden;
      border: 1px solid var(--border-subtle);
      border-radius: 9px;
      background: var(--surface-subtle);
    }

    .switch {
      width: 190px;

      span {
        color: var(--text-tertiary);
        border-color: var(--border-subtle);
        font-size: 11px;
      }
    }

    .menu .item {
      min-width: 56px;
      color: var(--text-tertiary);
      font-size: 11px;
    }

    .menu .active {
      border: 0;
      border-radius: 7px;
      color: #fff;
      background: rgb(var(--primary-color));
    }
  }

  .flow {
    .lefts {
      color: var(--text-tertiary);
      font-size: 11px;
    }

    .rights {
      .upper,
      .below {
        color: var(--text-tertiary);
        font-size: 11px;
      }
    }
  }

  .status-right {
    height: 36px;
    border: 1px solid var(--border-subtle);
    border-radius: 9px;
    background: var(--surface-subtle);
  }

  .norule {
    .status-title {
      margin: 14px 0 26px;
      font-size: 17px;
      font-weight: 650;
    }

    .status-menu {
      width: 100%;
      justify-content: center;

      .b1,
      .b2 {
        min-width: 112px;
        color: var(--text-tertiary);
        font-size: 11px;

        span {
          color: rgb(var(--primary-color));
          font-weight: 650;
        }
      }

      .b1 {
        border-color: var(--border-subtle);
      }
    }
  }
}

@media (max-width: 900px) {
  .home-container {
    .dashboard-intro {
      align-items: flex-start;
      flex-direction: column;
    }

    .miscellaneous {
      height: auto;
      align-items: stretch;
      flex-direction: column;
      gap: 8px;
    }
  }
}

@media (max-width: 600px) {
  .home-container {
    .dashboard-intro {
      h2 {
        font-size: 21px;
      }
    }

    .basic-card {
      padding: 16px;
    }

    .category-item {
      min-height: 104px;
      margin-bottom: 12px;
      padding: 16px;
    }

    .flow {
      align-items: flex-start;
      flex-direction: column;
      gap: 12px;
    }
  }
}
</style>
