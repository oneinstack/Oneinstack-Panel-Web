<template>
  <div class="bet-bottom-box row items-center justify-between">
    <div>
      {{ $t('game.TotalBetAmount') }}:
      <span style="--color-1: #eb602d; --color-2: #ffa64f" class="gradient-text">{{ mconf.conf.betting.totalAmount }}</span>
    </div>
    <div class="bet-button flex flex-center" @click="$emit('confirm')">{{ $t('game.bet') }}</div>
  </div>
</template>
<script setup lang="ts">
import { Scope } from 'tools-vue3'
const mconf = Scope.getConf()
</script>
<style lang="less" scoped>
.bet-bottom-box {
  height: 100rem;
  box-shadow: 0rem -8rem 8rem 0rem #00000008;
  background: linear-gradient(180deg, #FFFFFF 0%, #E8EFFF 100%);
  padding: 0 28rem;
  font-size: 32rem;

  .bet-button {
    width: 192rem;
    height: 72rem;
    background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
    border-radius: 72rem;
    color: #ffffff;
    font-weight: 500;
  }
  .gradient-text{
    background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
    color: transparent;
    background-clip: text;
    -webkit-background-clip: text;
  }
}
</style>
