<script setup lang="ts">
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'

import { index } from './verify'
const conf = index()
</script>

<template>
  <x-page no-footer>
    <template #title>
      {{ 'Verify' }}
    </template>

    <div class="container">
      <div class="phone-verify" v-if="conf.verifyType == 'phone'"> 
        <div class="icon">
          <img src="/static/theme/black/setting/phone.png" alt="phone" />
        </div>
        <div class="title">Phone Number Verification</div>
        <div class="desc">Enter your new phone number below to receive a verification code.</div>

        <div class="phone-input">
          <div class="country-code" @click="conf.showCountryPicker">
            <span>{{ conf.selectedCode }}</span>
            <van-icon name="arrow-down" class="arrow-down" size="18rem" />
          </div>
          <input type="tel" v-model="conf.phoneNumber" placeholder="Phone Number" />
        </div>

        <button class="verify-btn" :disabled="!conf.isValidPhone" @click="conf.handleVerify">
          <greenBtn>
            <span>Verify</span>
          </greenBtn>
        </button>
      </div>
    </div>
  </x-page>
</template>

<style scoped lang="less">
.container {
  padding: 0rem 30rem;
  color: #ffffff;

  .phone-verify {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40rem 24rem;

    .icon {
      width: 60rem;
      height: 60rem;
      margin-bottom: 24rem;

      img {
        width: 100%;
        height: 100%;
      }
    }

    .title {
      font-family: Poppins;
      font-size: 28rem;
      font-style: normal;
      font-weight: 700;
      line-height: normal;
    }

    .desc {
      color: #bfbfbf;
      text-align: center;
      font-family: 'PingFang SC';
      font-size: 24rem;
      font-style: normal;
      font-weight: 600;
      line-height: normal;
      margin: 20rem 0 30rem;
    }

    .phone-input {
      width: 100%;
      display: flex;
      border-radius: 14rem;
      border: 2rem solid #4b5253;
      background: #292d2e;
      margin-bottom: 30rem;

      .country-code {
        margin: 15rem 0;
        display: flex;
        align-items: center;
        gap: 8rem;
        padding: 0 16rem;
        height: 54rem;
        cursor: pointer;
        border-right: 2rem solid #3b4041;
        color: #fff;
        font-family: 'PingFang SC';
        font-size: 28rem;
        font-style: normal;
        font-weight: 600;
        line-height: normal;

        .arrow-down {
          margin: 0 10rem;
        }
      }

      input {
        flex: 1;
        height: 84rem;
        border: none;
        padding: 0 16rem;
        color: #bfbfbf;
        font-family: 'PingFang SC';
        font-size: 28rem;
        font-style: normal;
        font-weight: 600;
        line-height: normal;

        &::placeholder {
          color: #bfbfbf;
        }
      }
    }

    .verify-btn {
      width: 100%;
      height: 83rem;
      border-radius: 12rem;
      color: #1f1f1f;
      font-size: 32rem;
      font-weight: 600;
      font-family: Poppins;
      font-style: normal;
      line-height: normal;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}
</style>
