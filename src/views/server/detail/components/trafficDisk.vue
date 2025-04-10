<template>
  <div :class="props.type">
    <div class="header">
      <p class="title">流量</p>
      <div class="more" @click="goPage()">
        <van-icon class="icon" name="arrow" />
      </div>
    </div>
    <div class="data-info">
      <div class="left">
        <p class="label">
          {{ props.type == 'flow' ? '上行' : '读取' }}:
          <span>
            {{
              props.type == 'flow'
                ? `${formatSizeUnits(info.flow.SendRate)}/s`
                : `${formatSizeUnits(info.io.ReadSpeed)}`
            }}
          </span>
        </p>
        <p class="label">
          {{ props.type == 'flow' ? '下行' : '写入' }}:
          <span>
            {{
              props.type == 'flow'
                ? `${formatSizeUnits(info.flow.RecvRate)}/s`
                : `${formatSizeUnits(info.io.WriteSpeed)}`
            }}
          </span>
        </p>
      </div>
      <van-divider vertical />
      <div class="right">
        <p class="label">
          {{ props.type == 'flow' ? '总发送' : '读写次数' }}
          <span>
            {{ props.type == 'flow' ? `${formatSizeUnits(info.flow.BytesSent)}` : `${info.io.ReadOpsPerSec}次/s` }}
          </span>
        </p>
        <p class="label">
          {{ props.type == 'flow' ? '总接收' : '读写延迟' }}
          <span>
            {{
              props.type == 'flow' ? `${formatSizeUnits(info.flow.BytesRecv)}` : `${info.io.AvgIoLatency.toFixed(2)}/ms`
            }}
          </span>
        </p>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { apis } from '@/api'
import { formatSizeUnits } from '@/utils/index'
import { onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const props = defineProps({
  type: {
    type: String,
    default: 'ram'
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
const info = reactive({
  flow: {
    BytesSent: 0,
    BytesRecv: 0,
    PacketsSent: 0,
    PacketsRecv: 0,
    SendRate: 0,
    RecvRate: 0
  },
  io: {
    ReadSpeed: 0,
    WriteSpeed: 0,
    ReadOpsPerSec: 0,
    WriteOpsPerSec: 0,
    AvgIoLatency: 0
  }
})
const getData = async () => {
  const { data: res } = await apis.getSysMonitor()
  info.flow = res.network[1]
  info.io = res.disk[3]
  // if (!conf.monitorData.options.length || isCardChange) {
  //   conf.monitorData.options = (res[conf.monitorData.selectedType] as any[])
  //     .map((item: any, i: number) => {
  //       const option = { label: item.Name, value: i }
  //       if (item.Name == 'all') conf.monitorData.selectedCard = option
  //       return option
  //     })
  //     .sort((a, b) => a.label.localeCompare(b.label))
  // }
  // let ascend: ChartData['ascend'][0], descend: ChartData['descend'][0]
  // switch (conf.monitorData.selectedType) {
  //   case 'network':
  //     {
  //       const { SendRate, RecvRate, BytesSent, BytesRecv } = res.network.find(
  //         (item: any) => item.Name == conf.monitorData.selectedCard.label
  //       )
  //       ascend = {
  //         value: parseFloat((SendRate / 1024 / 1024).toFixed(2)),
  //         strValue: sutil.bytesTransform(SendRate).strValue
  //       }
  //       descend = {
  //         value: parseFloat((RecvRate / 1024 / 1024).toFixed(2)),
  //         strValue: sutil.bytesTransform(RecvRate).strValue
  //       }
  //       conf.monitorData.network = [
  //         {
  //           label: t('home.upstream'),
  //           value: `${sutil.bytesTransform(SendRate).strValue}/s`
  //         },
  //         {
  //           label: t('home.downstream'),
  //           value: `${sutil.bytesTransform(RecvRate).strValue}/s`
  //         },
  //         {
  //           label: t('home.totalSend'),
  //           value: sutil.bytesTransform(BytesSent).strValue
  //         },
  //         {
  //           label: t('home.totalReceive'),
  //           value: sutil.bytesTransform(BytesRecv).strValue
  //         }
  //       ]
  //     }
  //     break
  //   case 'disk':
  //     {
  //       const { ReadSpeed, WriteSpeed, ReadOpsPerSec, WriteOpsPerSec, AvgIoLatency } = res.disk.find(
  //         (item: any) => item.Name == conf.monitorData.selectedCard.label
  //       )
  //       ascend = {
  //         value: parseFloat((ReadSpeed / 1024 / 1024).toFixed(2)),
  //         strValue: sutil.bytesTransform(ReadSpeed).strValue
  //       }
  //       descend = {
  //         value: parseFloat((WriteSpeed / 1024 / 1024).toFixed(2)),
  //         strValue: sutil.bytesTransform(WriteSpeed).strValue
  //       }
  //       conf.monitorData.disk = [
  //         {
  //           label: t('home.read'),
  //           value: sutil.bytesTransform(ReadSpeed).strValue
  //         },
  //         {
  //           label: t('home.write'),
  //           value: sutil.bytesTransform(WriteSpeed).strValue
  //         },
  //         {
  //           label: t('home.readCount'),
  //           value: `${ReadOpsPerSec + WriteOpsPerSec}次/s`
  //         },
  //         { label: t('home.averageDelay'), value: `${AvgIoLatency.toFixed(2)}ms` }
  //       ]
  //     }
  //     break
  // }
  // conf.monitorData.draw({ ascend, descend })
}
onMounted(() => {
  getData()
})
</script>
<style lang="less" scoped>
.flow,
.io {
  height: 220rem;
  width: 686rem;
  background: url('/static/img/server/item.png');
  background-size: 100%;
  margin-top: 24rem;
  padding: 32rem;
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    line-height: 24rem;
    .title {
      font-size: 28rem;
      color: var(--font-dark-color);
      font-weight: 700;
    }
    .more {
      background: var(--primary-color);
      height: 32rem;
      line-height: 32rem;
      text-align: center;
      width: 32rem;
      border-radius: 50%;
      .icon {
        color: var(--font-light-color);
        font-size: 22rem;
      }
    }
  }
  .data-info {
    margin-top: 44rem;
    height: 72rem;
    display: flex;
    justify-content: space-between;
    .left {
      padding-right: 64rem;
      flex: 1;
    }
    .right {
      padding-left: 64rem;
      flex: 1;
    }
    .left,
    .right {
      .label {
        font-size: 24rem;
        color: var(--font-gray-color);
        margin-top: 36rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        line-height: 20rem;
        span {
          font-size: 28rem;
          color: var(--primary-color);
        }
      }
      .label:first-child {
        margin-top: 0;
      }
    }
  }
}
</style>
