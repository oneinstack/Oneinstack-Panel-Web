<template>
  <div class="app-card">
    <div class="top">
      <div class="left">
        <van-image width="72rem" height="72rem" :src="item.icon" />
        <div class="info">
          <p class="name">{{ item.name }}</p>
          <p class="introduce">{{ item.describe }}</p>
        </div>
      </div>
      <div :class="item.status == 1 ? 'run' : 'stop'">{{ item.status == 1 ? t('app.running') : t('app.stopping') }}</div>
    </div>
    <van-divider />
    <div class="footer">
      <span @click="openLog(item)">{{ $t("commons.button.log") }}</span>
      <div class="btns">
        <div class="btn restart">{{ $t("commons.button.restart") }}</div>
        <div class="btn stop" @click="openStop">{{ $t("commons.button.stop") }}</div>
      </div>
    </div>
    <logDialog ref="logRef" />
    <stopDialog ref="stopRef" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import logDialog from './log.vue'
import stopDialog from './stop.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps({
  item: {
    type: Object,
    default: () => ({})
  }
})
const logRef = ref()
const openLog = (item: any) => {
  logRef.value.open(item)
}
const stopRef = ref()
const openStop = () => {
  stopRef.value.open()
}
</script>
<style scoped lang="less">
.app-card {
  width: 100%;
  height: 100%;
  .top {
    display: flex;
    justify-content: space-between;
    .left {
      display: flex;
      .info {
        margin-left: 28rem;
        .name {
          font-size: 32rem;
          font-weight: 700;
        }
        .introduce {
          width: 272rem;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }
    }
    .run {
      color: var(--success-color);
    }
    .stop {
      color: var(--warning-color);
    }
  }
  .van-divider {
    margin: 0;
    margin-top: 36rem;
    margin-bottom: 28rem;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    span {
      color: var(--font-gray-color);
      border-bottom: 1px solid var(--font-gray-color);
    }
    .btns {
      display: flex;
      .btn {
        width: 108rem;
        height: 52rem;
        line-height: 52rem;
        text-align: center;
        margin-left: 32rem;
        border-radius: 12rem;
      }
      .restart {
        border: 1px solid var(--font-gray-color);
        color: var(--font-gray-color);
      }
      .stop {
        border: 1px solid var(--primary-color);
        color: var(--primary-color);
      }
    }
  }
}
</style>
