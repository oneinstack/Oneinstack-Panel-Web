<template>
    <x-page :fixed="false" :headerBgColor="stheme.theme.blue.headerBgColor()">
      <template #title>
        {{ $t('luckyBox.receptionRecord') }}
      </template>
      <template #top>
        <x-tabs
          style="background: #fff"
          :list="conf.tabs.list"
          v-model:active="conf.tabs.currentIndex"
          @change="conf.tabs.change"
          lineColor="linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%)"
        />
      </template>
      <x-no-data v-if="!conf.record.loading && conf.record.list.length === 0"/>
      <div class="content column" style="padding: 20rem 32rem; gap: 20rem">
        <div v-for="item in conf.record.list" :key="item.id">
          <RecordCard :item="item" />
        </div>
      </div>
    </x-page>
  </template>
  
  <script setup lang="ts">
  import RecordCard from './components/record-card-blue.vue'
  import { index } from './ts/record'
  import stheme from '@/sstore/stheme'
  
  const conf = index()
  </script>

  <style lang="less" scoped>
  .no-data{
    background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%) !important;
    background-clip: text;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
  }
  </style>  
