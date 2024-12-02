<script setup lang="ts"></script>

<template>
  <div class="limit-card">
    <div class="head">
      <img class="left-decorate" src="/static/img/luckyWheel/Vector355.png" mode="" />
      <img class="right-decorate" src="/static/img/luckyWheel/Vector356.png" mode="" />
      <img class="emoji" src="/static/img/luckyWheel/emoji.png" mode="" />
    </div>
    <div class="title">{{ $t('luckyWheel.limitTitle') }}</div>
    <div class="desc">
      {{ $t('luckyWheel.limitDesc') }}
    </div>
    <div class="btn" @click="$emit('confirm')">{{ $t('luckyWheel.confirm') }}</div>
  </div>
</template>

<style scoped lang="less">
.limit-card {
  padding: 64rem 40rem 52rem;
  width: 578rem;
  height: 600rem;
  border-radius: 32rem;
  font-family: PingFang SC;
  background-color: #fff;
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;

  .head {
    position: absolute;
    left: 50%;
    top: -12%;
    transform: translateX(-50%);
    width: 148rem;
    height: 148rem;
    background-color: #fff;
    border-radius: 50%;

    .emoji {
      width: 100%;
      height: 100%;
    }

    .left-decorate {
      position: absolute;
      left: -40%;
      width: 50.4rem;
      height: 46.8rem;
    }

    .right-decorate {
      position: absolute;
      right: -40%;
      top: -20%;
      width: 37.8rem;
      height: 36rem;
    }

    &::before,
    &::after {
      content: '';
      position: absolute;
      background-color: #d0d0d0;
    }

    &::before {
      left: -30%;
      bottom: 20%;
      width: 12rem;
      height: 12rem;
      transform: rotate(30deg);
    }

    &::after {
      right: -30%;
      bottom: 22%;
      width: 20rem;
      height: 20rem;
      border-radius: 50%;
    }
  }

  .title {
    font-size: 40rem;
    font-weight: 600;
    line-height: 56rem;
    text-align: center;
    color: #000000;
  }

  .desc {
    font-size: 28rem;
    font-weight: 500;
    line-height: 39.2rem;
    text-align: center;
    color: #999999;
  }

  .btn {
    height: 88rem;
    border-radius: 74rem;
    font-size: 40rem;
    font-weight: 500;
    line-height: 88rem;
    text-align: center;
    color: #fff;
    background: linear-gradient(180deg, #eb602d 0%, #ffa64f 100%);
  }
}
</style>
