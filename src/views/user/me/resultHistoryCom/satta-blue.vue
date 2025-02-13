<template>
  <!-- content -->
  <div class="result-title" style="display: flex; justify-content: space-between">
    <div>{{ $t('game.drawID') }}</div>
    <div>{{ $t('game.number') }}</div>
  </div>
  <div class="result-list">
    <template v-for="(item, index) in conf.resultList" :key="index">
      <div class="result-ltem">
        <div class="issue">{{ item.openExpect }}</div>
        <div class="purchase-num" v-if="item.openCode">
          <img class="sum-img" src="/static/img/color-red.webp" />
          <div class="sum-num">{{ conf.ripr(item.openCode) }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Scope } from 'tools-vue3'
const { conf } = Scope.getConf()
</script>

<style lang="less" scoped>
@import '@/styles/resultHistory-blue.less';
</style>