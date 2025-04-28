<template>
  <div :class="props.type">
    <div class="header">
      <p class="title">{{ titleMap[props.type] }}</p>
      <div class="more" @click="goPage()">
        <van-icon class="icon" name="arrow" />
      </div>
    </div>
    <div class="data-info">
      <div class="left">
        <p class="label">
          {{ props.type == 'flow' ? t('home.upstream') : t('home.read') }}:
          <span>
            {{
              props.type == 'flow'
                ? `${formatSizeUnits(info.flow.SendRate)}/s`
                : `${formatSizeUnits(info.io.ReadSpeed)}`
            }}
          </span>
        </p>
        <p class="label">
          {{ props.type == 'flow' ? t('home.downstream') : t('home.write') }}:
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
          {{ props.type == 'flow' ? t('home.totalSend') :  t('home.readNum') }}
          <span>
            {{ props.type == 'flow' ? `${formatSizeUnits(info.flow.BytesSent)}` : `${info.io.ReadOpsPerSec}次/s` }}
          </span>
        </p>
        <p class="label">
          {{ props.type == 'flow' ? t('home.totalReceive') : t('home.readLatency') }}
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
import { formatSizeUnits, titleMap } from '@/utils/index'
import { onMounted, onUnmounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
const { t } = useI18n()
const router = useRouter()
const props = defineProps({
  type: {
    type: String,
    default: 'ram'
  },
  monitorInfo: {
    type: Object,
    required: true
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
// 监听数据变化并更新
watch(
  () => props.monitorInfo,
  (newInfo) => {
    if (newInfo) {
      info.flow = newInfo.network.find((item:any) => item.Name === 'all')
      info.io = newInfo.disk.find((item:any) => item.Name === 'all')
    }
  },
  { deep: true }
)
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
