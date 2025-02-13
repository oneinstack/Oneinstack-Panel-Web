<template>
  <!-- content -->
  <div class="result-title">
    <div style="width: 36%; padding-right: 20rem">{{ $t('game.drawID') }}</div>
    <div style="width: 34%">{{ $t('winGo.Block') }}</div>
    <div style="width: 15%">{{ $t('winGo.BS') }}</div>
    <div style="width: 15%">{{ $t('game.result') }}</div>
  </div>
  <div class="result-list">
    <template v-for="(item, index) in conf.resultList" :key="index">
      <div class="result-ltem" v-if="item.openCode">
        <div style="width: 36%; word-break: break-all; font-size: 28rem">{{ item.openExpect }}</div>
        <div style="width: 34%" class="share-point">
          {{ '**' + item.openNumberStr }}
        </div>
        <div style="width: 15%; display: flex; justify-content: center">
          <div class="sum-type" v-if="item.openNumber > 4">
            <div class="win-go-sum flex-center active_blue">B</div>
          </div>
          <div class="sum-type" v-else>
            <div class="win-go-sum flex-center active_yellow">S</div>
          </div>
        </div>
        <div style="width: 15%; display: flex; justify-content: center">
          <div class="banner-item" v-if="String(item.openNumber)">
            <div class="num" :class="['qkball_' + item.color]">
              <span class="txt">{{ item.openNumber }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="result-ltem" v-else>
        <div style="width: 36%; word-break: break-all; font-size: 28rem">{{ item.openExpect }}</div>
        <div style="width: 34%" class="share-point">
          {{ '--' }}
        </div>
        <div style="width: 15%; display: flex; justify-content: center">
          <div class="sum-type">{{ '--' }}</div>
        </div>
        <div style="width: 15%; display: flex; justify-content: center">
          <div class="banner-item" v-if="String(item.openNumber)">
            <div class="num">{{ '--' }}</div>
          </div>
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