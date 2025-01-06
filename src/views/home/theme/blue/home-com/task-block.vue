<script setup lang="ts"></script>

<template>
  <div class="task-box">
    <div class="content-view" @click="$emit('click')">
      <img src="/static/theme/blue/home-checkin.webp" class="task-img" />
      <div class="task-txt">
        <div class="txt1">{{ $t('home.taskTitle1') }}</div>
        <div class="txt2">{{ $t('home.taskTitle2') }}</div>
      </div>
      <div class="mask-btn"></div>
    </div>
  </div>
</template>

<style scoped lang="less">
.task-box {
  width: 100%;
  border-radius: 20rem;
  height: auto;

  .content-view {
    position: relative;
    width: 100%;

    .task-img {
      width: 100%;
    }

    .task-txt {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: #fff;
      font-size: 28rem;
      font-weight: bold;
      padding-bottom: 25rem;
      padding-left: 64rem;
      text-shadow: 2.04rem 2.04rem 4.06rem #0647da;

      .txt2 {
        font-size: 22rem;
        padding-left: 20rem;
        padding-bottom: 10rem;
      }
    }
  }
}
</style>
