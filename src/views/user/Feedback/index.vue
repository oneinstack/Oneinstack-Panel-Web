<script setup lang="ts">
import { index } from './index'

const conf = index()
</script>

<template>
  <x-page no-footer>
    <template #title>{{ $t('Feedback.title') }}</template>
    <template #right>
      <van-icon name="add-o" size="32rem" style="margin-right: 30rem;" @click="conf.handlePageInto('add',null)"/>
    </template>
    <!-- 列表 -->
    <div class="content-view" style="overflow: auto" @scroll="conf.moreMessage">
      <div class="cu-list">
        <div class="cu-item" @click="conf.handlePageInto('detail',item)" v-for="(item,index) in conf.listData" :key="index" >
          <div class="cu-item-title">
            <div>
              {{ item.typeName }}
              <van-icon name="arrow" size="20rem" />
            </div>
            <div class="status-view" v-if="item.statu == 0 && item.issieStatus != 2"></div>
            <div v-if="item.issieStatus == 2">
              <x-img src="/static/img/resolved.png" class="img-item" :lazyLoad="false" width="60rem" height="60rem"></x-img>
            </div>
          </div>
          <div class="time">
            {{ item.createTime }}
          </div>
          <div class="cu-item-content">
            <van-text-ellipsis :content="item.issueDepict" rows="3"/>
          </div>
        </div>
        <x-no-data v-if="conf.listData.length == 0"></x-no-data>
      </div>
    </div>
  </x-page>
</template>

<style scoped lang="less">
.content-view {
  width: 100%;
  padding: 30rem;
  .cu-list {
    width: 100%;
    height: 100%;
    color: #999999;


    .cu-item {
      width: 100%;
      padding: 30rem;
      border-radius: 20rem;
      background: #fff;
      max-height: 332rem;
      margin-bottom: 20rem;
      .cu-item-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #333333;
        font-size: 32rem;
        font-weight: 600;
        font-family: 'PingFang SC';

        .status-view{
          width: 12rem;
          height: 12rem;
          background: #FF3333;
          border-radius: 50%;
        }

      }

      .cu-item-content,.time{
          margin-top: 10rem;
        }

    }
  }
}
</style>
