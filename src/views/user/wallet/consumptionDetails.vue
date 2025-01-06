<template>
  <x-page :no-footer="true">
    <template #title>
      {{ $t('consumptionDetails.titleName') }}
    </template>
    <!-- content -->
    <div class="content-div">
      <div class="top-content">
        <div class="type-div">
          <div class="type-name">
            {{ conf.divInfo.tradeTypeName || ''
            }}{{ conf.divInfo.firstRecharge == 1 ? ' (' + $t('wallet.FirstRecharge') + ')' : '' }}
          </div>
          <div class="type-value" v-if="conf.divInfo.recordMark == 1">
            {{ conf.divInfo.symbol + conf.divInfo.coinSymbol + ' ' + conf.divInfo.actualMoney || '--' }}
          </div>
          <div class="type-value" v-else>
            {{
              conf.divInfo.coinSymbol == 'USDT'
                ? conf.divInfo.symbol + conf.divInfo.coinSymbol + ' ' + conf.divInfo.money
                : conf.divInfo.symbol + conf.divInfo.coinSymbol + conf.divInfo.money
            }}
          </div>
        </div>
        <div class="info-div">
          <div class="cu-form-group">
            <div class="info-title">{{ $t('consumptionDetails.TransactionStatus') }}</div>
            <span
              class="info-value"
              :class="{ 'green': conf.divInfo.tradeStatus == 1, 'red': conf.divInfo.tradeStatus == -1 }"
              style="color: #3c80f5"
            >
              {{ conf.divInfo.tradeStatusName || '--' }}
            </span>
          </div>
          <!-- 提现 -->
          <template v-if="conf.divInfo.tradeType == 2">
            <div class="cu-form-group">
              <div class="info-title">{{ $t('consumptionDetails.WithdrawalAmount') }}</div>
              <span class="info-value">
                {{
                  conf.divInfo.tradeObjPaymentInfo.payCoin == 'USDT'
                    ? sutil.numsub(conf.divInfo.money, conf.divInfo.premium) + ' ' + conf.divInfo.walletCoin
                    : conf.divInfo.changeMoney + ' ' + conf.divInfo.walletCoin
                }}
              </span>
            </div>
            <div class="cu-form-group" v-if="conf.divInfo.tradeObjPaymentInfo.payCoin == 'USDT'">
              <div class="info-title">{{ $t('consumptionDetails.actualAmount') }}</div>
              <span class="info-value">
                {{
                  conf.divInfo.tradeObjPaymentInfo.payCoin == 'USDT'
                    ? conf.divInfo.changeMoney + ' ' + 'USDT'
                    : conf.divInfo.changeMoney + ' ' + conf.divInfo.walletCoin
                }}
              </span>
            </div>
            <div class="cu-form-group">
              <div class="info-title">{{ $t('rechargeModule.ServiceCharge') }}</div>
              <span class="info-value">{{ conf.divInfo.premium + ' ' + conf.divInfo.walletCoin || '--' }}</span>
            </div>
            <!-- <div class="cu-form-group">
							<div class="info-title">{{$t('addBankCradModule.PaymentVendor')}}</div>
							<span class="info-value">{{divInfo.tradeObjPaymentInfo.platformName || '--'}}</span>
						</div>
						<div class="cu-form-group">
							<div class="info-title">{{$t('addBankCradModule.PaymentChannel')}}</div>
							<span class="info-value">{{divInfo.tradeObjPaymentInfo.appShowName || divInfo.tradeObjPaymentInfo.USDTAgreement || '--'}}</span>
						</div> -->
            <!-- 支付通道类型 -- BANK_CARD_PAYMENT -->
            <div v-if="conf.divInfo.tradeObjPaymentInfo.payDataType == 'BANK_CARD_PAYMENT'">
              <div class="cu-form-group">
                <div class="info-title">{{ $t('addBankCradModule.BankCode') }}</div>
                <span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.bankCode || '--' }}</span>
              </div>
              <div class="cu-form-group">
                <div class="info-title">{{ $t('addBankCradModule.BankNumber') }}</div>
                <span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.bankCardNum || '--' }}</span>
              </div>
              <div class="cu-form-group">
                <div class="info-title">{{ $t('addBankCradModule.AccountName') }}</div>
                <span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.bankCardUserName || '--' }}</span>
              </div>
            </div>
            <!-- 支付通道类型 -- ONLINE_PAYMENT -->
            <div v-if="conf.divInfo.tradeObjPaymentInfo.payDataType == 'ONLINE_PAYMENT'">
              <div class="cu-form-group">
                <div class="info-title">{{ $t('addBankCradModule.PaymentAddress') + '000' }}</div>
                <div class="info-value">
                  <span>{{ conf.divInfo.tradeObjPaymentInfo.newOnlinePayUrl || '--' }}</span>
                  <img
                    class="copy-img"
                    src="/static/img/copyImg.png"
                    @click="conf.handleCopyCode(conf.divInfo.tradeObjPaymentInfo.onlinePayUrl)"
                  />
                </div>
              </div>
              <div class="cu-form-group">
                <div class="info-title">{{ $t('addBankCradModule.AccountName') }}</div>
                <span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.onlinePayName || '--' }}</span>
              </div>
            </div>
            <!-- 支付通道类型 -- SCAN_CODE_PAYMENT -->
            <div v-if="conf.divInfo.tradeObjPaymentInfo.payDataType == 'SCAN_CODE_PAYMENT'">
              <div class="cu-form-group">
                <div class="info-title">{{ $t('addBankCradModule.AccountName') }}</div>
                <span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.paymentName || '--' }}</span>
              </div>
            </div>
          </template>
          <!-- 充值 -->
          <template v-if="conf.divInfo.tradeType == 1">
            <!-- <div class="cu-form-group">
							<div class="info-title">{{$t('addBankCradModule.PaymentVendor')}}</div>
							<span class="info-value">{{divInfo.tradeObjPaymentInfo.platformName || '--'}}</span>
						</div>
						<div class="cu-form-group">
							<div class="info-title">{{$t('addBankCradModule.PaymentChannel')}}</div>
							<span class="info-value">{{divInfo.tradeObjPaymentInfo.appShowName || '--'}}</span>
						</div> -->
            <div class="cu-form-group" v-if="conf.divInfo.tradeObjPaymentInfo.payDataType == 'USDT_PAYMENT'">
              <div class="info-title">{{ $t('consumptionDetails.ActualCollectionUSDT') }}</div>
              <span class="info-value">{{ conf.divInfo.changeMoney + ' USDT' || '--' }}</span>
            </div>
          </template>
          <!-- 汇率 -->
          <div class="cu-form-group" v-if="conf.divInfo.exchangeRateNum">
            <div class="info-title">{{ $t('rechargeModule.TransactionRate') }}</div>
            <span class="info-value">{{ conf.divInfo.exchangeRateNum || '--' }}</span>
          </div>
          <!-- 汇兑手续费 -->
          <div class="cu-form-group" v-if="conf.divInfo.exchangeSxf && conf.divInfo.exchangeSxf > 0">
            <div class="info-title">{{ $t('rechargeModule.ExchangeCharge') }}</div>
            <span class="info-value">{{ conf.divInfo.exchangeSxf + ' ' + conf.divInfo.walletCoin || '--' }}</span>
          </div>
          <!-- <div class="cu-form-group">
						<div class="info-title">{{$t('consumptionDetails.Coin')}}</div>
						<span class="info-value">{{divInfo.walletCoin || '--'}}</span>
					</div> -->
          <!-- 充值 -->
          <template v-if="conf.divInfo.tradeType == 1">
            <div class="cu-form-group">
              <div class="info-title">{{ $t('rechargeModule.PaymentInformation') }}</div>
              <div class="info-value">
                <span>{{ conf.divInfo.tradeObjPaymentInfo.userName || '--' }}</span>
                <img
                  class="copy-img"
                  src="/static/img/copyImg.png"
                  @click="conf.handleCopyCode(conf.divInfo.tradeObjPaymentInfo.userName)"
                />
              </div>
            </div>
            <div class="cu-form-group">
              <div class="info-title">{{ $t('rechargeModule.PaymentNote') }}</div>
              <span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.userRemark || '--' }}</span>
            </div>
          </template>
          <!--提现 -> 异常订单 -->
          <template v-if="conf.divInfo.recordMark == 1">
            <div class="cu-form-group">
              <div class="info-title">{{ $t('rechargeModule.transactionAmount') }}</div>
              <span class="info-value">{{ conf.divInfo.coinSymbol + ' ' + conf.divInfo.money || '--' }}</span>
            </div>
            <div class="cu-form-group">
              <div class="info-title">{{ $t('rechargeModule.AmountReceived') }}</div>
              <span class="info-value">{{ conf.divInfo.coinSymbol + ' ' + conf.divInfo.actualMoney || '--' }}</span>
            </div>

            <div class="cu-form-group">
              <div class="info-title">{{ $t('rechargeModule.AbnormalRemarks') }}</div>
              <span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.recordMarkNotes || '--' }}</span>
            </div>
          </template>
          <div class="cu-form-group">
            <div class="info-title">{{ $t('consumptionDetails.BilINo') }}</div>
            <span class="info-value">{{ conf.divInfo.billNo || '--' }}</span>
          </div>
          <div class="cu-form-group" v-if="conf.divInfo.remark">
            <div class="info-title">{{ $t('consumptionDetails.Remark') }}</div>
            <span class="info-value">{{ conf.divInfo.remark || '--' }}</span>
          </div>
          <div class="cu-form-group">
            <div class="info-title">{{ $t('consumptionDetails.TradeTime') }}</div>
            <span class="info-value">{{ conf.divInfo.tradeTime || '--' }}</span>
          </div>
        </div>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { index } from './consumptionDetails'
import sutil from '@/sstore/sutil'

const conf = index()
</script>

<style lang="less" scoped>
.content-div {
  height: auto;

  .top-content {
    background: #fff;
  }
}

.type-div {
  text-align: center;
  border-bottom: #dcdcdc30 2rem solid;
  padding: 50rem 0rem;
  font-size: 32rem;
  font-weight: 500;
  color: #000000;

  .type-name {
    opacity: 0.8;
  }

  .type-value {
    margin-top: 20rem;
    font-size: 48rem;
  }
}

.info-div {
  padding: 30rem;
  width: 100%;

  .cu-form-group {
    padding: 20rem;
    color: #a8a8a8;
    font-size: 32rem;
    min-height: 60rem;
    width: 100%;
    border-bottom: #dcdcdc 2rem dashed;
    align-items: self-start;

    // justify-content: flex-start !important;
    // .title {
    // 	// white-space: nowrap !important;
    // 	white-space: pre-wrap !important;
    // 	padding-right: 10rem !important;
    // 	width: 35%;
    // 	background: yellow;
    // }
    .info-title {
      // margin-left: 10rem;
      // color: #373737;
      width: 45%;
      padding-right: 10rem !important;
      // background: yellow;
      // text-align: right;
    }

    .info-value {
      margin-left: 10rem;
      color: #373737;
      width: 55%;
      // background: red;
      text-align: right;
      word-wrap: break-word !important;
    }
  }

  .cu-form-group + .cu-form-group {
    border-top: none !important;
  }
}

.service-div {
  margin-top: 20rem;
  padding: 30rem;
  background: #fff;
  color: #000000 !important;
  font-weight: 500;

  .service-name {
    font-size: 32rem;
  }

  .service-info {
    margin-top: 30rem;
    font-size: 24rem;
    color: #000000;
    opacity: 0.6;

    .cuIcon-questionfill {
      padding-right: 10rem;
      font-size: 22rem;
    }
  }
}

.blue {
  color: #3c80f5 !important;
}

.green {
  color: #2aa855 !important;
}

.red {
  color: #e20000 !important;
}

.copy-img {
  width: 28rem;
  height: 28rem;
  margin-left: 20rem;
  color: #eb602d;
}
</style>
