<template>
  <x-page :show-back="false" tabbar>
    <template #title>
      <span class="title">{{ $t('chatRoom.messages') }}</span>
    </template>
    <template #right>
      <div class="flex flex-center" style="width: 86rem; height: 100%" @click="">
        <van-icon name="add-o" size="22" color="#333333" />
      </div>
    </template>
    <div>
      <div class="search-box flex flex-center">
        <van-icon name="search" size="15" color="#B9B9B9" />
        <span>Search</span>
      </div>
      <van-swipe-cell :before-close="conf.beforeClose" v-for="item in 30">
        <div style="width: 100%; background: #fff; padding: 24rem 26rem">
          <div class="row items-center" style="height: 92rem">
            <div style="width: 92rem; height: 100%; border-radius: 8rem; overflow: hidden; margin-right: 26rem">
              <img style="width: 100%; height: 100%" src="/static/img/home-banner.png" />
            </div>
            <div class="col">
              <div class="row" style="width: 44rem; width: 100%">
                <div class="col" style="font-size: 32rem; color: #333333; font-weight: 500">Luckey box</div>
                <div style="font-size: 24rem; color: #808080">12:30</div>
              </div>
              <div class="row" style="font-size: 28rem; color: #b1b1b1">123124</div>
            </div>
          </div>
        </div>
        <template #right>
          <van-button square type="primary" text="置顶" style="height: 100%; width: 152rem" />
          <van-button square type="danger" text="删除" style="height: 100%; width: 152rem" />
        </template>
      </van-swipe-cell>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { reactive } from 'vue'
const conf = reactive({
  beforeClose: () => {
    console.log('beforeClose')
  }
})
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}

.search-box {
  width: 716rem;
  height: 68rem;
  background-color: #ffffff;
  margin: 0 auto;
  border-radius: 4rem;
  margin-bottom: 20rem;
  span {
    font-size: 32rem;
    color: #b9b9b9;
    margin-left: 16rem;
  }
}
</style>
