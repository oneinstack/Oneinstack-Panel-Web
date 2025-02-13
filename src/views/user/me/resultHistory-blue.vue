<template>
  <x-page :fixed="false" :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>
      {{ $t('me.History') }}
    </template>
    <template #top>
      <div class="tabs-comtent">
        <div class="tabs-type">
          <div style="width: 720rem; overflow: auto" ref="typeRefs" v-if="conf.lotteryList.length > 0" v-scroll>
            <div class="type-list">
              <template v-for="(item, index) in conf.lotteryList" :key="index">
                <div
                  class="type-item"
                  :class="{ 'type-active': item.lotteryTypeVO.lotteryTypeCode == conf.typeIndex }"
                  @click="conf.handleChangeTab(item, index)"
                  v-if="item.lotteryVOList.length > 0"
                >
                  {{ item.lotteryTypeVO.lotteryTypeName }}
                </div>
              </template>
            </div>
          </div>
        </div>
        <div>
          <div style="width: 720rem; overflow: auto" v-if="conf.timesList.length > 0" v-scroll>
            <div class="tabs-times">
              <template v-for="(item, index) in conf.timesList" :key="index">
                <div
                  class="time-item"
                  :class="{ 'time-active': index == conf.timeIndex }"
                  @click="conf.handleChangeTime(item, index)"
                >
                  {{ item.newName || item.lotteryShowname }}
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
    <!-- content -->
    <div style="width: 100%">
      <div scroll-y style="width: 100%; height: 100%">
        <div class="result">
          <threeD v-if="conf.typeIndex == '3D'"></threeD>
          <winGo v-if="conf.typeIndex == 'Trx_Win_Go'"></winGo>
          <pk10  v-if="conf.typeIndex == 'PK10'"></pk10>
          <fiveD v-if="conf.typeIndex == '5D'"></fiveD>
          <color v-if="conf.typeIndex == 'COLOR'"></color>
          <satta v-if="conf.typeIndex == 'SATTA_KING'"></satta>
          <lottery3D v-if="conf.typeIndex == '3D_LOTTERY'"></lottery3D>
          <markSix v-if="conf.typeIndex == 'MARK_SIX'"></markSix>
          <animalsRunning v-if="conf.typeIndex == 'ANIMALS_RUNNING'"></animalsRunning>
          
          <div v-if="conf.resultList.length > 0">
            <div class="more" v-if="conf.isTips == false">
              <div class="more-btn" @click="conf.moreMessage">
                <span>{{ $t('game.showMore') }}</span>
                <img src="/static/img/show-more.png" style="width: 20rem; height: 12rem" />
              </div>
            </div>
            <div class="more-not" v-else>
              <span>{{ $t('user.noMore') }}</span>
            </div>
          </div>
          <x-no-data v-if="conf.resultList.length == 0" />
        </div>
      </div>
    </div>
  </x-page>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { index } from './resultHistory'
import threeD from './resultHistoryCom/3D-blue.vue'
import winGo from './resultHistoryCom/winGo-blue.vue'
import pk10 from './resultHistoryCom/pk10-blue.vue'
import fiveD from './resultHistoryCom/5D-blue.vue'
import color from './resultHistoryCom/color-blue.vue'
import satta from './resultHistoryCom/satta-blue.vue'
import lottery3D from './resultHistoryCom/lottery3D-blue.vue'
import markSix from './resultHistoryCom/markSix-blue.vue'
import animalsRunning from './resultHistoryCom/animalsRunning-blue.vue'
import stheme from '@/sstore/stheme'

const typeRefs = ref<any>()
const conf = index({ typeRefs })
</script>

<style lang="less" scoped>
@import '@/styles/resultHistory-blue.less';
</style>
