<template>
  <x-page no-header tabbar>
    <template #top>
      <x-statusbar background="#336cff " />
      <div class="w-head">
        <img class="head-bg" src="/static/theme/blue/bg-square.webp" />
        <!-- 总金额和通知 -->
        <div class="head-info">
          <div class="l-content">
            <img class="l-img" :src="sconfig.userInfo && sconfig.userInfo.userImgUrl" />
            <div class="l-total">
              <div class="title">{{ $t('wallet.topTitle') }}</div>
              <div class="num">
                <span>
                  {{
                    conf.openEye == 'open'
                      ? conf.defaultCoin.coinSymbol + sutil.dataHandling(conf.total_money)
                      : conf.str_money
                  }}
                </span>
                <img class="eye-img" @click="conf.changeTotalEye" :src="`/static/img/wallet/eye-${conf.openEye}.png`" />
              </div>
            </div>
          </div>
          <div class="r-notice" @click="conf.handleNoticeClick" v-if="conf.noticeNum > 0">
            <img class="notice-img" src="/static/img/wallet/notice.png" />
            <div class="badge">{{ conf.noticeNum }}</div>
          </div>
        </div>
        <div class="center-box">
          <!-- swiper -->
          <swiper-wallet-blue
            v-if="conf.swiperList.length"
            :swiperList="conf.swiperList"
            :defaultCoin="conf.defaultCoin"
            @eyeClick="conf.handleWalletEyeClick"
            @swiper="conf.cardSwiper"
            @changeDefault="conf.handleDefaultwallet"
            @addWallet="conf.handleAddWallet"
          ></swiper-wallet-blue>
          <!-- 充值、提现、转入、汇兑 -->
          <div class="select">
            <div class="select-item" @click="conf.handleCilckImg('Recharge', $event)">
              <img src="/static/theme/blue/recharge.webp" />
              <span>{{ $t('wallet.Recharge') }}</span>
            </div>
            <div class="select-item" @click="conf.handleCilckImg('Withdraw', $event)">
              <img src="/static/theme/blue/withdrawal.webp" />
              <span>{{ $t('wallet.Withdrawal') }}</span>
            </div>
            <div
              class="select-item"
              @click="conf.handleCilckImg('Remittance', $event)"
              v-show="conf.userWalletList.length > 1"
            >
              <img src="/static/theme/blue/remittance.webp" />
              <span>{{ $t('wallet.Remittance') }}</span>
            </div>
            <div class="select-item" @click="conf.handleCilckImg('CentralWallet', $event)">
              <img src="/static/theme/blue/central.webp" />
              <span>{{ $t('wallet.central') }}</span>
            </div>
          </div>
        </div>
      </div>
      <div style="height: 24rem"></div>
    </template>
    <!-- 消费记录详情 -->
    <div class="winning-box" style="width: 100%" v-if="conf.detailData.length > 0">
      <div
        class="winning-item"
        v-for="(item, itemIndex) in conf.detailData"
        :key="itemIndex"
        @click="conf.handleDetailView(item)"
      >
        <div class="content">
          <div class="left-user">
            <div class="userName" :class="item.tradeStatus == -1 ? 'hasOp' : ''">
              <div>
                <!-- 判断是否首充/首提 -->
                <span>
                  {{
                    item.firstRecharge == 1
                      ? $t('wallet.FirstRecharge')
                      : item.firstPayouts == 1
                        ? $t('wallet.FirstWithdrawal')
                        : item.tradeTypeName
                  }}
                </span>
                <!-- 交易中 -->
                <span
                  v-if="
                    (item.tradeStatus == 0 && item.tradeType == 2) ||
                    (item.tradeStatus == 2 && item.tradeType == 1) ||
                    (item.tradeStatus == 7 && (item.tradeType == 1 || item.tradeType == 2)) ||
                    item.tradeStatus == 5
                  "
                >
                  {{ '(' + $t('wallet.wait') + ')' }}
                </span>
                <span v-else-if="item.tradeStatus == 1 && item.recordMark == 1">
                  {{ ' (' + $t('otcOrderModule.dispute') + ')' }}
                </span>
              </div>
              <div>
                <span style="opacity: 0.4; font-size: 20rem">{{ item.tradeTime }}</span>
              </div>
            </div>
          </div>
          <div class="right-money" :class="item.tradeStatus == -1 ? 'hasOp' : ''">
            <div
              class="money"
              :class="[
                item.firstRecharge == 1
                  ? 'orange'
                  : item.tradeStatus == 0 ||
                      item.tradeStatus == 2 ||
                      item.tradeStatus == 3 ||
                      item.tradeStatus == 5 ||
                      item.tradeStatus == 4 ||
                      item.tradeStatus == 7
                    ? 'blue'
                    : item.tradeStatus == 1
                      ? 'green'
                      : 'red'
              ]"
            >
              <!-- {{ item.coinSymbol=='USDT'?item.symbol+ item.coinSymbol +' '+ item.money: item.symbol+ item.coinSymbol + item.money}} -->
              <!-- 处理异常订单 -->
              <span v-if="item.tradeStatus == 7">
                {{ item.tradeType == 1 ? item.symbol + item.coinSymbol + item.actualMoney : '' }}
              </span>
              <!-- 异常->成功 -->
              <span v-if="item.recordMark == 1 && item.tradeStatus != 7" style="color: #ffa12d">
                {{ item.tradeType == 1 ? item.symbol + item.coinSymbol + item.actualMoney : '' }}
              </span>
              <!-- 其他 -->
              <span v-if="item.recordMark != 1 && item.tradeStatus != 7">
                {{
                  item.coinSymbol == 'USDT'
                    ? item.symbol + item.coinSymbol + ' ' + item.money
                    : item.symbol + item.coinSymbol + item.money
                }}
              </span>

              <div v-if="item.tradeStatus == -1" class="hasLine"></div>
            </div>
          </div>
        </div>
        <!-- <div v-if="item.tradeStatus == -1" class="line"></div> -->
      </div>
    </div>
    <div v-if="conf.detailData.length == 0" class="noConsumptionRecords">
      {{ $t('wallet.noConsumptionRecordsTip') }}
    </div>
    <add-wallet
      v-if="conf.isShowCustomPopup"
      @sendData="conf.getPopupData"
      @dialogDataSubmit="conf.handleAddWlletSubmit"
    ></add-wallet>
    <!-- 银行卡绑定提示框-->
    <cuModal :showNumberBox="conf.showNumberBox" @handleCloseBindDialog="conf.handleCloseBindDialog" />
  </x-page>
</template>
<script setup lang="ts">
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import addWallet from './components/addWallet-blue.vue'
import cuModal from './theme/blue/components/cuModal.vue'
import swiperWalletBlue from './components/swiperWalletBlue.vue'
import { index } from './ts/wallet'

const conf = index()
</script>
<style lang="less" scoped>
.w-head {
  width: 100%;
  position: relative;
  min-height: 650rem;
  // height: 702rem;
  overflow: hidden;

  .head-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 392rem;
    background: linear-gradient(#336cff 0%, #336cfffc 51%, rgba(255, 166, 79, 0) 100%);
  }

  .head-info {
    padding: 30rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 9;

    .l-content {
      display: flex;
      align-items: center;

      .l-img {
        margin-right: 16rem;
        width: 80rem;
        height: 80rem;
        border-radius: 50%;
      }

      .l-total {
        color: #fff;
        font-weight: 600;
        font-size: 32rem;

        .num {
          font-size: 28rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          margin-top: 10rem;

          .eye-img {
            margin-left: 10rem;
            width: 28rem;
            height: 20rem;
          }
        }
      }
    }

    .r-notice {
      position: relative;
      display: flex;
      justify-content: center;

      .notice-img {
        width: 50rem;
        height: 50rem;
      }

      .badge {
        position: absolute;
        top: -5px;
        background: #dd514c;
        height: 15px;
        padding: 0 5px;
        color: #fff;
        border-radius: 8px;
        font-size: 11px;
      }
    }
  }

  .center-box {
    height: 530rem;
    .select {
      position: absolute;
      bottom: 0;
      height: 334rem;
      width: 100%;
      background: #ffffff;
      border-radius: 16rem;
      display: flex;

      .select-item {
        flex: 1;
        display: flex;
        justify-content: end;
        align-items: center;
        flex-direction: column;
        margin-bottom: 20rem;

        img {
          width: 108rem;
          height: 108rem;
        }

        span {
          color: #000000;
          font-size: 26rem;
          font-weight: 600;
          letter-spacing: -0.3px;
          // margin-top: 16rem;
        }
      }
    }
  }
}

.noConsumptionRecords {
  width: 100%;
  padding: 30rem;
  text-align: center;
  background: #fff;
  font-weight: bolder;
}

.winning-box {
  // overflow-y: hidden;
  padding: 0rem 24rem;
  background: #fff;

  .winning-item {
    position: relative !important;
    // .line{
    // 	width: 100%;
    // 	height: 10rem;
    // 	position: absolute !important;
    // 	background: #999 !important;
    // 	top: calc(50% - 5rem);
    // }
  }

  .content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 112rem;
    border-bottom: 3px solid #f9fafc;

    .left-user {
      display: flex;
      align-items: center;

      .serial {
        width: 40rem;
        color: rgb(37, 37, 41);
        font-size: 28rem;
        font-weight: bold;
        margin-right: 16rem;
      }

      .userName {
        color: rgb(132, 132, 144);
        font-size: 28rem;
        position: relative;

        span {
          color: #000000;
          font-weight: 500;
        }
      }
    }

    .right-money {
      text-align: right;

      .money {
        font-size: 32rem;
        padding-right: 10rem;
        font-weight: 500;
      }
    }

    .chart-money {
      min-width: 200rem;
      height: 36rem;
      padding: 0rem 24rem;
      background: rgb(217, 0, 0);
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 20rem;
      color: #ffffff;
      font-size: 28rem;
    }
  }
}

// 充值弹窗
.text-white {
  display: none !important;
}

.blue {
  color: #3c80f5;
}

.green {
  color: #2aa855;
}

.red {
  color: #e20000;
}

.hasLine {
  width: 100%;
  height: 4rem;
  position: absolute !important;
  background: #999 !important;
  top: calc(50% - 2rem);
}

.cu-load.loading::after {
  content: 'loading...';
}

.bg-grey {
  background-color: #fff;
  color: #000000;
}

.cu-load.over::after {
  content: "There's nothing more left";
}

.hasOp {
  opacity: 0.5;
}

.yellow {
  color: #ffd7a3;
}

.orange {
  color: #f68740 !important;
}
</style>
