<template>
  <x-page :no-footer="true" :bgcolor="'#FFFFFF'">
    <template #title>
      {{ $t('point.exchangeRecord') }}
    </template>
    <div class="record-list">
      <template v-for="(item, index) in conf.recordList" :key="index">
        <div class="record-item">
          <div class="record-left">
            <div class="point-name">{{ item.rewardName }}</div>
            <div class="point-time">{{ sutil.getTimeFormat(item.exchangeTime) }}</div>
          </div>
          <div class="record-right">{{ conf.getNum(item.integral) }}</div>
        </div>
      </template>
    </div>
    <div :style="{ 'margin-top': conf.loading && conf.recordList.length > 0 ? '-50rem' : '0' }">
      <loading v-if="conf.loading"></loading>
    </div>
    <no-data v-if="!conf.loading && conf.recordList.length == 0"></no-data>
  </x-page>
</template>

<script setup lang="ts">
import loading from '../tasks/components/loading.vue'
import { index } from './exchange'
import sutil from '@/sstore/sutil'

const conf = index()
</script>

<style lang="less" scoped>
.record-list {
  .record-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #f6f7fa;
    padding: 20rem 30rem 20rem 20rem;
    font-size: 26rem;

    .record-left {
      color: #000;

      .point-name {
        font-weight: 500;
        font-size: 28rem;
      }

      .point-time {
        color: #999;
      }
    }
  }
}
</style>
