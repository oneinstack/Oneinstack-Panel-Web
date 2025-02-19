<template>
  <div class="bet-bottom-box row items-center justify-between" :style="`--color-1: ${bg[0]}; --color-2: ${bg[1]}; --color-3: ${bg[2]}`">
    <div>
      {{ $t('game.TotalBetAmount') }}:
      <span class="gradient-text">{{ betNum }}</span>
    </div>
    <div class="bet-button flex flex-center" :class="{'disabled': disabled}" @click="$emit('confirm')">{{ $t('3d.bet') }}</div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps({
  betNum: {
    default: 0
  },
  disabled: {
    default: false
  },
  bg: {
    default: ['#eb602d','#ffa64f','#fff7e8']
  }
})
</script>
<style lang="less" scoped>
.bet-bottom-box {
  height: 100rem;
  box-shadow: 0rem -8rem 8rem 0rem #00000008;
  background: linear-gradient(180deg, #ffffff 0%, var(--color-3) 100%);
  padding: 0 28rem;
  font-size: 32rem;

  .bet-button {
    width: 192rem;
    height: 72rem;
    background: linear-gradient(180deg, var(--color-1) 0%, var(--color-2) 100%);
    border-radius: 72rem;
    color: #ffffff;
    font-weight: 500;
  }
  .disabled {
    filter: grayscale(1);
  }
}
</style>
