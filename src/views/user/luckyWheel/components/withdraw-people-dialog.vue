<script setup lang="ts">
import { reactive } from 'vue'

defineProps<{
  show: boolean
}>()

const radomNum = reactive({
  value: 0,

  set() {
    radomNum.value = MathUtil.getRandomInt(100, 300)
  }
})
radomNum.set()
</script>

<template>
  <transition name="fade-slide-down" mode="out-in">
    <div v-if="show" class="withdraw-people-dialog">
      <div class="file">
        <div class="left">
        </div>
        <div class="right">
        </div>
      </div>
      <div class="card">
        <div class="title">{{ $t('luckyWheel.easyWithdrawals') }}</div>
        <div v-html="$t('luckyWheel.anotherPeopleWithdrawn', { num: radomNum.value })" class="desc" />
      </div>
    </div>
  </transition>
</template>

<style scoped lang="less">
.withdraw-people-dialog {
  position: absolute;
  top: 88rem;
  z-index: 999;
  width: 100%;
  height: 200rem;

  .file {
    position: absolute;
    width: 100%;
    display: flex;
    justify-content: space-between;

    .left,
    .right {
      width: 330rem;
      height: 330rem;
    }

    .left {
      transform: translate(-45%, -35%) rotate(30deg) rotateY(180deg);
    }

    .right {
      transform: translate(45%, -35%) rotate(-30deg);
    }
  }

  .card {
    margin: 0 auto;
    padding-top: 44rem;
    width: 720rem;
    height: 200rem;
    border-radius: 24rem;
    background-image: url('/static/img/luckyWheel/withdraw-people-card.png');
    background-size: contain;
    box-shadow: 0rem 4rem 12rem 0rem #0000001a;
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
    text-shadow: 2rem 2rem 4rem #ff4f0d;
  }

  .desc {
    margin: 14rem auto 0;
    height: 42rem;
    font-family: PingFang SC;
    font-size: 30rem;
    font-weight: 600;
    line-height: 42rem;
    text-align: center;
    color: #cd5e2c;

    // i18n内的标签
    ::v-deep(.num) {
      color: #ef1017;
    }
  }
}
</style>
