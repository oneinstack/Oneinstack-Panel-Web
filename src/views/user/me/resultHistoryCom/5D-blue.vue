<template>
  <!-- content -->
  <div class="result-title">
    <div style="width: 30%">{{ $t('game.drawID') }}</div>
    <div style="width: 37%">{{ $t('game.result') }}</div>
    <div style="width: 11%">{{ $t('game.sum') }}</div>
    <div style="width: 11%">{{ $t('winGo.BS') }}</div>
    <div style="width: 11%">{{ $t('pk10.OE') }}</div>
  </div>
  <div class="result-list">
    <template v-for="(item, index) in conf.resultList" :key="index">
      <div class="result-ltem" v-if="item.openCode">
        <div style="width: 30%; word-break: break-all; font-size: 28rem">{{ item.openExpect }}</div>
        <div style="width: 37%" class="share-point">
          <template v-for="(into, intoIndex) in item.openCode.split(',')">
            <div class="sum">
              <img class="sum-img" src="/static/img/poinits.webp" />
              <div class="sum-num">{{ into || '-' }}</div>
            </div>
          </template>
        </div>
        <div style="width: 11%; display: flex; justify-content: center">
          <div class="sum">
            <img class="sum-img" src="/static/img/poinits.webp" />
            <div class="sum-num">{{ conf.getTotal(item.openCode) }}</div>
          </div>
        </div>
        <div style="width: 11%; display: flex; justify-content: center">
          <div v-if="conf.getTotal(item.openCode) > 22" class="big-view">B</div>
          <div v-else class="small-view">S</div>
        </div>
        <div style="width: 11%; display: flex; justify-content: center">
          <div v-if="conf.getTotal(item.openCode) % 2 != 0" class="odd-view">O</div>
          <div v-else class="even-view">E</div>
        </div>
      </div>
      <div class="result-ltem" v-else>
        <div style="width: 31%; word-break: break-all; font-size: 28rem">{{ item.openExpect }}</div>
        <div style="width: 30%" class="share-point">
          <img class="point-img" src="/static/img/share-0.webp" />
          <img class="point-img" src="/static/img/share-0.webp" />
          <img class="point-img" src="/static/img/share-0.webp" />
        </div>
        <div style="width: 14%; display: flex; justify-content: center">
          <div class="sum">
            <img class="sum-img" src="/static/img/poinits.webp" />
            <div class="sum-num">?</div>
          </div>
        </div>
        <div style="width: 14%; display: flex; justify-content: center">
          <div class="img" style="text-align: center">-</div>
        </div>
        <div style="width: 15%; display: flex; justify-content: center">
          <div class="img" style="text-align: center">-</div>
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