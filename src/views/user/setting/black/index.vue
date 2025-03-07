<script setup lang="ts">
import { index } from './index'
const conf = index()
</script>

<template>
  <x-page no-footer pageType="black">
    <template #title>
      {{ 'Setting' }}
    </template>

    <div class="container">
      <div class="menu-list">
          <template v-for="item in conf.menu">
            <div class="menu-item" @click="conf.handleNavigate(item)">
              <div class="item-left">
                <img :src="item.src">
                <span>{{item.name}}</span>
              </div>
              <van-icon name="arrow" class="icon-arrow"/>
            </div>
          </template>
        </div>
    </div>
  </x-page>
</template>

<style scoped lang="less">
.container {
  border-radius: 20rem;
  margin: 24rem;
  .menu-list {
      font-family: PingFang SC;
      background: #323738;
      border-radius: 20rem;
      overflow: hidden;

      .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24rem;
        cursor: pointer;

        .item-left {
          display: flex;
          align-items: center;
          gap: 12rem;

          img {
            width: 32rem;
            height: 32rem;
            display: inline-block;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            margin-right: 6rem;
          }

          span {
            color: #ffffff;
            font-weight: 600;
            font-size: 24rem;
            line-height: 34rem;
            letter-spacing: 0%;
          }
        }

        .icon-arrow {
          width: 44rem;
          height: 44rem;
          color: #ffffff;
          background: #464F50;
          border-radius: 12rem;
          text-align: center;
          line-height: 44rem;
        }
      }
    }
}
</style>
