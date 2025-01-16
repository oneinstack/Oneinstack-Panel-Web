<template>
  <div class="row items-center no-wrap level1-box" v-scroll>
    <div
      class="type-item flex justify-center items-start relative text-no-wrap"
      v-for="item in conf.level1.list"
      :class="{ active: item.label === conf.level1.item.label }"
      @click="conf.level1.change(item)"
    >
      {{ item.label }}
    </div>
  </div>
  <div class="row items-center no-wrap level2-box" v-scroll>
    <div
      class="type-item flex flex-center relative text-no-wrap"
      v-for="item in conf.level2.list"
      :class="{ active: item.label === conf.level2.item.label }"
      @click="conf.level2.change(item)"
    >
      {{ item.label }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { Scope } from 'tools-vue3'
const mconf = Scope.getConf()
const conf = mconf.conf.betting.tabs
</script>
<style lang="less" scoped>
.level1-box {
  margin-top: 20rem;
  gap: 20rem;
  width: 686rem;
  .type-item {
    height: 50rem;
    border-radius: 6rem;
    min-width: max-content;
    color: #999999;

    flex-shrink: 0;
    border-radius: 8rem;
    overflow: hidden;
    font-size: 24rem;

    &.active {
      color: #333333;
    }
    &.active::before {
      content: '';
      position: absolute;
      bottom: 0;
      margin: 0 auto;
      width: 80rem;
      height: 6rem;
      border-radius: 24rem;
      background: linear-gradient(180deg, #eb602d 0%, #ffa64f 100%);
    }
  }
}
.level2-box {
  margin-top: 20rem;
  gap: 20rem;
  width: 686rem;
  .type-item {
    height: 50rem;
    border-radius: 6rem;
    min-width: max-content;
    color: #999999;
    background-color: #fffef8;
    padding: 0 20rem;

    flex-shrink: 0;
    border-radius: 6rem;
    overflow: hidden;
    font-size: 18rem;

    &.active {
      color: #eb602d;
    }
    &.active::before {
      content: '';
      position: absolute;
      bottom: 0;
      right: 0;
      width: 20rem;
      height: 20rem;
      background: url('/static/img/game/marksix/tabs-active.webp') no-repeat center center / 100% 100%;
    }
  }
}
</style>
