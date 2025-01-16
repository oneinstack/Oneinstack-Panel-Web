<template>
  <div class="bet-bottom-box row items-center justify-between">
    <div>
      {{ $t('game.TotalBetAmount') }}:
      <span style="--color-1: #eb602d; --color-2: #ffa64f" class="gradient-text">3</span>
    </div>
    <div class="bet-button flex flex-center" @click="$emit('confirm')">Bet</div>
  </div>
</template>
<script setup lang="ts">
import { reactive } from 'vue'
const conf = reactive({})
</script>
<style lang="less" scoped>
.bet-bottom-box {
  height: 100rem;
  box-shadow: 0rem -8rem 8rem 0rem #00000008;
  background: linear-gradient(180deg, #ffffff 0%, #fff7e8 100%);
  padding: 0 28rem;
  font-size: 32rem;

  .bet-button {
    width: 192rem;
    height: 72rem;
    background: linear-gradient(180deg, #eb602d 0%, #ffa64f 100%);
    border-radius: 72rem;
    color: #ffffff;
    font-weight: 500;
  }
}
</style>
