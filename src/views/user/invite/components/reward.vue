<template>
    <div class="content">
      <div class="rewards-info">
        <div class="reward-box">
          <div class="reward-card">
            <div class="card-header">
              <span>Available Commission Rewards</span>
              <van-icon name="warning-o" size="30rem" @click="conf.handleOpenPopup(1)"/>
            </div>
            <div class="amount">{{ conf.commissionReward1 }}</div>
            <div class="sub-amount">Total Received: <span style="color: #fff;">{{ conf.totalCommissionReceived }}</span></div>
          </div>
          <div class="reward-card">
            <div class="card-header">
              <span>Available Referral Rewards</span>
              <van-icon name="warning-o" size="30rem" @click="conf.handleOpenPopup(2)"/>
            </div>
            <div class="amount">{{ conf.referralReward }}</div>
            <div class="sub-amount flex-div">
              <div>Total Received: 
                <span style="color: #fff;">{{ conf.totalReferralReceived }}</span>
              </div>
              <div>Locked Rewards: 
                <span style="color: #fff;">{{ conf.lockedRewards }}</span>
              </div>
            </div>
          </div>
          <div class="action-buttons">
            <div class="btn-item">
              <button class="exchange-btn">Exchange</button>
            </div>
            <div class="btn-item">
              <greenBtn>
                <span>Withdraw to Wallet</span>
              </greenBtn>
            </div>
          </div>
        </div>

        <div class="bom-box">
          <div class="tab-box">
            <div 
              class="tab-item flex-center"
              :class="{ 'tab-active': conf.activeTab == 1 }"
              @click="conf.activeTab = 1">
              Commission
            </div>
            <div 
              class="tab-item flex-center"
              :class="{ 'tab-active': conf.activeTab == 2 }"
              @click="conf.activeTab = 2">
              Referral
            </div>
          </div>
          <template v-if="conf.activeTab == 2">
            <div class="history-box">
              <button class="right-item">
                <van-icon name="clock-o" />
                  History
                  &nbsp;>
              </button>
            </div>
            <div class="date-filter">
              <button class="date" @click="conf.handleOpenPopup(3)">
                Registration Date: All Range
              </button>
            </div>
            <div class="rewards-table"> 
              <div class="table-header">
                <div class="col">Username</div>
                <div class="col">VIP Level</div>
                <div class="col">Earned</div>
              </div>
              <div class="table-body">
                <div v-for="(item, index) in conf.tableData" :key="index" class="table-row">
                  <div class="col">{{ item.username }}</div>
                  <div class="col">{{ item.vipLevel }}</div>
                  <div class="col earned">
                    {{ item.earned }}
                    <img :src="item.countryFlag" class="country-flag">
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 弹出层 -->
    <van-popup
      v-model:show="conf.infoPopupObj.show"
      position="bottom"
      :style="{ background:'#323738',borderRadius:'20rem',padding:'20rem' }">
      <div class="popup-header" v-if="conf.infoPopupObj.type != 3">
        <div class="title">{{ conf.infoPopupObj.title }}</div>
        <div class="close">
          <van-icon name="cross" size="40rem" @click="conf.infoPopupObj.show = false"/>
        </div>
      </div>
      <div class="popup-content">
          <div v-if="conf.infoPopupObj.type == 1">
            <div class="title">可用的佣金奖励</div>
            <div>您可以提取到钱包的奖励</div>
            <div class="title">已收到总数</div>
            <div>到目前为止您已收到的奖励，它包括已提取的奖励和可用的佣金奖励。</div>
          </div>
          <div v-if="conf.infoPopupObj.type == 2">
            <div class="title">可用推荐奖励</div>
            <div>您可以提取到钱包的奖励</div>
            <div class="title">已领取总数</div>
            <div>迄今为止收到的所有未锁定奖励，包括已领取和可提现的奖励。</div>
            <div class="title">锁定奖励</div>
            <div>当您朋友的VIP等级提升时，您将获得奖励。</div>
          </div>
          <div v-if="conf.infoPopupObj.type == 3">
            <van-date-picker
              v-model="conf.currentDate"
              title="Select the date"
              confirm-button-text="Confirm"
              cancel-button-text="Cancel"
              :min-date="conf.minDate"
              :max-date="conf.maxDate"
              :columns-type="['year', 'month']"
              @confirm="conf.handlePicker('confirm')"
              @cancel="conf.handlePicker('cancel')"
            />
          </div>
      </div>
    </van-popup>
  </template>
  
  <script setup lang="ts">
  import greenBtn from '@/views/home/theme/black/components/greenBtn.vue';

  import { index } from './reward'

  const conf = index()
  </script>
  
  <style scoped lang="less">
  .content {
    .rewards-info {
      .reward-box{
        margin-top: 20rem;
        border-radius: 20rem;
        overflow: hidden;
        background: #323738;
        padding: 24rem;

      }
      .reward-card {

        &:first-child {
          padding-bottom: 20rem;
          border-bottom: 2rem solid #3B4041
        }
  
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #BFBFBF;
            font-family: PingFang SC;
            font-weight: 600;
            font-size: 24rem;
            line-height: 34rem;
            margin-top: 20rem;
        }
  
        .amount {
            font-family: Poppins;
            font-weight: 700;
            font-size: 40rem;
            line-height: 60rem;
            color: #1CF187;
            margin-top: 20rem;
        }
  
        .sub-amount {
            color: #BFBFBF;
            font-family: PingFang SC;
            font-weight: 600;
            font-size: 24rem;
            line-height: 34rem;
            margin-top: 20rem;
        }

        .flex-div{
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      }

      .action-buttons {
        display: flex;
        gap: 12rem;
        margin-top: 20rem;

        .btn-item{
          flex: 1;
          height: 68rem;
          border-radius: 12rem;
          font-size: 28rem;
          font-weight: 600;
          background: #3A4142 !important;
          text-align: center;

          .exchange-btn {
            height: 100%;
            background: #3A4142;
            color: #FFFFFF;
          }
        }
      }

      .bom-box{
        margin: 20rem 0;
        border-radius: 20rem;
        overflow: hidden;
        background: #323738;
        padding: 24rem;

        .tab-box{
          display: flex;
          width: 100%;

          .tab-item {
            flex: 1;
            background: #323838;
            height: 68rem;
            color: #B3BEC1;
            font-size: 24rem;
          }

          .tab-active{
            background: #394143;
          }

        }

        .history-box{
          color: #FFFFFF;
          text-align: right;
          margin-top: 20rem;

          .right-item{
            height: 56rem;
            background: #3A4142;
            border-radius: 10rem;
            font-family: PingFang SC;
            font-weight: 600;
            font-size: 20rem;
            line-height: 28rem;
            letter-spacing: 0%;
            padding: 0 10rem;
          }
        }

        .date-filter{
          margin-top: 20rem;
          color: #FFFFFF;
          font-family: PingFang SC;
          font-weight: 600;
          font-size: 24rem;
          line-height: 34rem;
          letter-spacing: 0%;

          .date{
            min-width: 490rem;
            height: 84rem;
            border-radius: 14rem;
            background: #292D2E;
            border: 2rem solid #4B5253;
            padding: 0 20rem;
            text-align: left;
          }
        }
      }
  
      .rewards-table {
        margin-top: 20rem;
        color: #FFFFFF;
        .table-header {
          display: flex;
          font-family: PingFang SC;
          font-weight: 600;
          font-size: 20rem;
          line-height: 28rem;
          letter-spacing: 0%;  
          padding: 20rem 0;

          .col {
            flex: 1;
            color: #BFBFBF;
            // text-align: center;

            &:nth-child(2) {
              text-align: center;
            }
            &:nth-child(3) {
              text-align: right;
            }
          }
        }
  
        .table-body {
          font-family: PingFang SC;
          font-weight: 600;
          font-size: 24rem;
          line-height: 34rem;
          letter-spacing: 0%;

          .table-row {
            display: flex;
            padding: 30rem 0;
            border-top: 2rem solid #3B4041;
  
            .col {
              flex: 1;

              &:nth-child(2) {
                text-align: center;
              }
  
              &.earned {
                color: #1CF187;
                display: flex;
                align-items: center;
                justify-content: end;
                gap: 8rem;
              }
              img{
                width: 40rem;
                height: 30rem;
              }
            }
  
            .country-flag {
              width: 20rem;
              height: 20rem;
              border-radius: 50%;
            }
          }
        }
      }
    }
  }

  .popup-header{
    position: relative;
    text-align: center;
    color: #FFFFFF;
    font-size: 40rem;


    .close{
      position: absolute;
      right: 10rem;
      top: 0rem;
      padding: 0 10rem;
      background: #394143;
      border-radius: 10rem;
    }
  }

  .popup-content{
    color: #BFBFBF;
    font-size: 26rem;

    .title{
      font-size: 32rem;
      color: #FFFFFF;
      padding: 10rem;
    }

  }

  </style>
      