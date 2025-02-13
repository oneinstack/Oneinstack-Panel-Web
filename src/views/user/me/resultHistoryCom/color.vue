<template>
  <!-- content -->
  <div class="result-title">
    <div>{{ $t('game.drawID') }}</div>
    <div>{{ $t('game.number') }}</div>
  </div>
  <div class="result-list">
    <template v-for="(item, index) in conf.resultList" :key="index">
        <div class="result-ltem">
          <div class="issue">{{ item.openExpect }}</div>
          <div class="number">
            <template v-for="(it, num) in 10" :key="num">
              <div class="num-img" v-if="num == item.openCode">
                <img v-if="item.openCode == 0" class="img" src="/static/img/color2.webp" />
                <img
                  v-if="item.openCode == 2 || item.openCode == 4 || item.openCode == 6 || item.openCode == 8"
                  class="img"
                  src="/static/img/color-red.webp"
                />
                <img v-if="item.openCode == 5" class="img" src="/static/img/color1.webp" />
                <img
                  v-if="item.openCode == 1 || item.openCode == 3 || item.openCode == 7 || item.openCode == 9"
                  class="img"
                  src="/static/img/color-green.webp"
                />
                <div class="num">{{ item.openCode }}</div>
              </div>
              <div class="number-item" v-else>
                <span>{{ num }}</span>
              </div>
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
@import '@/styles/resultHistory.less';
</style>