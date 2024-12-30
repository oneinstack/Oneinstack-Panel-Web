<template>
  <transition name="fade-slide-down" mode="out-in">
    <div v-if="show" class="withdraw-people-dialog">
      <div class="card">
        <div class="title">{{ $t('point.todayNoSign') }}</div>
        <div class="desc" style="font-size: 21rem;" v-if="sigNum == 0">{{ $t('point.comeCheckIn') }}</div>
        <div class="desc" v-else>{{ $t('point.continuouslySignedFirst') }} {{ sigNum }} {{
          $t('point.continuouslySignedLast')}}</div>
      </div>
    </div>
  </transition>
</template>
<script setup lang="ts">

const props = defineProps({
  show: {
    default: false
  },
  sigNum: {
    default: 0
  }
})
</script>

<style scoped lang="less">
/* 从下向上渐入渐出 */
.fade-slide-up-enter-active,
.fade-slide-up-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-up-enter-from,
.fade-slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

/* 从上向下渐入渐出 */
.fade-slide-down-enter-active,
.fade-slide-down-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-down-enter-from,
.fade-slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

/* 缩放 */
.fade-zoom-in-enter-active,
.fade-zoom-in-leave-active {
  transition: all 0.3s ease;
}

.fade-zoom-in-enter-from,
.fade-zoom-in-leave-to {
  opacity: 0;
  transform: scale(.5);
}

.withdraw-people-dialog {
  position: absolute;
  top: 88rem;
  z-index: 999;
  width: 100%;
  height: 200rem;

  .card {
    margin: 0 auto;
    padding-top: 44rem;
    width: 720rem;
    height: 200rem;
    border-radius: 24rem;
    background-image: url('/static/theme/blue/withdraw-people-card.webp');
    background-size: contain;
    box-shadow: 0px 2px 6px 0px #0000001a;
  }

  .title {
    width: 371rem;
    height: 68rem;
    max-height: 68rem;
    text-align: center;
    margin: 0 auto;
    font-family: SF UI Display;
    font-size: 22rem;
    font-weight: 800;
    line-height: 68rem;
    color: #fff;
    text-shadow: 1px 1px 2px 0px #0D39FF;
  }

  .desc {
    margin: 14rem auto 0;
    height: 42rem;
    font-family: PingFang SC;
    font-size: 23rem;
    font-weight: 600;
    line-height: 42rem;
    text-align: center;
    color: #2C4FCD;
  }
}
</style>