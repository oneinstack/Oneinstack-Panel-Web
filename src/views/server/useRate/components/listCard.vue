<template>
  <div class="list-card">
    <div class="card">
      <div class="top">
        <p class="name">{{ query.type == 'flow' ? '上行' : '读取' }}</p>
        <div class="round"></div>
      </div>
      <p class="rate">
        {{
          query.type == 'flow' ? `${formatSizeUnits(info.flow.SendRate)}/s` : `${formatSizeUnits(info.io.ReadSpeed)}`
        }}
      </p>
      <p class="date">{{ dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss') }}</p>
    </div>
    <div class="card">
      <div class="top">
        <p class="name">{{ query.type == 'flow' ? '下行' : '写入' }}</p>
        <div class="round"></div>
      </div>
      <p class="rate">
        {{
          query.type == 'flow' ? `${formatSizeUnits(info.flow.RecvRate)}/s` : `${formatSizeUnits(info.io.WriteSpeed)}`
        }}
      </p>
      <p class="date">{{ dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss') }}</p>
    </div>
    <div class="card">
      <div class="top">
        <p class="name">{{ query.type == 'flow' ? '总发送' : '读写次数' }}</p>
        <div class="round"></div>
      </div>
      <p class="rate">{{ query.type == 'flow' ? `${formatSizeUnits(info.flow.BytesSent)}` : `${info.io.ReadOpsPerSec}次/s` }}</p>
      <p class="date">{{ dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss') }}</p>
    </div>
    <div class="card">
      <div class="top">
        <p class="name">{{ query.type == 'flow' ? '总接收' : '读写延迟' }}</p>
        <div class="round"></div>
      </div>
      <p class="rate">{{
              query.type == 'flow' ? `${formatSizeUnits(info.flow.BytesRecv)}` : `${info.io.AvgIoLatency.toFixed(2)}/ms`
            }}</p>
      <p class="date">{{ dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss') }}</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { formatSizeUnits } from '@/utils/index'
import { reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
const route = useRoute()
const query = route.query
const props = defineProps({
  monitorInfo: {
    type: Object
  }
})
const info = reactive<any>({
  flow: {
    SendRate: 0,
    BytesSent: 0,
    RecvRate: 0,
    BytesRecv: 0
  },
  io: {
    ReadSpeed: 0,
    ReadOpsPerSec: 0,
    WriteSpeed: 0,
    AvgIoLatency: 0
  }
})
watch(
  () => props.monitorInfo,
  (newVal) => {
    if (newVal) {
      info.flow = newVal.network.find((item:any) => item.Name === 'all')
      info.io = newVal.disk.find((item:any) => item.Name === 'all')
    }
  }
)
</script>
<style lang="less" scoped>
.list-card {
  display: flex;
  flex-wrap: wrap;
  width: 686rem;
  margin: 0 auto;
  .card {
    height: 238rem;
    background: var(--card-bg-color);
    width: 330rem;
    margin-left: 26rem;
    margin-top: 20rem;
    border-radius: 12rem;
    padding: 32rem;
    margin-top: 32rem;
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .name {
        font-size: 24rem;
        font-weight: 700;
      }
      .round {
        height: 20rem;
        width: 20rem;
        border-radius: 50%;
      }
      .card:nth-of-type(1) .round {
        border: 4rem solid #F98F18;
      }
      .card:nth-of-type(2) .round {
        border: 4rem solid #FF455A;
      }
      .card:nth-of-type(3) .round {
        border: 4rem solid #FFD226;
      }
      .card:nth-of-type(4) .round {
        border: 4rem solid var(--primary-color);
      }
    }

    .rate {
      margin-top: 40rem;
      font-size: 48rem;
      color: var(--primary-color);
      line-height: 42rem;
    }
    .date {
      margin-top: 44rem;
      color: var(--font-gray-color);
      line-height: 20rem;
      font-size: 24rem;
    }
  }
  .card:nth-of-type(odd) {
    margin-left: 0;
  }
}
</style>
