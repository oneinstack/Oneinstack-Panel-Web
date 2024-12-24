<template>
  <van-overlay class-name="toast-overlay" :show="conf.showNumberBox">
    <div class="cu-modal-x">
      <div class="cu-dialog">
        <div class="cu-bar flex justify-end">
          <div
            class="flex flex-center"
            style="width: 100rem; height: 80rem"
            @click="conf.handleBindDialogBtns('close')"
          >
            <van-icon name="cross" color="#ccc" size="28rem" />
          </div>
        </div>
        <div class="row justify-center">
          <img class="showimg" src="/static/theme/blue/security.svg" />
        </div>
        <div class="showBox-content flex justify-center">
          <span>{{ $t('home.bindTitle') }}</span>
          <div class="tip">
            <p>{{ $t('home.bindTip') }}</p>
          </div>
        </div>
        <div class="bind-btn-view">
          <div class="right-btn" style="margin-right: 64rem" @click="conf.handleBindDialogBtns('bind')">
            {{ $t('home.bind') }}
          </div>
          <div class="left-btn" @click="conf.handleBindDialogBtns('close')">{{ $t('home.Close') }}</div>
        </div>
        <div class="check">
          <van-checkbox v-model="conf.isNoPrompt" icon-size="32rem" shape="square" @change="conf.isNoPrompt = $event">
            {{ $t('home.NoPrompt') }}
          </van-checkbox>
        </div>
      </div>
    </div>
  </van-overlay>
</template>
<script setup lang="ts">
import { index } from '@/views/home/home-com/DBindInfo'

const conf = index()
</script>
<style lang="less" scoped>
.toast-overlay {
  z-index: 2002;
}

.cu-modal-x {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  .cu-dialog {
    background-color: #fff;
    width: 560rem;
    border-radius: 40rem;
    width: 560rem;
    box-shadow: 0 2rem 10rem #fffbf5;
    animation: fadeIn 1s 1 alternate;
    position: relative;
    padding-bottom: 20rem;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 140rem;
      border-radius: 40rem 40rem 0 0;
      background: linear-gradient(180deg, #c6e1ff 0%, #ffffff 71.76%, #ffffff 100%);
      z-index: 1;
    }

    .cu-bar {
      height: 70rem;
      min-height: 70rem;
      position: relative;
      z-index: 2;
    }

    .showimg {
      width: 200rem;
      height: 200rem;
      position: relative;
      z-index: 2;
    }

    .text-red {
      color: #cccccc;
      font-weight: bold;
      font-size: 28rem;
    }

    .showBox-content {
      font-size: 32rem;
      color: #333;
    }

    .tip {
      text-align: center;
      color: #666666;
      font-size: 24rem;
      margin-top: 15rem;
      padding: 0 15rem;
    }

    .bind-btn {
      margin: 30rem auto 50rem;
      color: #fff;
      font-size: 40rem;
      height: 80rem;
      line-height: 80rem;
      width: 418rem;
      border-radius: 40rem;
      background: linear-gradient(to top, #eb602d, #ffa64f);
    }
  }
}

.bind-btn-view {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 30rem 0rem;
}

.left-btn,
.right-btn {
  text-align: center;
  background-color: #f17638;
  color: #fff;
  border-radius: 80rem;
  font-size: 26rem;
  font-weight: 600;
  height: 52rem;
  line-height: 52rem;
  min-width: 132rem;
  padding: 0rem 20rem;
}

.left-btn {
  background: #e6f2ff;
  color: #006fff;
}

.right-btn {
  background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%) !important;
  color: #fff;
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
</style>
