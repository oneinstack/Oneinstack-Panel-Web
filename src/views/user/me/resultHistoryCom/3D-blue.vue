<template>
    <!-- content -->
    <div class="result-title">
        <div style="width: 31%; padding-right: 20rem">{{ $t('game.drawID') }}</div>
        <div style="width: 30%">{{ $t('game.result') }}</div>
        <div style="width: 12%">{{ $t('game.sum') }}</div>
        <div style="width: 12%">{{ $t('game.value') }}</div>
        <div style="width: 15%">{{ $t('game.number') }}</div>
    </div>
    <div class="result-list">
        <template v-for="(item, index) in conf.resultList" :key="index">
            <div class="result-ltem" v-if="item.openCode">
                <div style="width: 31%; word-break: break-all; font-size: 28rem">{{ item.openExpect }}</div>
                <div style="width: 30%" class="share-point">
                <img class="point-img" :src="'static/img/share-' + conf.getNum(item, 0) + '.webp'" />
                <img class="point-img" :src="'static/img/share-' + conf.getNum(item, 1) + '.webp'" />
                <img class="point-img" :src="'static/img/share-' + conf.getNum(item, 2) + '.webp'" />
                </div>
                <div style="width: 12%; display: flex; justify-content: center">
                <div class="sum">
                    <img class="sum-img" src="/static/img/poinits.webp" />
                    <div class="sum-num">{{ conf.getTotal(item.openCode) }}</div>
                </div>
                </div>
                <div style="width: 12%; display: flex; justify-content: center">
                <img class="img" src="/static/img/small.webp" v-if="conf.getValue(item) == 1" />
                <img class="img" src="/static/img/big.webp" v-if="conf.getValue(item) == 2" />
                <div class="img" style="text-align: center" v-if="conf.getValue(item) == 0">-</div>
                </div>
                <div style="width: 15%; display: flex; justify-content: center">
                <img class="img" src="/static/img/odd.webp" v-if="conf.getNumber(item) == 2" />
                <img class="img" src="/static/img/even.webp" v-if="conf.getNumber(item) == 1" />
                <div class="img" style="text-align: center" v-if="conf.getNumber(item) == 0">-</div>
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