<template>
  <x-page :fixed="false" :bgcolor="'#fff'" :header-bg-color="stheme.theme.blue.headerBgColor()">
    <template #title>
      {{ conf.title }}
    </template>
    <template #top>
      <div class="head-type relative">
        <div class="type-list" v-scroll>
          <template v-for="(item, index) in conf.tabs.list" :key="index">
            <div
              class="type-item"
              @click="conf.tabs.change(item)"
              :class="{ 'type-active': conf.tabs.active == item.gamePlatformCode }"
            >
              <img
                mode="heightFix"
                :class="index == 0 ? 'type-img1' : 'type-img'"
                :src="`/static/img/centerWallet/${item.gamePlatformCode}.png`"
              />
              <div class="type-name">{{ item.gamePlatformCode }}</div>
            </div>
          </template>
        </div>
      </div>
    </template>
    <x-no-data v-if="!conf.loading && conf.list.length === 0" theme="no-method" />
    <div v-else class="content column" style="gap: 20rem">
      <div class="sign-box">
        <div class="time-list">
          <div
            class="time-item"
            v-for="(item, itemIndex) in conf.list"
            :key="itemIndex"
            @click="conf.handleClickGameTip(item)"
          >
            <div class="nav-img">
              <x-load-img :src="item.imgUrl"></x-load-img>
            </div>
            <div class="nav-name">
              <div class="left-name">{{ item.gameEnglishName || item.gameName }}</div>
              <div class="right-name">{{ item.platformName }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 进入游戏提示弹框 -->
    <DGameTip ref="DGameTipRef" />
  </x-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DGameTip from '@/views/home/theme/blue/home-com/DGameTip.vue'
import { index } from './index'
import stheme from '@/sstore/stheme';

const DGameTipRef = ref<any>(null)

const conf = index(DGameTipRef)
</script>

<style scoped lang="less">
.scroll-x {
  width: 100%;
}
.head-type {
  padding: 32rem 20rem 20rem;
  height: 180rem;
}
.type-list {
  display: flex;
  position: absolute;
  width: 710rem;
  height: 100%;
  overflow-x: auto;
  .type-item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    margin-right: 15rem;
    border: 0.5px solid #E2E6EC;
    box-shadow: 0px 2px 6px 0px #0000001A;
    background: #fff;
    padding: 5rem 0rem 10rem;
    border-radius: 10rem;
    width: 108rem;
    height: 128rem;
    flex-shrink: 0;
    font-size: 28rem;
    box-sizing: border-box;
    .type-img1 {
      height: 50rem;
      padding-top: 10rem;
      flex-shrink: 0;
    }
    .type-img {
      height: 60rem;
      flex-shrink: 0;
    }
    &.type-active {
      background: linear-gradient(112.71deg, #2974ED 4.28%, #0645D9 67.56%);
      color: #fff;
    }
  }
}
.sign-box {
  padding: 0 20rem 0rem 20rem;
  background: #ffffff;

  .time-list {
    display: flex;
    flex-wrap: wrap;
    .time-item {
      margin: 0rem 2%;
      border-radius: 10rem;
      width: 46%;
      height: 290rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rem;
      color: #c6924d;
      box-shadow: 4rem 4rem 8rem #00000010;
      overflow: hidden;
      .nav-img {
        width: 327rem;
        height: 220rem;
        border-radius: 10rem 10rem 0rem 0rem;
      }
      .nav-name {
        width: 334rem;
        height: calc(290rem - 220rem);
        line-height: calc(290rem - 220rem);
        justify-content: space-between;
        display: flex;
        .left-name {
          font-weight: 600;
          color: #000000;
          font-size: 24rem;
          padding-left: 20rem;
        }
        .right-name {
          font-weight: 500;
          color: #00000050;
          font-size: 20rem;
          padding-right: 20rem;
        }
      }
    }
  }
}

.content {
  width: 100%;
}
</style>
