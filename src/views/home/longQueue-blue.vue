<script setup lang="ts">
import betPopup from '../game/components/betPopup-blue.vue'
import { stheme } from '@/sstore/stheme'
import { index } from './ts/longQueue'
const conf = index()
</script>

<template>
    <x-page :showBack="false" tabbar class="longQueue-page-box column" :headerBgColor="stheme.theme.blue.headerBgColor()">
      <template #title>
        <div class="row items-center">
          <div>{{ $t('LongQueue.title') }}</div>
          <img @click="conf.toPage('/home/long/detail')" class="rule-icon" src="/static/img/luckybox/rule.png" />
        </div>
      </template>
      <template #right>
        <div class="row justify-end" style="width: 100rem">
          <img class="list-icon" src="/static/img/icons/order.png" @click="conf.toPage('/user/myBet/index')" />
        </div>
      </template>
  
      <!-- 列表 -->
      <div class="flex items-center relative" style="margin: 0rem 32rem">
        <template v-for="item in conf.list">
          <div class="list-item column items-center no-wrap relative">
            <div style="height: 44rem"></div>
            <div class="relative row items-center" style="height: 108rem; width: 100%; font-size: 20rem">
              <!-- 彩种图标 -->
              <img class="logo-img" :src="'/static/img/long/' + item.lotteryTypeCode + '.png'" />
              <!-- 有效信息 -->
              <div class="col column" style="font-weight: 500">
                <div style="font-size: 32rem; font-weight: 600">{{ item.lotteryName }}</div>
                <div class="row no-wrap">
                  <div style="color: #999999">{{ item.betExpect }}</div>
                  <div style="color: #006fff; margin-left: 20rem">
                    {{
                      item.countDown[3] > 0 ? `${item.countDown[0]}:${item.countDown[1]}:${item.countDown[2]}` : 'Drawing'
                    }}
                  </div>
                </div>
                <div class="row text-1 items-center">
                  <div class="border-4" style="background: #d9d9d9">
                    <div style="margin: 0 8rem">{{ item.playName }}</div>
                  </div>
                  <div class="border-4" :class="[`${item.betConent}`]">
                    <div style="margin: 0 8rem">{{ item.betConent }}</div>
                  </div>
                  <div class="border-4" style="background: linear-gradient(180deg, #006fff 0%, #E6F2FF 160%)">
                    <div style="margin: 0 8rem">{{ $t('LongQueue.Issue') }} {{ item.longCount }}</div>
                  </div>
                </div>
              </div>
              <!-- 下注按钮 -->
              <div class="row flex-center no-wrap" style="width: 280rem">
                <div
                  v-for="btn in item.oddsArray"
                  class="column items-center relative no-wrap"
                  :class="[
                    item.oddsArray.length > 2 ? 'choose-item-color' : 'choose-item',
                    btn.id === conf.bet.item.id ? 'active' : ''
                  ]"
                  @click="conf.bet.choose(btn)"
                  :style="{ pointerEvents: item.needStop ? 'none' : 'all' }"
                >
                  <div><img class="img" :src="'/static/img/long/' + btn.betConent + '.png'" /></div>
                  <div class="text">{{ btn.odds }}</div>
                  <div v-if="item.needStop" class="absolute fit" style="background-color: #eee; opacity: 0.7"></div>
                </div>
              </div>
              <div style="width: 12rem"></div>
            </div>
            <div style="height: 44rem"></div>
          </div>
        </template>
      </div>
  
      <bet-popup :showShare="false" :betShow="conf.bet.show" @submit="conf.bet.submit">
        <img
          v-if="conf.bet.item.betConent"
          style="width: 124rem; height: 124rem"
          :src="'/static/img/long/' + conf.bet.item.betConent + '.png'"
        />
      </bet-popup>
    </x-page>
  </template>
  
  <style lang="less" scoped>
  .rule-icon {
    width: 20rem;
    height: 20rem;
    margin-left: 10rem;
  }
  
  .list-icon {
    width: 40rem;
    height: 40rem;
    margin-right: 28rem;
  }
  
  .longQueue-page-box {
    height: 100vh;
    background: #f5f5fa;
  
    .list-item {
      margin-top: 20rem;
      border-radius: 10rem;
      box-shadow: 0rem 0rem 14rem 0rem #a8a8a8;
      background: #fff;
      width: 100%;
  
      .big {
        background: linear-gradient(180deg, #cf0001 0%, #ee4343 160%);
      }
  
      .small {
        background: linear-gradient(180deg, #00c4fe 0%, #59cbff 160%);
      }
  
      .even {
        background: linear-gradient(180deg, #72d614 0%, #92df03 160%);
      }
  
      .odd {
        background: linear-gradient(180deg, #f80760 0%, #ff8293 160%);
      }
  
      .red {
        background: linear-gradient(180deg, #f80760 0%, #ff8293 160%);
      }
  
      .green {
        background: linear-gradient(180deg, #12c52e 0%, #45e858 160%);
      }
  
      .violet {
        background: linear-gradient(180deg, #8c4ee8 0%, #621ec9 160%);
      }
    }
  
    .logo-img {
      width: 108rem;
      height: 108rem;
      margin: 0 20rem;
    }
  
    .text-1 {
      color: #ffffff;
      gap: 8rem;
      margin-top: 8rem;
    }
  
    .active {
      background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
  
      .text {
        color: #ffffff;
      }
    }
  
    .choose-item {
      width: 108rem;
      height: 108rem;
      margin: 0 6rem;
      color: #c0c0c0;
      border: 1rem solid #d6d6d6;
      border-radius: 8rem;
  
      .img {
        width: 64rem;
        height: 64rem;
        margin-top: 7rem;
      }
    }
  
    .choose-item-color {
      width: 84rem;
      height: 84rem;
      margin: 0 4rem;
      color: #c0c0c0;
      border: 1rem solid #d6d6d6;
      border-radius: 8rem;
  
      .img {
        width: 46rem;
        height: 46rem;
        margin-top: 4rem;
      }
    }
  }
  
  .border-4 {
    border-radius: 4rem;
  }
  </style>
  