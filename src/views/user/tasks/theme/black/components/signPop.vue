<template>
  <div class="change-box" v-if="conf.show" @click="conf.closePop">
    <div class="content">
      <div class="title">Tips</div>
      <div style="text-indent: 2em; font-size: 26rem">
        {{ $t('point.fistWord') }}
        <div class="time" style="text-indent: 0em">
          <span v-if="conf.timeArr[0] > 0">{{ conf.timeArr[0] }} {{ $t('point.hours') }}</span>
          {{ conf.timeArr[1] }} {{ $t('point.minutes') }}
        </div>
        {{ $t('point.nextSignTime') }}
        {{ $t('point.againParticipation') }}!
      </div>
      <!-- <div v-else>{{ $t('point.todayNoSign')}}</div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { index } from '@/views/user/tasks/components/signPop'

const conf = index()

// 暴露方法
defineExpose({
  showPop: conf.showPop
})
</script>

<style lang="less" scoped>
.change-box {
  position: fixed;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  max-width: 750rem;
  z-index: 9999;

  .content {
    width: 82%;
    border-radius: 20rem;
    background: #323738;
    padding: 50rem 36rem;
    color: #BFBFBF;

    .title {
      font-size: 36rem;
      color: #fff;
      font-weight: 600;
      margin-bottom: 20rem;
      text-align: center;
    }

    .time {
      background: #1CF187;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      display: inline-block;
    }
  }
}
</style>
