<script setup lang="ts">
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'

import { index } from './security'
const conf = index()
</script>

<template>
  <x-page no-footer pageType="black">
    <template #title>
      {{ 'Security' }}
    </template>

    <div class="container">
      <div class="security-list">
        <div class="title-box">Security Setup</div>

        <div class="security-item">
          <div class="item-icon">
            <img src="/static/theme/black/setting/Security.png" />
          </div>
          <div class="item-info">
            <div class="title">Change Password</div>
            <div class="desc">Change your password regularly to keep it unique and secure.</div>
          </div>
          <button class="action-btn" @click="conf.handleChangePassword">Change Password</button>
        </div>

        <div class="security-item">
          <div class="item-icon">
            <img src="/static/theme/black/setting/email.png" />
          </div>
          <div class="item-info">
            <div class="title">Email Verification</div>
            <div class="desc">Verify your email address is valid and accessible by you.</div>
          </div>
          <button class="action-btn" @click="conf.handleVerify('email')">
            <greenBtn>
              <span>Verify Email</span>
            </greenBtn>
          </button>
        </div>

        <div class="security-item">
          <div class="item-icon">
            <img src="/static/theme/black/setting/phone.png" />
          </div>
          <div class="item-info">
            <div class="title">Phone Number Verification</div>
            <div class="desc">Verify your phone number is valid and accessible by you.</div>
          </div>
          <button class="action-btn green" @click="conf.handleVerify('phone')">
            <greenBtn>
              <span>Verify Phone Number</span>
            </greenBtn>
          </button>
        </div>

        <div class="security-item">
          <div class="item-icon">
            <img src="/static/theme/black/setting/passkey.png" />
          </div>
          <div class="item-info">
            <div class="title">Payment Passkey</div>
            <div class="desc">Using passkey to protect your account from unauthorized access.</div>
          </div>
          <button class="action-btn green" @click="conf.handleEnablePasskey">
            <greenBtn>
              <span>Enable Passkey</span>
            </greenBtn>
          </button>
        </div>
      </div>
    </div>
  </x-page>
</template>

<style scoped lang="less">
.container {
  margin: 30rem 24rem;
  color: #ffffff;

  .security-list {
    padding: 20rem;
    border-radius: 20rem;

    margin-bottom: 60rem;
    background: #323738;

    .title-box {
      font-family: Poppins;
      font-weight: 600;
      font-size: 28rem;
      line-height: 42rem;
      letter-spacing: 0%;
      padding: 17rem 0;
    }
    .security-item {
      border-top: 2rem solid #3b4041;
      border-radius: 16rem;
      padding: 24rem;
      margin-bottom: 20rem;

      .item-icon {
        margin: 16rem 0 30rem;
        width: 60rem;
        height: 60rem;

        img {
          width: 100%;
          height: 100%;
        }
      }

      .item-info {
        margin-bottom: 16rem;

        .title {
          font-family: Poppins;
          font-size: 28rem;
          font-style: normal;
          font-weight: 700;
          line-height: normal;
        }

        .desc {
          color: #bfbfbf;
          font-family: 'PingFang SC';
          font-size: 24rem;
          font-style: normal;
          font-weight: 600;
          line-height: normal;
          margin: 30rem 0;
        }
      }

      .action-btn {
        width: 100%;
        height: 83rem;
        flex-shrink: 0;
        border-radius: 12rem;
        background: #464f50;
        font-family: Poppins;
        font-size: 32rem;
        font-style: normal;
        font-weight: 600;
        line-height: normal;

        &.green {
          background: #1cf187;
          color: #000000;
        }
      }
    }
  }
}
</style>
