<template>
  <div class="grid-block">
    <div v-for="(block, index) in data" :key="index">
      <div
        v-if="block"
        class="item default"
        :style="{
          background: `linear-gradient(180deg, ${block.color}25 0%, #FFFFFF 67.16%, #FFFFFF 100%)`
        }"
        @click="conf.clickItem(block)"
      >
        <div class="left-img">
          <img :src="block.img" mode="" />
        </div>
        <div class="right-ctx" :style="{ color: block.color }">
          <div class="title">{{ $t(block.title) }}</div>
          <div class="desc van-multi-ellipsis--l2">{{ $t(block.desc) }}</div>
          <div class="btn" :class="[block.wait ? 'wait' : '']" :style="{ background: block.color }">
            {{ block.wait ? $t('promotions.comeSoon') : $t('promotions.joinNow') }}
          </div>
        </div>
      </div>

      <div v-else class="item coming-soon">
        <img src="/static/img/promotions/comingSoon.png" mode="" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
defineProps<{
  data: any[]
}>()
const emit = defineEmits(['item-click'])
const conf = reactive({
  clickItem(block: any) {
    if (block.wait) return
    emit('item-click', block)
  }
})
</script>

<style lang="less" scoped>
.grid-block {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rem;

  .item {
    width: 336rem;
    height: 148rem;
    border-radius: 20rem;
  }

  @media screen and (min-width: 500px) {
    .item {
      width: auto;
    }
  }

  .default {
    padding: 12rem 0 16rem 18rem;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left-img {
      width: 112rem;
      min-width: 112rem;
      height: 126rem;
      position: relative;
      margin-right: 18rem;

      img {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        bottom: 24rem;
      }
    }

    .right-ctx {
      .title {
        width: 100%;
        font-size: 28rem;
        font-weight: 600;
      }

      .desc {
        padding-right: 24rem;
        font-size: 16rem;
      }

      .btn {
        width: 112rem;
        height: 32rem;
        font-size: 16rem;
        color: #ffffff;
        border-radius: 36rem;
        margin-top: 20rem;
        text-align: center;
        line-height: 32rem;
        &.wait {
          background: #bfbfbf !important;
          color: #666 !important;
        }
      }
    }
  }

  .coming-soon {
    background: linear-gradient(180.45deg, #e2ecff 0.39%, #ffffff 66.98%, #ffffff 99.61%);

    img {
      display: block;
      margin: 0 auto;
      width: 220rem;
      height: 142rem;
    }
  }
}
</style>
