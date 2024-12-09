<template>
  <x-page headerBgColor="#fff">
    <template #right>
      <div class="flex flex-center" style="width: 86rem; height: 100%" @click="">
        <van-icon name="ellipsis" size="24" color="#666" />
      </div>
    </template>
    <div class="user-card">
      <div class="user">
        <img class="author" src="/static/img/home-banner.png" />
        <div class="info">
          <div class="nickname">
            <span>Lucky boy</span>
            <img style="width: 26rem; height: 26rem;margin-left: 10rem;" src="/static/img/chat/sex_boy.png" />
          </div>
          <div>MickName: Input filed</div>
          <div>Uid: 1234567</div>
          <div>Area: China</div>
        </div>
      </div>
      <div class="edit">
        <div class="title">Edit Contact</div>
        <van-icon name="arrow" size="18" color="#B8B8B8" />
      </div>
    </div>
    <div class="other">
      <div class="other-item">
        <img style="width: 30rem; height: 30rem;margin-right: 16rem;" src="/static/img/chat/message.svg" />
        <span>Messages</span>
      </div>
      <div class="other-item">
        <img style="width: 34rem; height: 34rem;margin-right: 16rem;" src="/static/img/chat/video.svg" />
        <span>Voice or Video Call</span>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { reactive } from 'vue'
const conf = reactive({

})
</script>
<style lang="less" scoped>
.user-card{
  background: #fff;
  .user{
    display: flex;
    padding: 30rem 24rem 40rem;
    .author{
      width: 96rem;
      height: 96rem;
      border-radius: 4rem;
      margin-top: 9rem;
    }
    .info{
      font-size: 21rem;
      color: #999;
      margin-left: 30rem;
      .nickname{
        font-size: 32rem;
        font-weight: 500;
        color: #000;
        display: flex;
        align-items: center;
        margin-bottom: 6rem;
      }
    }
  }
  .edit{
    padding: 24rem 20rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2rem solid #F6F7FA;
    .title{
      font-size: 28rem;
      font-weight: 500;
      color: #000;
    }
  }
}
.other{
  background: #fff;
  margin-top: 16rem;
  .other-item{
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30rem;
    color: #5B6983;
    font-weight: 500;
    font-size: 28rem;
    &:not(:last-of-type){
      border-bottom: 2rem solid #F6F7FA;
    }
  }
}
</style>
