<template>
  <x-page>
    <template #title>
      {{ 'My Profile' }}
    </template>
    <div class="container">
      <div class="user-info">
        <div class="avatar-section">
          <img :src="conf.userInfo.userImgUrl" class="avatar" alt="" />
          <div class="edit-icon" @click="conf.handleNavigate">
            <img src="/static/theme/black/myProfile/edit.png" alt="edit" />
          </div>
        </div>
        <div class="user-details">
          <div class="username">{{ conf.userInfo.userNickname }}</div>
          <div class="user-id">User ID: {{ conf.userInfo.userId }}</div>
        </div>
      </div>

      <div class="stats-section">
        <div class="section-title">
          <img src="/static/theme/black/myProfile/statistics.png" alt="" />
          <span>Statistics</span>
        </div>

        <div class="stats-grid">
          <div class="stats-item">
            <div class="item-top">
              <img src="/static/theme/black/myProfile/totalWins.png" alt="wins" />
              <div class="item-label">Total Wins</div>
            </div>
            <div class="item-value">{{ conf.statistics.totalWins }}</div>
          </div>

          <div class="stats-item">
            <div class="item-top">
              <img src="/static/theme/black/myProfile/totalBets.png" alt="bets" />
              <div class="item-label">Total Bets</div>
            </div>
            <div class="item-value">{{ conf.statistics.totalBets }}</div>
          </div>
        </div>

        <div class="total-amount">
          <div class="amount-top">
            <img src="/static/theme/black/myProfile/totalAmount.png" alt="amount" />
            <div class="amount-label">Total Amount</div>
          </div>
          <div class="amount-value">${{ conf.statistics.totalAmount }}</div>
        </div>
      </div>
    </div>
  </x-page>
</template>

<script lang="ts" setup>
import { index } from './index'
import stheme from '@/sstore/stheme'

const conf = index()
</script>

<style lang="less" scoped>
.container {
  padding: 40rem 20rem;
  color: #ffffff;
  font-family: Poppins;

  .user-info {
    gap: 20rem;
    margin-bottom: 32rem;
    text-align: center;
    margin: 10rem 0 70rem;

    .avatar-section {
      position: relative;

      .avatar {
        width: 100rem;
        height: 100rem;
        border-radius: 50%;
        object-fit: cover;
        border: 6rem solid #b3bec1;
      }

      .edit-icon {
        position: absolute;
        right: 20rem;
        top: 0;
        width: 56rem;
        height: 56rem;
        cursor: pointer;
        background: #464f50;
        border-radius: 12rem;

        img {
          margin-top: 12rem;
          width: 32rem;
          height: 32rem;
        }
      }
    }

    .user-details {
      .username {
        color: #fff;
        font-size: 32rem;
        font-style: normal;
        font-weight: 600;
        line-height: normal;
      }

      .user-id {
        color: #bfbfbf;
        font-family: 'PingFang SC';
        font-size: 24rem;
        font-style: normal;
        font-weight: 600;
        line-height: normal;
      }
    }
  }

  .stats-section {
    background: #323738;
    border-radius: 20rem;
    padding: 20rem;

    .section-title {
      display: flex;
      align-items: center;
      gap: 20rem;
      border-bottom: 2rem solid #3b4041;
      padding-bottom: 15rem;

      img {
        width: 32rem;
        height: 32rem;
      }

      span {
        font-size: 28rem;
        font-style: normal;
        font-weight: 600;
        line-height: normal;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16rem;
      margin: 24rem 0;

      .stats-item {
        background: #3a4142;
        border-radius: 16rem;
        padding: 16rem;
        text-align: center;

        .item-top {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10rem;
          margin-bottom: 8rem;

          img {
            width: 24rem;
            height: 24rem;
          }
          .item-label {
            font-family: 'PingFang SC';
            font-size: 24rem;
            font-style: normal;
            font-weight: 600;
            line-height: normal;
          }
        }

        .item-value {
          font-size: 28rem;
          font-style: normal;
          font-weight: 600;
          line-height: normal;
        }
      }
    }

    .total-amount {
      background: #3a4142;
      border-radius: 16rem;
      padding: 16rem;
      text-align: center;
      margin-bottom: 20rem;

      .amount-top {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10rem;
        margin-bottom: 8rem;

        img {
          width: 24rem;
          height: 24rem;
        }

        .amount-label {
          font-family: 'PingFang SC';
          font-size: 24rem;
          font-style: normal;
          font-weight: 600;
          line-height: normal;
        }
      }

      .amount-value {
        font-size: 28rem;
        font-style: normal;
        font-weight: 600;
        line-height: normal;
      }
    }
  }
}
</style>
.
