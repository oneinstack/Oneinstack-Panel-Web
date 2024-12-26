<template>
  <x-page :header-bg-color="stheme.theme.blue.headerBgColor()">
    <template #title>
      {{ $t('task.taskDetail') }}
    </template>
    <div class="content-box">
      <div class="content">
        <div class="top-name">
          <text class="title">{{ $t('point.introduction') }}</text>
          <text class="Deposit" v-if="conf.deposit">({{ $t('task.DEposit') }}:{{ conf.deposit }})</text>
        </div>
        <div v-html="conf.activityContent"></div>
        <div class="join" v-if="!conf.hasReceive">
          <div class="btn" @click="conf.handleReceive">{{ $t('otcOrderDetailsModule.Receive') }}</div>
        </div>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import stheme from '@/sstore/stheme'
import { index } from './taskDetail'

const conf = index()
</script>

<style lang="less" scoped>
.content-box {
  padding: 32rem 24rem 32rem;

  .content {
    padding: 32rem;
    background: #fff;
    border-radius: 16rem;
    min-height: 80vh;

    .top-name {
      font-weight: bold;
      margin-bottom: 20rem;

      .title {
        color: rgb(37, 37, 41);
        font-size: 40rem;
      }

      .Deposit {
        background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        font-size: 34rem;
        margin-left: 10rem;
      }
    }

    .join {
      display: flex;
      justify-content: center;
      margin-top: 48rem;

      .btn {
        padding: 14rem 30rem;
        background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
        border-radius: 56rem;
        font-size: 36rem;
        color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        width: auto;
      }
    }
  }
}
</style>
