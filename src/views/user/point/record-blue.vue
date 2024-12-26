<template>
  <x-page :no-footer="true" :bgcolor="'#FFFFFF'" :header-bg-color="stheme.theme.blue.headerBgColor()">
    <template #title>
      {{ $t('point.pointRecord') }}
    </template>
    <div class="record-list">
      <template v-for="(item, index) in conf.pointList" :key="index">
        <div class="record-item">
          <div class="record-left">
            <div class="point-name">{{ conf.getType(item.pointsType) }}</div>
            <div class="point-time">{{ sutil.getTimeFormat(item.changeTime) }}</div>
          </div>
          <div class="record-r" v-if="item.pointsType == 2 || item.pointsType == 5">-{{ item.changePoints }}</div>
          <div class="record-g" v-else>+{{ item.changePoints }}</div>
        </div>
      </template>
    </div>
    <div :style="{ 'margin-top': conf.loading && conf.pointList.length > 0 ? '-50rem' : '0' }">
      <loading v-if="conf.loading"></loading>
    </div>
    <x-no-data v-if="!conf.loading && conf.pointList.length == 0"></x-no-data>
  </x-page>
</template>

<script setup lang="ts">
import loading from '../tasks/components/loading.vue'
import { index } from './record'
import stheme from '@/sstore/stheme'

const { conf, sutil } = index()
</script>

<style lang="less" scoped>
.record-list {
  .record-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #f6f7fa;
    padding: 20rem;
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

    .record-r {
      color: #ff273e;
    }

    .record-g {
      color: #00c308;
    }
  }
}
</style>
