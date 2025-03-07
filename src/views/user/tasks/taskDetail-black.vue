<template>
  <x-page pageType="black">
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
          <greenBtn @click="conf.handleReceive">
            <span style="font-size: 28rem;">{{ $t('otcOrderDetailsModule.Receive') }}</span>
          </greenBtn>
        </div>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'
import { index } from './taskDetail'

const conf = index()
</script>

<style lang="less" scoped>
.content-box {
  padding: 32rem 24rem 32rem;

  .content {
    padding: 32rem;
    background: #323738;
    border-radius: 16rem;
    min-height: 80vh;
    color: #BFBFBF;
    font-size: 24rem;

    .top-name {
      font-weight: bold;
      margin-bottom: 20rem;

      .title {
        color: #fff;
        font-size: 40rem;
      }

      .Deposit {
        color: #1CF187;
        font-size: 34rem;
        margin-left: 10rem;
      }
    }

    .join {
      margin-top: 48rem;
      height: 80rem;
      width: 50%;
      margin-left: 25%;
    }
  }
}
</style>
