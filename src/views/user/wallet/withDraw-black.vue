<script setup lang="ts">
import coinPopup from './com/coinPopup.vue'
import selectPopup from './com/selectPopup.vue'
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'
import sutil from '@/sstore/sutil'
import { index } from './withDraw'

const conf = index()
</script>

<template>
  <x-page no-footer>
    <template #title>{{ $t('WithdrawModule.titleName') }}</template>
    <!-- 选择充值钱包信息 -->
    <div class="content">
      <div class="c-title flex-b-c">
        <div>Withdrawal Currency</div>
      </div>
      <div class="c-item flex-b-c" @click="conf.modalName = 'coinType'">
        <div class="left-table">
          <img :src="conf.infoObj.nationalFlag" />
          <span>{{ conf.infoObj.coinCode ? conf.infoObj.coinCode : '--' }}</span>
        </div>
        <div class="r-arrow flex-center">
          <van-icon size="24rem" color="#fff" name="arrow-down" />
        </div>
      </div>
      <div class="c-title flex-b-c">Withdrawal Methods</div>
      <div class="c-item flex-b-c" @click="conf.modalName = 'method'">
        <div class="left-table">{{ conf.choosePaymentItem?.payMethodType || '--' }}</div>
        <div class="r-arrow flex-center">
          <van-icon size="24rem" color="#fff" name="arrow-down" />
        </div>
      </div>
      <div class="c-title flex-b-c">Withdrawal channel</div>
      <div class="c-item flex-b-c">
        <div class="left-table">INR</div>
        <div class="r-arrow flex-center">
          <van-icon size="24rem" color="#fff" name="arrow-down" />
        </div>
      </div>
      <div class="c-title flex-b-c">
        <span>Withdrawal amount</span>
        <div>Min: <span style="color: #FC3C3C;">$324.00</span></div>
      </div>
      <div class="c-item flex-b-c" style="margin-bottom: 10rem;">
        <input class="input" placeholder="0" />
      </div>
      <div class="btn-list">
        <div class="btn-item flex-center">Min</div>
        <div class="btn-item flex-center">25%</div>
        <div class="btn-item flex-center">50%</div>
        <div class="btn-item flex-center">Max</div>
      </div>
      <div class="c-tip flex-b-c">
        <div>Service Charge:<span>$1.00</span></div>
        <div>Exchange Charge:<span>$1.00</span></div>
      </div>
      <div style="height: 88rem;margin-top: 40rem;">
        <greenBtn>
          <span style="font-size: 32rem;">Withdrawal</span>
        </greenBtn>
      </div>
    </div>
    <coinPopup :show="conf.modalName == 'coinType'" :dataArr="conf.rechargeWalletList" :selectId="conf.infoObj.id"
      @close="conf.modalName = undefined" @change="(e) => { conf.modalName = undefined, conf.infoObj = e }" />
    <selectPopup :show="conf.modalName == 'method'" :dataArr="conf.paymentMethodsList"
      :selectId="conf.choosePaymentItem?.id" @close="conf.modalName = undefined"
      @change="(e) => conf.handelChangePaymentMethod(e)" />
  </x-page>
</template>

<style scoped lang="less">
.content {
  background: #323738;
  border-radius: 20rem;
  margin: 24rem;
  padding: 30rem 24rem 60rem;

  .c-title {
    color: #BFBFBF;
    font-size: 28rem;
    margin-bottom: 16rem;
    padding: 0rem 2rem;
  }

  .c-item {
    background: #292D2E;
    border: 2rem solid #383E3E;
    height: 80rem;
    padding: 20rem;
    border-radius: 12rem;
    color: #fff;
    font-size: 28rem;
    font-weight: 700;
    margin-bottom: 30rem;

    .left-table {
      display: flex;
      align-items: center;

      img {
        height: 40rem;
        margin-right: 12rem;
      }
    }

    .r-arrow {
      width: 44rem;
      height: 44rem;
      background: #464F50;
      border-radius: 12rem;
    }

    .input {
      flex: 1;
    }
  }

  .c-tip {
    color: #BFBFBF;
    font-size: 20rem;
  }

  .btn-list {
    display: flex;
    margin-bottom: 20rem;
    .btn-item {
      flex: 1;
      background: #4A5354;
      height: 56rem;
      border-radius: 10rem;
      color: #B3BEC1;
      font-size: 24rem;
      margin-right: 12rem;
      &:last-of-type{
        margin-right: 0rem;
      }
    }
  }
}
</style>
