<template>
  <x-page :fixed="false">
    <template #title>
      {{ $t('luckyBox.receptionRecord') }}
    </template>
    <template #top>
      <x-tabs
        style="background: #fff"
        :list="conf.tabs.list"
        v-model:active="conf.tabs.currentIndex"
        @change="conf.tabs.change"
      />
    </template>
    <div
      v-if="!conf.record.loading && conf.record.list.length === 0"
      class="flex column flex-center"
      style="height: 60%; color: #fe7501"
    >
      <img mode="heightFix" src="/static/img/wallet/no-method.png" />
      <span>{{ $t('user.noMore') }}</span>
    </div>
    <div class="content column" style="padding: 20rem 32rem; gap: 20rem">
      <div v-for="item in conf.record.list" :key="item.id">
        <RecordCard :item="item" />
      </div>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import RecordCard from './components/record-card.vue'
import { index } from './ts/record'

const conf = index()
</script>