<template>
  <!-- content -->
  <div class="result-title">
    <div style="width: 30%">{{ $t('game.drawID') }}</div>
    <div style="width: 59%">{{ $t('game.result') }}</div>
    <div style="width: 11%">{{ $t('game.sum') }}</div>
  </div>
  <div class="result-list">
    <template v-for="(item, index) in conf.resultList" :key="index">
        <div class="result-ltem" v-if="item.openCode">
          <div style="width: 30%; word-break: break-all; font-size: 28rem">{{ item.openExpect }}</div>
          <div style="width: 59%" class="share-point">
            <template v-for="into in item.openCode.split(',')">
              <resultBall :num="into" :size="42" style="margin-right: 4rem;"/>
            </template>
          </div>
          <div style="width: 11%; display: flex; justify-content: center">
            <div class="sum">
              <div class="sum-num">{{ conf.getTotal(item.openCode) }}</div>
            </div>
          </div>
        </div>
      </template>
  </div>
</template>

<script setup lang="ts">
import { Scope } from 'tools-vue3'
const { conf } = Scope.getConf()
import resultBall from '@/views/game/MarkSix/components/resultBall.vue'
</script>

<style lang="less" scoped>
@import '@/styles/resultHistory.less';
</style>