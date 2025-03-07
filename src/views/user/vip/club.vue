<template>
  <x-page pageType="black">
    <template #title>
      <div class="page-title">
        <img src="/static/theme/black/vip/vipClub.png" alt="VIP" class="crown-icon" />
        <span>VIP Club</span>
      </div>
      <div class="top-bg"></div>
    </template>

    <div class="container">
      <div class="vip-info">
        <div class="vip-header">
          <div class="level-section">
            <div class="vip-level">VIP 0</div>
            <div class="progress-info">
              <div class="progress-text">Your VIP Progress</div>
              <div class="progress-value">
                0.0%
                <van-icon name="warning-o" size="20rem" />
              </div>
            </div>
          </div>
          <div class="level-badge">
            <img src="/static/theme/black/vip/badge-none.png" alt="Level" />
          </div>
        </div>

        <div class="progress-bar">
          <div class="progress-track">
            <div class="progress-fill" style="width: 0%"></div>
            <div class="progress-dot"></div>
          </div>
        </div>
      </div>
      <div class="learn-more" @click="conf.handleLearnMore">Learn more VIP level up system</div>
    </div>
  </x-page>
</template>

<script lang="ts" setup>
import { index } from './club'
import stheme from '@/sstore/stheme'

const conf = index()
</script>

<style lang="less" scoped>
.page-title {
  display: flex;
  align-items: center;
  gap: 12rem;

  .crown-icon {
    
    width: 40rem;
    height: 40rem;
  }
}

.top-bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
    height: 422rem;
    background: linear-gradient(210deg, #42566d 12.68%, #232626 62.05%);
    z-index: -1;
  }

.container {
  padding: 20rem;
  color: #fff;
  font-family: Poppins;
  z-index: 999;

  .vip-info {
    background: #323738;
    border-radius: 20rem;
    padding: 0 40rem;
    background-image: url(/static/theme/black/vip/none-background.png);
    background-size: 100% 100%;
    .vip-header {
      position: relative;

      .level-section {
        .vip-level {
          font-size: 36rem;
          font-style: normal;
          font-weight: 700;
          line-height: normal;
          padding: 40rem 0 30rem;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 60%;
          font-family: 'PingFang SC';
          font-size: 20rem;
          font-style: normal;
          font-weight: 500;
          line-height: normal;
          .progress-text {
          }

          .progress-value {
          }
        }
      }

      .level-badge {
        position: absolute;
        right: 0;
        top: -70rem;
        width: 220rem;
        height: 220rem;
        z-index: 999;

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }
    }

    .progress-bar {
      width: 60% !important;
      height: auto;
      padding: 20rem 0 40rem;

      .progress-track {
        position: relative;
        height: 20rem;
        background: #3a4142;
        border-radius: 16rem;

        .progress-fill {
          height: 100%;
          background: #1cf187;
          border-radius: 16rem 0 0 16rem;
          transition: width 0.3s ease;
        }

        .progress-dot {
          position: absolute;
          left: 7rem;
          top: 50%;
          transform: translateY(-50%);
          width: 20rem;
          height: 20rem;
          background: #6e96c6;
          border-radius: 50%;
          border: 6rem solid #536C87;; /* 透明边框 */
          z-index: 999;
         

          &::before {
            content: "";
            position: absolute;
            top: -12rem;
            left: -12rem;
            right: -12rem;
            bottom: -12rem;
            border: 6rem solid #42505E; /* 透明边框 */
            border-radius: 50%;
          }
        }
      }
    }
  }

  .learn-more {
    color: #1cf187;
    font-family: 'PingFang SC';
    font-size: 24rem;
    font-style: normal;
    font-weight: 600;
    border-radius: 16rem;
    background: #323738;
    height: 80rem;
    margin-top: 20rem;
    display: flex;
    align-items: center;
    justify-content: center;

    &:active {
      opacity: 0.8;
    }
  }
}
</style>
.
