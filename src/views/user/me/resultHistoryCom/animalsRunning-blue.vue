<template>
  <!-- content -->
  <div class="result-title">
    <div style="width: 30%">{{ $t('game.drawID') }}</div>
    <div style="width: 70%">{{ $t('game.result') }}</div>
  </div>
  <div class="result-list">
    <template v-for="(item, index) in conf.resultList" :key="index">
        <div class="result-ltem" v-if="item.openCode">
          <div style="width: 30%; word-break: break-all; font-size: 28rem">{{ item.openExpect }}</div>
          <div style="width: 70%;gap: 4rem;" class="share-point">
            <template v-for="into in item.openCode.split(',')">
              <img class="point-img" :src="'/static/img/game/animal/' + into + '.png'" />
            </template>
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