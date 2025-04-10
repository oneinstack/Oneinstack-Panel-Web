<template>
  <x-page no-header tabbar no-footer>
    <Header />
    <div class="content">
      <Memo />
      <div class="server-info">
        <use-rate type="cpu" />
        <use-rate type="ram" />
        <use-rate type="disk" />
        <TrafficDisk type="flow" />
        <TrafficDisk type="io" />
        <!-- <div class="io">
          <div class="header">
            <p class="title">流量</p>
            <div class="more" @click="goPage('flow')">
              <van-icon class="icon" name="arrow" />
            </div>
          </div>
          <div class="data-info">
            <div class="left">
              <p class="label">
                上行:
                <span>1125kb/s</span>
              </p>
              <p class="label">
                下行:
                <span>112kb/s</span>
              </p>
            </div>
            <van-divider vertical />
            <div class="right">
              <p class="label">
                总接收:
                <span>11kb/s</span>
              </p>
              <p class="label">
                总发送:
                <span>55555kb/s</span>
              </p>
            </div>
          </div>
        </div>
        <div class="io">
          <div class="header">
            <p class="title">磁盘IO</p>
            <div class="more" @click="goPage('io')">
              <van-icon class="icon" name="arrow" />
            </div>
          </div>
          <div class="data-info">
            <div class="left">
              <p class="label">
                上行:
                <span>1125kb/s</span>
              </p>
              <p class="label">
                下行:
                <span>112kb/s</span>
              </p>
            </div>
            <van-divider vertical />
            <div class="right">
              <p class="label">
                总接收:
                <span>11kb/s</span>
              </p>
              <p class="label">
                总发送:
                <span>55555kb/s</span>
              </p>
            </div>
          </div>
        </div> -->
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import Header from './components/header.vue'
import Memo from './components/memo.vue'
import useRate from './components/useRate.vue'
import { useRouter } from 'vue-router'
import TrafficDisk from './components/trafficDisk.vue'

const router = useRouter()
const goPage = (type: string) => {
  router.push({
    path: '/useRate',
    query: {
      type: type
    }
  })
}
</script>
<style lang="less" scoped>
.content {
  margin-top: calc(24rem + 566rem + 32rem);
  padding: 0 32rem;
  height: 100%;
  overflow-y: scroll;
  padding-bottom: 36rem;
  .server-info {
    display: flex;
    flex-wrap: wrap;
  }
}
.website {
  color: #00d881;
}
.safety {
  color: #154afc;
}
.data {
  color: #ea00cb;
}
:deep(.van-nav-bar__content) {
  height: 40rem;
}
:deep(.van-hairline--bottom:after) {
  border-bottom-width: 0;
}
:deep(.van-nav-bar__title) {
  font-size: 32rem;
  color: var(--card-bg-color);
}
:deep(.van-nav-bar .van-icon) {
  color: var(--card-bg-color);
}
</style>
