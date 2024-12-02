<template>
  <div class="row items-center openCode">
    <div class="row items-center" v-for="el in item.betOpenCodeList">
      <!-- 3D -->
      <img v-if="item.lotteryTypeCode == '3D'" style="width: 42rem; height: 42rem; margin: 0 6rem" :src="el.img" />

      <!-- COLOR -->
      <div class="row relative flex-center" v-else-if="item.lotteryTypeCode == 'COLOR'">
        <img style="width: 42rem; height: 42rem; margin: 0 6rem" :src="el.img" />
        <div class="absolute" style="color: #fff; font-size: 24rem">{{ el.value }}</div>
      </div>

      <!-- Trx_Win_Go -->
      <div class="row relative flex-center" v-else-if="item.lotteryTypeCode == 'Trx_Win_Go'">
        <img style="width: 42rem; height: 42rem; margin: 0 6rem" :src="el.img" />
        <div
          class="absolute"
          style="font-size: 24rem"
          :style="{
            color: el.color,
            '--color-w1': Array.isArray(el.color) ? el.color[0] : '',
            '--color-w2': Array.isArray(el.color) ? el.color[1] : ''
          }"
          :class="[Array.isArray(el.color) ? 'text-clip' : '']"
        >
          {{ el.value }}
        </div>
      </div>

      <!-- 5D -->
      <div class="row relative flex-center" v-else-if="item.lotteryTypeCode == '5D'">
        <img style="width: 42rem; height: 42rem; margin: 0 2rem" src="/static/img/poinits.webp" />
        <div class="absolute" style="font-size: 24rem; color: #2c2e36; font-weight: 900">{{ el.value }}</div>
      </div>

      <!-- PK10 -->
      <img v-if="item.lotteryTypeCode == 'PK10'" style="width: 42rem; height: 42rem; margin: 0 6rem" :src="el.img" />

      <!-- SATTA_KING -->
      <div class="row relative flex-center" v-else-if="item.lotteryTypeCode == 'SATTA_KING'">
        <img style="width: 42rem; height: 42rem; margin: 0 6rem" src="/static/img/color-red.webp" />
        <div class="absolute" style="color: #fff; font-size: 24rem">{{ el.value }}</div>
      </div>
    </div>

    <div v-if="!item.betOpenCodeList.length">--</div>
  </div>
</template>
<script lang="ts" setup>
defineProps({
  item: {
    default: {} as any
  }
})
</script>
<style lang="less" scoped>
.openCode {
  .text-clip {
    background: linear-gradient(143deg, var(--color-w1) 51.71%, var(--color-w2) 51.72%) !important;
    background-clip: text !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
  }
}
</style>
