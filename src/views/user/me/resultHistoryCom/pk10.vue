<template>
  <!-- content -->
  <div class="result-title">
    <div style="width: 29%">{{ $t('game.drawID') }}</div>
    <div style="width: 29%">{{ $t('game.result') }}</div>
    <div style="width: 21%">{{ $t('winGo.BS') }}</div>
    <div style="width: 21%">{{ $t('pk10.OE') }}</div>
  </div>
  <div class="result-list">
    <template v-for="(item, index) in conf.resultList">
        <div class="gh-table-item row no-wrap">
          <div style="width: 29%">{{ item.openExpect }}</div>
          <div style="width: 29%; gap: 8rem" class="row flex-center">
            <template v-if="item.openCode.length > 0">
              <div
                v-for="(a, i) in item.openCode.split(',')"
                :key="i"
                :class="['qkball' + a]"
                style="height: 40rem; width: 40rem"
              ></div>
            </template>
            <template v-else>
              <div v-for="v in 3" :key="v" style="height: 40rem; width: 40rem">-</div>
            </template>
          </div>
          <div style="width: 21%; gap: 8rem" class="row flex-center">
            <div
              class="bs-item"
              v-for="(a, i) in item.openCode.split(',')"
              :key="i"
              :class="conf.BSFun(a) == 'B' ? ['num_blue'] : ['num_yellow']"
            >
              <div>{{ conf.BSFun(a) }}</div>
            </div>
          </div>
          <div style="width: 21%; gap: 8rem" class="row flex-center">
            <div
              class="bs-item"
              v-for="(a, i) in item.openCode.split(',')"
              :key="i"
              :class="conf.OEFun(a) == 'O' ? ['num_red'] : ['num_green']"
            >
              <div>{{ conf.OEFun(a) }}</div>
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
@import '@/styles/resultHistory.less';
@import '@/views/game/pk10/pk10.less';
</style>