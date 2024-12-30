<template>
  <div class="no-data" :style="{ 'padding-top':  top + 'rem' }">
    <img
      v-if="noicon === false"
      class="no-data-img"
      :src="conf.theme[theme].src"
      :style="{ height: conf.theme[theme].height + 'rem' }"
    />
    <span>{{ $t('user.noMore') }}</span>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

defineProps({
  /**
   * 是否不显示图标，默认显示
   */
  noicon: {
    default: false
  },
  /**
   * 图标距离顶部距离，默认120
   */
  top: {
    default: 60
  },
  /**
   * 主题no-method、no-data，默认no-data
   */
  theme: {
    default: 'no-method'
  }
})
const conf = reactive({
  theme: {
    'no-method': {
      src: '/static/img/wallet/no-method.png',
      height: 320
    }
  } as any
})
</script>

<style lang="less" scoped>
.no-data {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0rem 0rem 40rem;

  span {
    font-size: 26rem;
    color: #707070;
    margin: 30rem auto;
  }
}
</style>
