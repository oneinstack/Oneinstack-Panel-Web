<template>
  <div class="flex relative" style="gap: 14rem; padding: 32rem">
    <template v-for="item in conf.list">
      <div class="play-item column flex-center" :class="{ active: item.isActive }" @click="conf.change(item)">
        <resultBall :num="item.num" :size="72" :active="item.isActive" />
        <div class="odds">9.5</div>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { reactive } from 'vue'
import resultBall from '../resultBall.vue'
const conf = reactive({
  list: [] as any[],
  change(item: any) {
    item.isActive = !item.isActive
  }
})

for (let i = 1; i <= 31; i++) {
  conf.list.push({
    num: i,
    isActive: false
  })
}
</script>
<style lang="less" scoped>
.play-item {
  width: 102rem;
  height: 134rem;
  background: #ffffff;
  border-radius: 10rem;
  box-shadow: 0 8rem 4rem 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 2rem solid #ffffff00;

  &.active {
    border: 2rem solid #ff7502;
    background: #fff2e9;
  }

  .odds {
    color: #666666;
    font-size: 24rem;
    font-weight: 400;
    margin-top: 6rem;
  }
}
</style>
