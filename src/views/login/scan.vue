<script setup lang="ts">
import { reactive } from 'vue'
import LoginContainer from './components/login-container.vue'
import System from '@/utils/System'

const conf = reactive({
  loading: false
})
</script>

<template>
  <login-container :loading="conf.loading" current-active="login">
    <button class="back-btn" type="button" @click="System.router.back()">
      <span>←</span> {{ $t('login.backToAccountLogin') }}
    </button>
    <div class="scan-heading">
      <div class="eyebrow">{{ $t('login.mobileSignIn') }}</div>
      <h2>{{ $t('login.scanLogin') }}</h2>
      <p>{{ $t('login.scanDescription') }}</p>
    </div>
    <div class="code-box">
      <div class="code">
        <div class="scan-placeholder">
          <div class="scan-corners"></div>
          <span>1S</span>
        </div>
      </div>
      <div class="code-box-title">
        <i></i>
        <span>{{ $t('login.waitingAppScan') }}</span>
      </div>
    </div>
    <div class="scan-note">{{ $t('login.scanNote') }}</div>
  </login-container>
</template>

<style scoped lang="less">
.back-btn {
  margin-bottom: 46px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #667085;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: color 0.18s ease;

  &:hover {
    color: rgb(var(--primary-color));
  }
}

.scan-heading {
  margin-bottom: 28px;

  .eyebrow {
    margin-bottom: 11px;
    color: rgb(var(--primary-color));
    font-size: 10px;
    font-weight: 750;
    letter-spacing: 0.16em;
  }

  h2 {
    color: #182230;
    font-size: 29px;
    font-weight: 720;
    letter-spacing: -0.035em;
  }

  p {
    margin-top: 9px;
    color: #667085;
    font-size: 12px;
    line-height: 1.7;
  }
}

.code-box {
  width: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid #eaecf0;
  border-radius: 16px;
  background: #f9fafb;

  .code {
    width: 220px;
    height: 220px;
    padding: 14px;
    border: 1px solid #e4e7ec;
    border-radius: 15px;
    background: #fff;
    box-shadow: 0 10px 28px rgba(16, 24, 40, 0.07);
  }

  .scan-placeholder {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 9px;
    color: rgb(var(--primary-color));
    background:
      linear-gradient(90deg, #182230 9px, transparent 9px) 0 0 / 22px 22px,
      linear-gradient(#182230 9px, transparent 9px) 0 0 / 22px 22px,
      #fff;
    font-size: 20px;
    font-weight: 850;

    span {
      width: 54px;
      height: 54px;
      display: grid;
      place-items: center;
      border: 8px solid #fff;
      border-radius: 12px;
      background: #fff7ed;
    }
  }

  &-title {
    margin-top: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #475467;
    font-size: 11px;
    font-weight: 600;

    i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #12b76a;
      box-shadow: 0 0 0 4px rgba(18, 183, 106, 0.1);
    }
  }
}

.scan-note {
  margin-top: 18px;
  color: #98a2b3;
  font-size: 9px;
  line-height: 1.6;
  text-align: center;
}
</style>
