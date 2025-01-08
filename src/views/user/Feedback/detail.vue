<script setup lang="ts">
import { index } from './detail'

const conf = index()
</script>

<template>
  <x-page no-footer>
    <template #title>{{ $t('Feedback.detail') }}</template>
    <!-- content -->
    <div class="content-view">
      <div class="top-box">
        <div class="title">
          {{ conf.detailObj.typeName }}
        </div>
        <div class="time">
          {{ conf.detailObj.createTime }}
        </div>
        <div class="content">
          <div class="detail-content">
            {{ conf.detailObj.issueDepict }}
          </div>
          <div class="img-content">
            <template v-for="(item, itemIndex) in conf.imgList">
              <x-img :src="item" class="img-item" :lazyLoad="false"></x-img>
            </template>
          </div>
        </div>
      </div>
      <div class="bottom-box">
        <div class="title">
          {{ $t('Feedback.replyContent') }}
        </div>
        <template v-for="(item,itemIndex) in conf.detailObj.reolyList">
          <div class="reply-item">
            <div class="info">
              {{ item.replyAccount }}
              <span class="time">{{ item.replyTime }}</span>
            </div>
            <div class="content">
              {{ item.replyDepict }}
            </div>
          </div>
        </template>
        <van-field
            v-model="conf.replyContent"
            rows="3"
            autosize
            type="textarea"
            maxlength="500"
            placeholder="Please Enter"
            show-word-limit
        />

        <div class="btn-view">
        <div class="sumit-btn" @click="conf.handleDataSubmit">
          {{ $t('Feedback.submit') }}
        </div>
      </div>
      </div>
    </div>
  </x-page>
</template>

<style scoped lang="less">
.content-view {
  width: 100%;
  padding: 30rem;
  font-family: 'PingFang SC';
  .top-box,.bottom-box  {
    width: 100%;
    height: auto;
    color: #999999;
    background: #fff;
    padding: 30rem;
    border-radius: 20rem;
    margin-bottom: 20rem;
    .title {
      color: #333333;
      font-size: 32rem;
      font-weight: 600;
    }
    .time {
      color: #999999;
      font-size: 24rem;
      font-weight: 400;
    }
    .content {
      margin-top: 20rem;
      width: 100%;
      height: auto;
      color: #999999;
      background: #fff;
      border-radius: 20rem;
      line-height: 34rem;
      .img-content {
        margin-top: 20rem;
        display: flex;
        flex-wrap: wrap;
        .img-item {
          width: 200rem !important;
          height: 200rem !important;
          margin-right: 20rem;
          border-radius: 8rem;
        }
      }
    }

    .reply-item {
      margin-top: 20rem;
      .info {
        font-size: 24rem;
        font-weight: 400;
        color: #333333;
        .time {
          color: #999999;
          margin-left: 20rem;
        }
      }
    }

    .btn-view {
  width: 80%;
  margin-left: 10%;
  margin-top: 80rem;

  .sumit-btn {
    text-align: center;
    width: 100% !important;
    background-color: #f17638;
    color: #fff;
    border-radius: 50rem;
    padding: 20rem;
    font-weight: bold;
    font-size: 36rem;
  }
}
  }
}
:deep(.van-cell){
    padding: 0rem !important;
    border-radius: 10rem !important;
    margin-top: 20rem;
}
:deep(.van-field__value){
  padding: 10rem 20rem !important;
  background: #fffbf5;
}
</style>
