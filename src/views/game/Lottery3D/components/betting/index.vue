<template>
  <div v-if="conf.level1.item.sizeList">
    <betcontent :list="conf.level1.item.sizeList" :title="$t('game.sumType')" :oddsInfo="conf.oddsInfo"></betcontent>
  </div>
  <div v-if="conf.level1.item.numList">
    <betcontent :list="conf.level1.item.numList" title="point" :oddsInfo="conf.oddsInfo" :isSize="false"></betcontent>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import betcontent from './betcontent.vue'
import { Scope } from 'tools-vue3';
import { WelfareConfInter } from '../../Lottery3D'
const mconf = Scope.getConf<WelfareConfInter>()
const conf = mconf.conf.betting.tabs
onMounted(() => {
  console.log('558');
  console.log(conf);


})
</script>
<style lang="less" scoped>

</style>
