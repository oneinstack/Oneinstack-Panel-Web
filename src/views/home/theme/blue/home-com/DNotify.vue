<template>
  <van-overlay class-name="toast-overlay" :show="conf.showPopNotify">
    <div class="cu-modal-x relative">
      <div class="open">
        <div class="popup-mask" @click="conf.close"></div>
        <div class="notify open-image">
          <van-swipe class="swiper" circular previous-margin="80rem" next-margin="80rem" :autoplay="3000">
            <template v-for="(item, index) in conf.notifyList">
              <van-swipe-item class="swiperItem" :key="index" v-if="item.verticalUrl" @click="conf.goContent(item)">
                <img class="notify-img" :src="item.verticalUrl" />
              </van-swipe-item>
            </template>
          </van-swipe>
          <div class="check">
            <van-checkbox
              v-model="conf.isNoPromptPop"
              icon-size="32rem"
              shape="square"
              @change="conf.isNoPromptPop = $event"
            >
              {{ $t('home.NoPrompt') }}
            </van-checkbox>
          </div>
          <div class="action" @click="conf.close">
            <van-icon name="close" color="#fff" size="60rem" />
          </div>
        </div>
      </div>
    </div>
  </van-overlay>
</template>
<script setup lang="ts">
import { index } from '@/views/home/home-com/DNotify'

const conf = index()
</script>
<style lang="less" scoped>
.toast-overlay {
  z-index: 2000;
}

.cu-modal-x {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.popup-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  background: rgba(0, 0, 0, 0.3);
}
.open {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  margin: 0 auto;
}
.notify {
  position: absolute;
  z-index: 9;
  left: 0%;
  right: 40rem;
  height: 60vh;
  // background: #FFF;
  border-radius: 40rem;
  width: 100%;
  // overflow: hidden;
  .swiper {
    height: 100%;
    width: 600rem;
    margin: 0 auto;
  }
  .swiperItem {
    height: 100%;
  }
  .notify-img {
    width: 100%;
    height: 100%;
    border-radius: 40rem;
  }
  .action {
    position: absolute;
    bottom: -160rem;
    left: 0rem;
    right: 0rem;
    text-align: center;
    .notify-close {
      color: #fff;
      font-size: 80rem;
    }
  }
}

.check {
  position: absolute;
  bottom: -80rem;
  left: 50%;
  transform: translateX(-50%);
  width: 270rem;
  height: 60rem;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, #00000080 49.5%, rgba(0, 0, 0, 0) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: PingFang SC;
  font-size: 20rem;
  font-weight: 400;
  --van-checkbox-label-color: #fff;
  --van-checkbox-checked-icon-color: #006fff;
}

/* 定义动画 */
@keyframes fadeInOut {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(2);
  }
}

/* 应用动画到图片 */
.animated-image {
  animation: fadeInOut 1s infinite; /* 动画名称，持续时间，重复次数 */
}

/* 定义动画 */
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 应用动画到图片 */
.open-image {
  animation: fadeIn 1s 1 alternate;
}
</style>
