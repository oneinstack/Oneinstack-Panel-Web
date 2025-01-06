<script setup lang="ts">
import sutil from '@/sstore/sutil'
import { index } from './withDraw'

const conf = index()
</script>

<template>
  <x-page headerBgColor="transparent" :topfill="false" no-footer>
    <!-- <x-page no-footer headerBgColor="linear-gradient(rgb(235, 96, 45) 0%, rgb(235, 96, 45) 160%)"> -->
    <template #title>{{ $t('WithdrawModule.titleName') }}</template>
    <div class="col column fit">
      <div class="search">
        <x-statusbar header />
        <!-- 选择充值钱包信息 -->
        <div class="card-view">
          <div class="background-bg"></div>
          <div class="card-bg">
            <div class="info-view">
              <div class="text-view">
                <span class="balance-text">{{ $t('rechargeModule.CurrentBalance') }}</span>
                <div class="picker" @click="conf.modalName = 'coinType'">
                  <span>{{ conf.infoObj.coinCode ? conf.infoObj.coinCode : '--' }}</span>
                  <div class="icon"></div>
                </div>
              </div>
              <div class="text2-view">
                <div>
                  <span class="money-text">
                    {{
                      conf.infoObj.coinSymbol
                        ? conf.infoObj.coinSymbol + sutil.dataHandling(conf.infoObj.walletMoney)
                        : ''
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col relative" style="margin-top: -140rem">
        <div class="absolute fit">
          <div class="bottom-view">
            <div class="recharge-view">
              <div class="recharge-info">
                <!-- 选择支付方式 -->
                <div class="title-view">
                  <span>{{ $t('WithdrawModule.withdrawMethod') }}</span>
                </div>
                <div style="overflow-x: auto">
                  <div class="select-payment-view">
                    <div v-if="conf.paymentMethodsList.length == 0" class="remaining-coding">
                      {{ $t('wallet.noPaymentMethods') }}
                    </div>
                    <div
                      v-for="(item, itemIndex) in conf.paymentMethodsList"
                      :key="itemIndex"
                      class="select-payment-text"
                      @click="conf.handelChangePaymentMethod(item)"
                      :class="item.isClicked ? 'actPaymentMethod' : ''"
                      v-else
                    >
                      <span class="methods-item">{{ item.payMethodType }}</span>
                    </div>
                  </div>
                </div>

                <!-- 选择支付通道 -->
                <div class="payment-title">{{ $t('rechargeModule.card') }}</div>
                <div class="payment-view" @click="conf.handleOpenModal('seleceChannel')">
                  <div class="left-view">
                    <template v-if="conf.selectChannelInfo.payDataType">
                      <!-- payDataType => SCAN_CODE_PAYMENT -->
                      <template v-if="conf.selectChannelInfo.payDataType == 'SCAN_CODE_PAYMENT'">
                        <img class="avatar" :src="conf.selectChannelInfo.paymentData.paymentImgUrl" />
                        <span>{{ conf.selectChannelInfo.paymentData.paymentName || '' }}</span>
                      </template>
                      <!-- payDataType => ONLINE_PAYMENT -->
                      <template v-if="conf.selectChannelInfo.payDataType == 'ONLINE_PAYMENT'">
                        <img class="avatar" :src="conf.selectChannelInfo.bankIcon" />
                        <span>{{ conf.selectChannelInfo.paymentData.onlinePayName || '' }}</span>
                      </template>
                      <!-- payDataType => BANK_CARD_PAYMENT -->
                      <template v-if="conf.selectChannelInfo.payDataType == 'BANK_CARD_PAYMENT'">
                        <img class="avatar" :src="conf.selectChannelInfo.bankIcon" />
                        <span>
                          {{
                            conf.selectChannelInfo.bankName +
                              '(' +
                              conf.selectChannelInfo.paymentData.newBankCardNum +
                              ')' || ''
                          }}
                        </span>
                      </template>
                      <!-- payDataType => USDT_PAYMENT -->
                      <template v-if="conf.selectChannelInfo.payDataType == 'USDT_PAYMENT'">
                        <img class="avatar" :src="conf.selectChannelInfo.bankIcon" />
                        <span>{{ conf.selectChannelInfo.paymentData.USDTAgreement || '' }}</span>
                      </template>
                    </template>
                    <template v-else>
                      <span class="select-tip">{{ $t('rechargeModule.PleaceSelect') }}</span>
                    </template>
                  </div>
                  <div class="right-view">
                    <van-icon name="arrow" class="cuIcon-right"></van-icon>
                  </div>
                </div>
                <!-- 提现金额 -->
                <div class="title-view">
                  <span>{{ $t('WithdrawModule.PleaceSelectAmount') }}</span>
                </div>
                <!-- 提现金额输入框 -->
                <div class="definition-view" v-if="conf.payMethodCode != 'USDT_PAYMENT'">
                  <input
                    class="uni-input"
                    inputmode="decimal"
                    :placeholder="$t('rechargeModule.PleaseEnter')"
                    v-model="conf.formData.inputValue"
                    @input="conf.vfFun($event, 'inputValue')"
                  />
                </div>
                <div class="definition-view USDT" v-else>
                  <input
                    class="uni-input"
                    inputmode="decimal"
                    :placeholder="$t('rechargeModule.PleaseEnter')"
                    v-model="conf.formData.inputValue"
                    @input="conf.vfFun($event, 'inputValue')"
                  />
                  <div class="rig" v-if="conf.formData.inputValue">{{ conf.exchangeRateNum }}</div>
                </div>

                <div class="definition-info">
                  <!-- 服务费提示 -->
                  <div class="row justify-between items-center no-wrap">
                    <div class="row items-center">
                      {{ $t('rechargeModule.ServiceCharge') }}
                      <span class="service-text">{{ conf.formData.service || ' -- ' }}</span>
                    </div>
                    <!-- 汇兑手续费提示 -->
                    <div
                      v-if="
                        conf.choosePaymentItem &&
                        conf.choosePaymentItem.payMethodType === 'USDT' &&
                        conf.infoObj &&
                        conf.infoObj.coinCode !== 'USDT'
                      "
                      class="row items-center"
                    >
                      {{ $t('rechargeModule.ExchangeCharge') }}
                      <span class="service-text">{{ conf.formData.ExchangeCharge || ' -- ' }}</span>
                    </div>
                  </div>
                  <!-- 剩余打码量提示 -->
                  <div class="remaining-coding" v-if="conf.remainingCoding > 0">
                    <div>
                      {{ $t('WithdrawModule.remainingCodingTip') + ' :' }}
                      <span class="service-text">
                        {{ conf.infoObj.coinSymbol + conf.currentCoinRemainingCoding || ' -- ' }}
                      </span>
                    </div>
                  </div>
                </div>
                <!-- 最小提现金额、最大提现金额提示 -->
                <div
                  v-if="conf.minVal && conf.maxVal"
                  style="margin: 20rem 0 30rem; font-size: 26rem; font-size: 24rem; color: #999999"
                >
                  {{ $t('rechargeModule.min') }}
                  <span class="min-money">
                    {{
                      ' ' +
                      (conf.infoObj.coinSymbol == 'USDT' ? conf.infoObj.coinSymbol + ' ' : conf.infoObj.coinSymbol) +
                      conf.minVal +
                      ' '
                    }}
                  </span>
                  ,
                  {{ $t('rechargeModule.max') }}
                  <span class="min-money">
                    {{
                      ' ' +
                      (conf.infoObj.coinSymbol == 'USDT' ? conf.infoObj.coinSymbol + ' ' : conf.infoObj.coinSymbol) +
                      conf.maxVal +
                      ' '
                    }}
                  </span>
                </div>

                <!-- 提交btn -->
                <div class="btn-box">
                  <span
                    @click.stop="conf.handleDataSubmit"
                    class="submitBtn"
                    v-if="conf.formData.inputValue && conf.remainingCoding <= 0 && conf.usertype != 3"
                  >
                    {{ $t('agencyCenterModule.determine') }}
                  </span>
                </div>
                <div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!--模态框-->
    <van-popup
      :show="!!conf.modalName"
      round
      position="bottom"
      class="cu-modal-x popup-bottom-center"
      closeable
      @close="conf.hideModal"
    >
      <div class="cu-dialog-x">
        <div class="title">
          {{ $t('rechargeModule.Select') }}
        </div>
        <!-- 选择支付通道模态框 -->
        <template v-if="conf.modalName == 'seleceChannel'">
          <div class="modal-winning-box" scroll-y="true" style="width: 100%; height: auto">
            <div
              class="winning-item"
              v-for="(item, itemIndex) in conf.paymentChannelList"
              :key="itemIndex"
              @click="conf.handleSelectChannel(item)"
              :class="item.isChecked ? 'select-item' : ''"
            >
              <!-- payDataType => SCAN_CODE_PAYMENT -->
              <div class="left-view" v-if="item.payDataType == 'SCAN_CODE_PAYMENT'">
                <img class="avatar" :src="item.paymentData.paymentImgUrl" />
                <span>{{ item.paymentData.paymentName }}</span>
              </div>
              <!-- payDataType => ONLINE_PAYMENT -->
              <div class="left-view" v-if="item.payDataType == 'ONLINE_PAYMENT'">
                <img class="avatar" :src="item.bankIcon" />
                <span>{{ item.paymentData.onlinePayName }}</span>
              </div>
              <!-- payDataType => BANK_CARD_PAYMENT -->
              <div class="left-view" v-if="item.payDataType == 'BANK_CARD_PAYMENT'">
                <img class="avatar" :src="item.bankIcon" />
                <span>{{ item.bankName + '(' + item.paymentData.newBankCardNum + ')' }}</span>
              </div>
              <!-- payDataType => USDT_PAYMENT -->
              <div class="left-view" v-if="item.payDataType == 'USDT_PAYMENT'">
                <img class="avatar" :src="item.bankIcon" />
                <span>{{ item.paymentData.USDTAgreement }}</span>
              </div>
              <div class="right-view">
                <van-radio-group :model-value="item.isChecked ? item.value : ''">
                  <van-radio :value="item.value" checked-color="#28C445" />
                </van-radio-group>
              </div>
            </div>
          </div>
          <x-no-data v-if="conf.paymentChannelList.length == 0"></x-no-data>
        </template>

        <!-- 选择currency模态框 -->
        <template v-if="conf.modalName == 'coinType'">
          <van-picker
            v-model="conf.valueArr"
            :columns-field-names="{
              text: 'coinCode',
              value: 'coinCode'
            }"
            :show-toolbar="false"
            :columns="conf.rechargeWalletList"
            @scroll-into="conf.rechargeWalletPickerChange"
          >
            <template #option="scope">
              <div class="item">
                {{ scope.walletCoin }}
              </div>
            </template>
          </van-picker>
          <div class="act-view-bottom">
            <button class="left-btn" @click="conf.modalName = undefined">
              {{ $t('rechargeModule.cancellation') }}
            </button>
            <button class="right-btn" @click="conf.handleSelectWalletConfirm">
              {{ $t('rechargeModule.determine') }}
            </button>
          </div>
        </template>
      </div>
    </van-popup>
  </x-page>
</template>

<style scoped lang="less">
.search {
  height: 496rem;
  background: linear-gradient(#336cff 0%, #336cfffc 51%, rgba(255, 166, 79, 0) 100%);
}

.cu-dialog-x {
  .title {
    width: 100% !important;
    color: #000000;
    font-size: 22px;
    font-weight: 600;
    opacity: 0.7;
    height: 100rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.status-view {
  display: flex;
  justify-content: space-between;

  .status-item {
    height: 52rem;
    line-height: 52rem;
    width: 164rem;
    background: #f9f9f9;
    color: #000000;
    text-align: center;
    line-height: 52rem;
    font-size: 28rem;
    border-radius: 10rem;

    .checked {
      border-radius: 5px;
      background: #fff6e6;
    }
  }
}

.cu-form-group {
  min-height: 80rem !important;
  background-color: #eeeeee !important;
  margin-bottom: 30rem;
  border-radius: 10rem;
  width: 100%;
}

.card-view {
  width: 100%;
  background: linear-gradient(#336cff 0%, #336cfffc 51%, rgba(255, 166, 79, 0) 100%);
  padding: 30rem;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    top: -104rem;
    right: 0;
    width: 510rem;
    height: 510rem;
    background: url('/static/theme/blue/bg-square.webp') no-repeat center center;
    background-size: cover;
    transform: rotate(-15deg);
    pointer-events: none;
  }

  .card-bg {
    width: 100%;
  }

  .info-view {
    width: 100%;
    height: 220rem;

    .text-view {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20rem;

      .balance-text {
        color: #ffffff;
        font-weight: 500;
        font-size: 26rem;
        margin-left: 30rem;
      }

      .picker {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #000000;
        font-weight: 500;
        margin-right: 10rem;
        background: #fff;
        padding: 8rem 20rem;
        border-radius: 25rem;
        z-index: 999;

        span {
          font-size: 32rem;
        }

        .icon {
          margin-left: 26rem;
          width: 0;
          height: 0;
          border-left: 10rem solid transparent;
          border-right: 10rem solid transparent;
          border-top: 18rem solid black;
        }
      }
    }

    .text2-view {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      width: calc(100% - 60rem);
      padding: 0rem 0rem 0rem 10rem;

      .money-text {
        font-size: 60rem;
        font-weight: 500;
        color: #ffffff;
        margin-left: 20rem;
      }

      .cumulative-recharge {
        // position: absolute;
        // left: 450rem;
        color: #be720f;
        font-weight: 500;
        font-size: 14rem;
      }
    }
  }
}

.bottom-view {
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 999;
  .recharge-view {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    background: #fff;
    border-radius: 50rem 50rem 0rem 0rem;
    padding: 0rem 30rem;
    font-weight: 500;
    z-index: 999;

    .title-view {
      color: #000000;
      font-size: 28rem;
      margin-top: 30rem;
    }

    .type-view {
      margin-top: 30rem;
      height: 56rem;
      line-height: 56rem;
      display: flex;
      font-weight: 500;

      .type-text-left,
      .type-text-right {
        padding: 0rem 20rem;
        background: #f9f9f9;
        color: #000000;
        font-size: 28rem;
      }

      .type-text-left {
        border-radius: 20rem 0rem 0rem 20rem;
      }

      // .type-text-right{
      // 	border-radius: 0rem 20rem 20rem 0rem;
      // }
      .type-text-right {
        border-radius: 30rem;
        margin-right: 30rem;
      }
    }

    .select-payment-view {
      margin-top: 20rem;
      display: flex;
      font-weight: 500;

      .select-payment-text {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 52rem;
        line-height: 52rem;
        padding: 0rem 20rem;
        background: #fff6e6;
        color: #999999;
        border-radius: 30rem;
        margin-right: 30rem;
        font-size: 28rem;
      }
    }

    .payment-title {
      margin-top: 30rem;
      margin-bottom: 10rem;
      font-size: 28rem;
    }

    .payment-view {
      padding: 10rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 96rem;
      border-bottom: 1px solid #f9fafc;

      // margin-bottom: 20rem;
      .left-view {
        display: flex;
        align-items: center;

        .avatar {
          width: 56rem;
          height: 56rem;
          margin-right: 8rem;
          border-radius: 50%;
        }

        .select-tip {
          color: #898585;
        }
      }

      .right-view {
        text-align: right;

        .cuIcon-right {
          font-size: 36rem;
        }
      }
    }

    .definition-view {
      margin-top: 30rem;
      padding: 0rem 20rem;
      background: #f5f5fa;
      border-radius: 20rem;
      height: 92rem;
      line-height: 92rem;
      position: relative;

      .uni-input {
        height: 92rem;
        line-height: 92rem;
        font-size: 40rem;
        font-weight: 500;
        color: #000000;
      }

      .otc-buynow-btn {
        position: absolute;
        right: 0rem;
        top: 0rem;
        height: 92rem;
        width: auto;
        background: linear-gradient(180deg, #eb602d 0%, #ffa64f 160%);
        border-radius: 20rem;
        text-align: center;
        color: #fff;
        font-weight: 500;
        font-size: 40rem;
        padding: 0rem 20rem;
      }
    }

    .USDT {
      display: flex;
      align-items: center;
      justify-content: space-between;
      .uni-input {
        width: calc(100% - 40% - 10rem);
      }
      .rig {
        width: 40%;
        color: #a4a4a4;
        text-align: right;
        font-size: 32rem;
        box-sizing: border-box;
        line-height: initial;
        white-space: normal;
        word-wrap: break-word;
      }
    }

    .definition-info {
      margin-top: 10rem;
      color: #00000060;
      display: flex;
      font-size: 500;
      flex-direction: column;

      div {
        font-size: 20rem;
      }

      .service-text {
        margin: 0rem 10rem;
        font-size: 28rem;
      }
    }
  }
}

.winning-box {
  padding-top: 20rem;
  width: 100%;
  height: 100%;
  font-weight: 500;

  .winning-item {
    margin-bottom: 20rem;
    padding: 30rem 20rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 112rem;
    background: #fff;
    border-radius: 20rem;
    color: #000000;
    background: #f9f9f9;
    width: 100%;

    .left-user {
      display: flex;
      align-items: center;
      position: relative;

      .avatar {
        width: 74rem;
        height: 74rem;
        margin-right: 20rem;
        border-radius: 50%;
      }

      .isonlion {
        position: absolute;
        top: 12rem;
        left: 62rem;
        z-index: 999;
      }

      .green {
        width: 15rem;
        height: 15rem;
        background: green;
        border-radius: 50%;
      }

      .gray {
        width: 15rem;
        height: 15rem;
        background: gray;
        border-radius: 50%;
      }

      .userName {
        font-size: 30rem;
        color: #000000;
      }
    }

    .right-money {
      text-align: center;

      .top {
        background: linear-gradient(to bottom, #eb602d, #ffa64f);
        -webkit-background-clip: text;
        /* 使用-webkit-前缀兼容部分浏览器 */
        background-clip: text;
        color: transparent;
        font-size: 32rem;
        font-weight: 600;
      }

      .bottom {
        font-size: 20rem;
        color: #000000;
        font-weight: bold;
        margin-top: 15rem;
      }
    }
  }

  .order-box {
    padding-top: 20rem;
    display: flex;
    justify-content: start;
    flex-wrap: wrap;

    .other-item {
      border-radius: 22rem;
      opacity: 0.9004;
      background: #fff1de;
      width: 31%;
      min-height: 102rem;
      padding: 24rem 0rem 22rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rem;
      color: #000000;
      background: #f9f9f9;
      margin-right: 24rem;

      .item-title {
        background: linear-gradient(to bottom, #eb602d, #ffa64f);
        -webkit-background-clip: text;
        /* 使用-webkit-前缀兼容部分浏览器 */
        background-clip: text;
        color: transparent;
        font-size: 32rem;
        font-weight: 600;
      }

      .item-score {
        font-size: 20rem;
        color: #000000;
        font-weight: bold;
        // margin: 10rem 15rem 0rem;
        text-align: center;
      }
    }
  }

  .order-box > :nth-child(3),
  .order-box > :nth-child(6),
  .order-box > :nth-child(9) {
    margin-right: 0;
  }
}

.modal-winning-box {
  margin-top: 30rem;

  .select-item {
    background: #f6f7fa !important;
  }

  .winning-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 86rem;
    line-height: 86rem;
    padding: 0rem 30rem;
    margin-bottom: 10rem;
    background-color: #fff;
    border-radius: 10rem;
    font-weight: 500;

    .left-view {
      display: flex;
      align-items: center;

      .avatar {
        width: 72rem;
        height: 72rem;
        margin-right: 10rem;
        border-radius: 50%;
      }

      span {
        font-size: 32rem;
        color: #000000;
        opacity: 0.7;
      }
    }

    .right-view {
      text-align: right;
      font-size: 28rem;
    }
  }
}

.actPayment {
  background: #ffa64f !important;
  color: #fff !important;
}

.actPaymentMethod {
  background: #e6f2ff !important;

  .methods-item,
  .item-title {
    background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    color: transparent !important;
  }
}

input::placeholder {
  font-size: 28rem !important;
  color: #00000060;
}

.act-view-bottom {
  display: flex !important;
  justify-content: space-between;
  margin-bottom: 20rem;

  .left-btn,
  .right-btn {
    text-align: center;
    border-radius: 80rem;
    font-size: 26rem;
    font-weight: 600;
    height: 52rem;
    line-height: 52rem;
    padding: 0rem 20rem;
    margin: 0 auto;
  }

  .left-btn {
    background-color: #f6f7fa;
    color: #000000;
    opacity: 0.7;
  }

  .right-btn {
    background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
    color: #fff;
  }
}

.uni-picker-view-indicator {
  height: 80rem;
  line-height: 80rem;
}

.uni-picker-view-indicator:before,
.uni-picker-view-indicator:after,
uni-button:after {
  border: none !important;
}

.remaining-coding {
  margin-top: 16rem;
  display: flex;
  font-size: 500;
  font-size: 30rem !important;

  div {
    font-size: 26rem !important;
  }

  .service-text {
    font-size: 26rem !important;
    margin: 0rem 10rem;
  }
}

.btn-box {
  height: 200rem;
  background: #fff;
  display: flex;
  align-items: center;

  .submitBtn {
    // position: absolute;
    // right: 0rem;
    // top: 0rem;
    margin: auto;
    height: 92rem;
    line-height: 92rem;
    width: 100%;
    background: linear-gradient(180deg, #eb602d 0%, #ffa64f 160%);
    border-radius: 50rem;
    text-align: center;
    color: #fff;
    font-weight: 500;
    font-size: 40rem;
    padding: 0rem 20rem;
    margin: 20rem 0;
  }
}

:deep(.van-picker-column__item--selected) {
  background: #f6f7fa;
}

.min-money,
.remaining-coding {
  background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%) !important;
  background-clip: text;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}

:deep(.van-radio__icon--checked .van-icon) {
  border-color: #1989fa !important;
  background-color: #1989fa !important;
}
</style>
