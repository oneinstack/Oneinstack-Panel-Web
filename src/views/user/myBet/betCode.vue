<template>
  <div class="row items-center betCode">
    <!-- 3D -->
    <div class="3D row relative flex-center" v-if="item.lotteryTypeCode == '3D'">
      <div v-if="item.betItem.type === 'sum'">
        <div v-if="item.betItem.isNumber" class="row relative flex-center">
          <img class="img-size" style="margin: 0 2rem" src="/static/img/poinits.webp" />
          <div class="absolute" style="font-size: 24rem; color: #2c2e36; font-weight: 900">
            {{ item.betItem.lastVal }}
          </div>
        </div>
        <img v-else class="img-size" style="margin: 0 6rem" :src="item.betItem.img" />
      </div>
      <div v-else-if="item.betItem.type === 'single'">
        <img class="img-size" style="margin: 0 6rem" :src="item.betItem.img" />
      </div>
      <div v-else-if="item.betItem.type === 'double'">
        <img class="img-size" style="margin: 0 6rem" :src="item.betItem.img" />
        <img class="img-size" style="margin: 0 6rem" :src="item.betItem.img" />
      </div>
      <div v-else-if="item.betItem.type === 'leopard'">
        <img class="img-size" style="margin: 0 6rem" :src="item.betItem.img" />
        <img class="img-size" style="margin: 0 6rem" :src="item.betItem.img" />
        <img class="img-size" style="margin: 0 6rem" :src="item.betItem.img" />
      </div>

      <div v-else>
        <div class="row relative flex-center p-val">
          {{ item.betItem.lastVal }}
        </div>
      </div>
    </div>

    <!-- COLOR -->
    <div class="COLOR row relative flex-center" v-else-if="item.lotteryTypeCode == 'COLOR'">
      <div v-if="item.betItem.isNumber" class="row relative flex-center">
        <img class="img-size" style="margin: 0 6rem" :src="item.betItem.img" />
        <div class="absolute" style="color: #fff; font-size: 24rem">{{ item.betItem.value[1] }}</div>
      </div>
      <div v-else>
        <div
          class="row relative flex-center p-val"
          :style="{
            background: item.betItem.color
          }"
        >
          {{ item.betItem.lastVal }}
        </div>
      </div>
    </div>

    <!-- Trx_Win_Go -->
    <div class="Trx_Win_Go row relative flex-center" v-else-if="item.lotteryTypeCode == 'Trx_Win_Go'">
      <div v-if="item.betItem.isNumber" class="row relative flex-center">
        <img class="img-size" style="margin: 0 6rem" :src="item.betItem.img" />
        <div
          class="absolute"
          style="font-size: 24rem"
          :style="{
            color: item.betItem.color,
            '--color-w1': Array.isArray(item.betItem.color) ? item.betItem.color[0] : '',
            '--color-w2': Array.isArray(item.betItem.color) ? item.betItem.color[1] : ''
          }"
          :class="[Array.isArray(item.betItem.color) ? 'text-clip-w' : '']"
        >
          {{ item.betItem.value[1] }}
        </div>
      </div>
      <div v-else>
        <div
          class="row relative flex-center text-clip p-val"
          :style="{
            '--color-c1': item.betItem.color[0],
            '--color-c2': item.betItem.color[1]
          }"
        >
          {{ item.betItem.lastVal }}
        </div>
      </div>
    </div>

    <!-- 5D -->
    <div class="5D row relative items-center" v-else-if="item.lotteryTypeCode == '5D'">
      <div
        v-if="onlyLast == false"
        class="row relative flex-center text-clip p-val"
        :style="{
          '--color-c1': '#f6843f',
          '--color-c2': '#fea14d'
        }"
      >
        {{ item.betItem.value[item.betItem.value.length > 2 ? 1 : 0] }}
      </div>
      <div v-if="item.betItem.isNumber" class="row relative flex-center" style="margin-left: 10rem">
        <img class="img-size" style="margin: 0 2rem" src="/static/img/poinits.webp" />
        <div class="absolute" style="font-size: 24rem; color: #2c2e36; font-weight: 900">
          {{ item.betItem.lastVal }}
        </div>
      </div>
      <div v-else>
        <div
          class="row relative flex-center text-clip p-val"
          :style="{
            '--color-c1': item.betItem.color[0],
            '--color-c2': item.betItem.color[1]
          }"
        >
          {{ item.betItem.lastVal }}
        </div>
      </div>
    </div>

    <!-- PK10 -->
    <div class="PK10 row relative items-center" v-else-if="item.lotteryTypeCode == 'PK10'">
      <div class="type" v-if="onlyLast == false">{{ item.betItem.value[0] }}</div>
      <img v-if="item.betItem.isNumber" class="img-size" style="margin: 0 6rem" :src="item.betItem.img" />
      <div v-else>
        <div
          class="row relative flex-center text-clip p-val"
          :style="{
            '--color-c1': item.betItem.color[0],
            '--color-c2': item.betItem.color[1]
          }"
        >
          {{ item.betItem.lastVal }}
        </div>
      </div>
    </div>

    <!-- SATTA_KING（不需要） -->

    <!-- AnimalsRunning -->
    <div class="PK10 row relative items-center" v-else-if="item.lotteryTypeCode == 'ANIMALS_RUNNING'">
      <div class="type" v-if="onlyLast == false">{{ item.betItem.value[0] }}</div>
      <img v-if="item.betItem.img" class="img-size" style="margin: 0 6rem" :src="item.betItem.img" />
    </div>

    <!-- 3DLottery -->
    <div class="PK10 row relative items-center" v-else-if="item.lotteryTypeCode == '3D_LOTTERY'">
      <div class="type" v-if="onlyLast == false">{{ item.betItem.lastVal.type || item.betItem.lastVal }}</div>
      <div style="display: flex;flex-wrap: wrap;">
        <template v-for="(url,i) in item.betCodeArr" :key="i" >
          <div class="txt-box" :style="{'margin-left': i == 0 ? '10rem' : 0}" v-if="item.betCodes.split('_')[0] == 'triple'">
            <div class="txt" :class="{ 'small': url.length > 17 }"><span v-if="i != 0">,</span>{{ url }}</div>
          </div>
          <img class="img-size" style="margin-left: 6rem;" v-else :src="`/static/img/game/3d/d${url}.png`" />
        </template>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
defineProps({
  item: {
    default: {} as any
  },
  onlyLast: {
    default: false
  }
})
</script>
<style lang="less" scoped>
.betCode {
  .img-size {
    width: 42rem;
    height: 42rem;
  }
  .text-clip {
    background: linear-gradient(90deg, var(--color-c1) 0%, var(--color-c2) 100%);
    box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
  }

  .text-clip-w {
    background: linear-gradient(143deg, var(--color-w1) 51.71%, var(--color-w2) 51.72%) !important;
    background-clip: text !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
  }

  .type {
    color: #5bcdff;
    font-size: 26rem;
    font-weight: 700;
    margin-right: 4rem;
  }

  .p-val {
    height: 40rem;
    border-radius: 6rem;
    color: #fff;
    padding: 0 12rem;
    margin-left: 10rem;
  }
}
</style>
