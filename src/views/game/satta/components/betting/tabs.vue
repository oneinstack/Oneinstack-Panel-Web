<template>
  <div style="position: relative;">
    <div class="row items-center no-wrap level1-box" v-scroll>
      <div class="type-item flex justify-center items-start relative text-no-wrap" v-for="item in conf.list"
        :class="{ active: item.name === conf.item.name }" @click="conf.change(item)">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Scope } from 'tools-vue3'
import { WelfareConfInter } from '../../satta'
const mconf = Scope.getConf<WelfareConfInter>()
const conf = mconf.conf.betting.tabs
</script>
<style lang="less" scoped>
.level1-box {
  margin-top: 24rem;
  gap: 20rem;

  .type-item {
    height: 40rem;
    min-width: max-content;
    color: #999999;

    flex-shrink: 0;
    border-radius: 8rem;
    overflow: hidden;
    font-size: 24rem;
    line-height: 28rem;

    &.active {
      color: #333333;
    }

    &.active::before {
      content: '';
      position: absolute;
      bottom: 0;
      margin: 0 auto;
      width: 50%;
      height: 5rem;
      border-radius: 24rem;
      background: linear-gradient(180deg, #eb602d 0%, #ffa64f 100%);
    }
  }
}
.arrow-img{
  height: 12rem;
  position: absolute;
  top: 18%;
  right: -18rem;
}
</style>
