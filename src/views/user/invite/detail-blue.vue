<template>
  <x-page noFooter :topfill="false" :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>
      <div class="title" :class="{ small: conf.title.length > 20 }">{{ conf.title }}</div>
    </template>

    <template #right>
      <selectPopup
        v-if="conf.queryParams.type !== 0"
        v-model:open="conf.open"
        :options="conf.options"
        :currentSelected="conf.currentSelected"
        @select="conf.hanldeSelect"
      />
    </template>
    <div class="container column">
      <x-statusbar header />
      <div class="content col" @click="conf.open = false">
        <div v-for="item in conf.list">
          <detailCard :data="conf.transformData(item, conf.queryParams.type)" style="margin: 20rem 0" />
        </div>
        <div v-if="!conf.list.length && !conf.loading" class="flex flex-center fit">
          <x-no-data theme="no-method" />
        </div>
      </div>
    </div>
  </x-page>
</template>

<script lang="ts" setup>
import detailCard from './theme/blue/components/detail-card.vue'
import selectPopup from './theme/blue/components/select-popup.vue'
import { index } from './detail'
import stheme from '@/sstore/stheme'

const conf = index()
</script>

<style scoped lang="less">
.container {
  height: 100%;
  position: relative;
  padding: 0 30rem;
  .head {
    height: 100rem;
  }
  .content {
    overflow: auto;
  }
}
.title {
  font-family: PingFang SC;
  font-size: 32rem;
  font-weight: 600;
  line-height: 44.8rem;
  text-align: center;

  &.small {
    font-size: 28rem;
  }
}
</style>
