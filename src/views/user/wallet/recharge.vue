<template>
  <x-page :no-footer="true" headerBgColor="linear-gradient(180deg, #EB602D 0%, #EB602D 160%)">
    <template #title>{{ $t('rechargeModule.titleName') }}</template>

    <!-- 选择充值钱包信息 -->
    <div class="search">
      <div class="card-view">
        <div class="background-bg"></div>
        <div class="card-bg">
          <div class="info-view">
            <div class="text-view">
              <div class="balance-text">{{ $t('rechargeModule.CurrentBalance') }}</div>
              <div class="picker" @click="conf.modalName = 'coinType'">
                <span>{{ conf.infoObj.coinCode ? conf.infoObj.coinCode : '' }}</span>
                <div class="icon"></div>
              </div>
            </div>
            <div class="text2-view">
              <div>
                <span class="money-text">
                  {{
                    conf.infoObj.coinSymbol
                      ? conf.infoObj.coinSymbol == 'USDT'
                        ? conf.infoObj.coinSymbol + ' ' + conf.formatNumberToFixed2(conf.infoObj.walletMoney)
                        : conf.infoObj.coinSymbol + conf.formatNumberToFixed2(conf.infoObj.walletMoney)
                      : ''
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div :style="{ height: conf.serviceHeiht + 'px' }" class="bottom-view">
      <div class="recharge-view">
        <div :style="{ height: conf.serviceHeiht + 'px', overflowY: 'auto' }" class="recharge-info">
          <!-- 支付方式title -->
          <div class="title-view">
            <span>{{ $t('rechargeModule.RechargeMethod') }}</span>
          </div>
          <!-- 选择支付方式 -->
          <div style="overflow-x: auto">
            <div class="select-payment-view">
              <div
                v-for="(item, itemIndex) in conf.paymentMethodsList"
                :key="itemIndex"
                class="select-payment-text"
                @click="conf.handelChangePaymentMethod(item)"
                :class="item.isClicked ? 'actPaymentMethod' : ''"
              >
                <span>{{ item.payMethodName }}</span>
              </div>
            </div>
          </div>
          <x-no-data v-if="!conf.payMentLoading && !conf.paymentList.length"/>
          <div v-else>
            <!-- 支付方式 == ONLINE => 选择厂商 -->
            <template v-if="conf.formData.payMethodCode == 'ONLINE_PAYMENT'">
              <div class="title-view">{{ $t('rechargeModule.selectPaymentVendor') }}</div>
              <div class="payment-view" @click="conf.handleOpenModal('PaymentVendorModal')">
                <div class="left-view">
                  <template v-if="!conf.selectPaymentVendorInfo.appShowName">
                    <span class="select-tip">{{ $t('rechargeModule.PleaceSelect') }}</span>
                  </template>
                  <template v-else>
                    <img class="avatar" :src="conf.selectPaymentVendorInfo.imgUrl" />
                    <span>{{ conf.selectPaymentVendorInfo.appShowName || '' }}</span>
                  </template>
                </div>
                <div class="right-view">
                  <van-icon class="cuIcon-right" name="arrow" />
                </div>
              </div>
            </template>

            <!-- 选择通道 -->
            <div class="title-view">{{ $t('rechargeModule.card') }}</div>
            <div class="payment-view" @click="conf.handleOpenModal('PaymentChannel')">
              <div class="left-view">
                <template v-if="!conf.selectPaymentChannelInfo.appShowName">
                  <span class="select-tip">{{ $t('rechargeModule.PleaceSelect') }}</span>
                </template>
                <template v-else>
                  <img class="avatar" :src="conf.selectPaymentChannelInfo.imgUrl" />
                  <span>{{ conf.selectPaymentChannelInfo.appShowName || '' }}</span>
                </template>
              </div>
              <div class="right-view">
                <van-icon class="cuIcon-right" name="arrow" />
              </div>
            </div>

            <!-- 充值方式 == Bank => 相关信息 -->
            <template v-if="conf.formData.payMethodCode == 'BANK_CARD_PAYMENT' && conf.bankCardInfo.bankCardNum">
              <div class="form-box">
                <div class="form-model">
                  <span>{{ $t('rechargeModule.BankCardName') }}</span>
                  <div class="definition-view">
                    <input
                      class="uni-input fontsize"
                      type="text"
                      v-model="conf.bankCardInfo.bankCardUserName"
                      disabled
                    />
                    <span class="copy-btn" @click="conf.handleCopyCode(conf.bankCardInfo.bankCardUserName)">
                      {{ $t('consumptionDetails.Copy') }}
                    </span>
                  </div>
                </div>
                <div class="form-model">
                  <span>{{ $t('rechargeModule.BankCardNumber') }}</span>
                  <div class="definition-view">
                    <input class="uni-input fontsize" type="text" v-model="conf.bankCardInfo.bankCardNum" disabled />
                    <span class="copy-btn" @click="conf.handleCopyCode(conf.bankCardInfo.bankCardNum)">
                      {{ $t('consumptionDetails.Copy') }}
                    </span>
                  </div>
                </div>
                <div class="form-model">
                  <span>{{ $t('rechargeModule.IFSC') }}</span>
                  <div class="definition-view">
                    <input class="uni-input fontsize" type="text" v-model="conf.bankCardInfo.bankBranch" disabled />
                    <span class="copy-btn" @click="conf.handleCopyCode(conf.bankCardInfo.bankBranch)">
                      {{ $t('consumptionDetails.Copy') }}
                    </span>
                  </div>
                </div>
              </div>
            </template>

            <!-- 充值方式 == SCAN_CODE => 相关信息 -->
            <template v-if="conf.formData.payMethodCode == 'SCAN_CODE_PAYMENT' && conf.scanCodeInfo.scanCodePayImgUrl">
              <div class="qrCode-view">
                <img :src="conf.scanCodeInfo.scanCodePayImgUrl" class="qrCode-img" />
                <div class="qrCode-info">
                  <span>{{ conf.scanCodeInfo.scanCodePayAccount }}</span>
                  <span class="copy-btn" @click="conf.handleCopyCode(conf.scanCodeInfo.scanCodePayAccount)">
                    {{ $t('consumptionDetails.Copy') }}
                  </span>
                </div>
              </div>
            </template>

            <!-- 充值方式 == USDT => 相关信息 -->
            <template v-if="conf.formData.payMethodCode == 'USDT_PAYMENT' && conf.qrCodeObj.USDTPayUrl">
              <div class="qrCode-view">
                <div
                  style="padding: 20rem; background-color: #f9f9f9; border-radius: 10rem; width: 340rem; margin: 0 auto"
                >
                  <qrcode-vue class="image" :value="conf.qrcode" :size="conf.size" />
                </div>
                <div class="qrCode-info">
                  <span>{{ conf.qrCodeObj.USDTPayUrl }}</span>
                  <span class="copy-btn" @click="conf.handleCopyCode(conf.qrCodeObj.USDTPayUrl)">
                    {{ $t('consumptionDetails.Copy') }}
                  </span>
                </div>
              </div>
            </template>

            <!-- 充值金额title -->
            <div class="title-view">
              <span>{{ $t('rechargeModule.PleaceSelectAmount') }}</span>
            </div>
            <!-- 充值金额输入框 -->
            <div class="definition-view" v-if="conf.formData.payMethodCode != 'USDT_PAYMENT'">
              <input
                class="uni-input"
                inputmode="decimal"
                :placeholder="$t('rechargeModule.PleaseEnter')"
                v-model="conf.formData.rechargeAmount"
                @input="conf.vfFun($event, 'rechargeAmount')"
                @focus="conf.handleInputFocus"
                :disabled="conf.isInputDisabled"
              />
            </div>
            <!-- USDT -->
            <div class="definition-view USDT" v-else>
              <input
                class="uni-input"
                inputmode="decimal"
                :placeholder="$t('rechargeModule.PleaseEnter')"
                v-model="conf.formData.rechargeAmount"
                @input="conf.vfFun($event, 'rechargeAmount')"
                @focus="conf.handleInputFocus"
                :disabled="conf.isInputDisabled"
              />
              <div class="rig" v-if="conf.formData.rechargeAmount">{{ conf.exchangeRateNum }}</div>
            </div>
            <!-- 充值最下金额、最大金额提示语-->
            <div
              v-if="conf.defaultAmountList.length > 0"
              style="margin: 20rem 0rem 0rem 0rem; font-size: 26rem; font-size: 24rem; color: #999999"
            >
              {{ $t('rechargeModule.min') }}
              <span style="color: #fe7501">{{ ' ' + conf.infoObj.coinSymbol + conf.rechargeMinVal + ' ' }}</span>
              {{ $t('rechargeModule.max') }}
              <span style="color: #fe7501">{{ ' ' + conf.infoObj.coinSymbol + conf.rechargeMaxVal + ' ' }}</span>
            </div>

            <!-- 快捷金额列表数据 -->
            <div
              class="winning-box"
              scroll-y="true"
              style="width: 100%; height: auto"
              v-if="conf.defaultAmountList.length > 0"
            >
              <div class="order-box">
                <div
                  class="other-item"
                  v-for="(item, itemIndex) in conf.defaultAmountList"
                  :key="itemIndex"
                  :class="item.isClick ? 'actPaymentMethod' : ''"
                  @click="conf.handleClickRechargeAmount(item)"
                >
                  <div class="item-title">
                    <span>{{ item.money }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 信息表单 -->
            <div class="form-box">
              <!-- 支付方式  == ONLINE => 选择通道信息 -->
              <template v-if="conf.formData.payMethodCode == 'ONLINE_PAYMENT'">
                <div class="form-model" v-for="(item, itemIndex) in conf.selectPaymentChannelInfo.bindParam">
                  <template v-if="item.required">
                    <span>{{ item.label }}</span>
                    <div class="definition-view">
                      <input class="uni-input fontsize" type="text" placeholder="Please enter" v-model="item.value" />
                    </div>
                  </template>
                </div>
              </template>
              <!-- 支付方式 != ONLINE => 选择通道信息 -->
              <template v-else>
                <div class="form-model">
                  <span>{{ $t('rechargeModule.PaymentInformation') }}</span>
                  <div class="definition-view">
                    <input
                      class="uni-input fontsize"
                      type="text"
                      :placeholder="
                        conf.formData.payMethodCode == 'USDT_PAYMENT'
                          ? $t('rechargeModule.txidTip')
                          : $t('rechargeModule.userName')
                      "
                      v-model="conf.formData.userName"
                    />
                  </div>
                </div>
              </template>

              <div class="form-model">
                <span>{{ $t('rechargeModule.PaymentNote') }}</span>
                <div class="definition-view">
                  <input
                    class="uni-input fontsize"
                    type="text"
                    :placeholder="$t('rechargeModule.userRemark')"
                    v-model="conf.formData.remark"
                  />
                </div>
              </div>
            </div>

            <!-- 提交btn -->
            <div class="btn-box">
              <div @click.stop="conf.handleDataSubmit" class="submitBtn">
                {{ $t('agencyCenterModule.determine') }}
              </div>
            </div>
            <div style="height: 0rem; color: transparent"></div>
          </div>
        </div>
      </div>
    </div>

    <!--模态框-->
    <van-popup class="popup-bottom-center" v-model:show="conf.modalShow" round position="bottom">
      <div class="cu-bar bg-white justify-end">
        <div class="content">
          {{ $t('rechargeModule.Select') }}
        </div>
        <div class="close-icon" @click.stop="conf.hideModal">×</div>
      </div>

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
            <div>{{ scope.coinCode }}</div>
          </template>
        </van-picker>
        <div class="act-view-bottom">
          <button class="left-btn" @click="conf.modalName = null">{{ $t('rechargeModule.cancellation') }}</button>
          <button class="right-btn" @click="conf.onClickConfirmUnit">{{ $t('rechargeModule.determine') }}</button>
        </div>
      </template>

      <!-- 选择支付厂商模态框 -->
      <template v-if="conf.modalName == 'PaymentVendorModal'">
        <div class="modal-winning-box" scroll-y="true" style="width: 100%; height: auto">
          <div
            class="winning-item"
            v-for="(item, itemIndex) in conf.paymentVendorList"
            :key="itemIndex"
            @click="conf.handleSelectModal('vendor', item)"
          >
            <div class="left-view">
              <img class="avatar" :src="item.imgUrl" />
              <span>{{ item.appShowName }}</span>
            </div>
            <div class="right-view">
              <van-radio-group
                :model-value="conf.paymentVendorList.find((v: any) => v.isChecked)?.payPlatformCode"
                checked-color="#28C445"
              >
                <van-radio :name="item.payPlatformCode" />
              </van-radio-group>
            </div>
          </div>
        </div>
        <x-no-data v-if="conf.paymentVendorList.length == 0" :top="0"></x-no-data>
      </template>

      <!-- 选择支付通道模态框 -->
      <template v-if="conf.modalName == 'PaymentChannel'">
        <div class="modal-winning-box" scroll-y="true" style="width: 100%; height: auto">
          <div
            class="winning-item"
            v-for="(item, itemIndex) in conf.paymentChannelList"
            :key="itemIndex"
            @click="conf.handleSelectModal('channel', item)"
          >
            <div class="left-view">
              <img class="avatar" :src="item.imgUrl" />
              <span>{{ item.appShowName }}</span>
            </div>
            <div class="right-view">
              <van-radio-group
                :model-value="conf.paymentChannelList.find((v: any) => v.isChecked)?.payChannelId"
                checked-color="#28C445"
              >
                <van-radio :name="item.payChannelId" />
              </van-radio-group>
            </div>
          </div>
        </div>
        <x-no-data v-if="conf.paymentChannelList.length == 0" :top="0"></x-no-data>
      </template>
    </van-popup>

    <!-- 进入第三方充值弹窗提示 -->
    <div v-if="conf.isOpenDialog">
      <div class="popup-mask"></div>
      <div class="popup">
        <div class="popup-content">
          <div class="popup-title">
            <span>{{ $t('rechargeModule.other') }}</span>
          </div>
          <div class="bet-type">
            <span>{{ $t('rechargeModule.intoOtherTip') }}</span>
          </div>
          <div class="select-box">
            <div class="bet-btn">
              <span class="left-btn" @click.stop="conf.handleDialogBtns('confirm')">{{ $t('wallet.correct') }}</span>
              <span class="right-btn" @click.stop="conf.handleDialogBtns('cancel')">{{ $t('wallet.deny') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'
import { index } from './recharge'

const conf = index()
</script>

<style scoped lang="less">
.card-view {
  width: 100%;
  background: linear-gradient(180deg, #eb602d 0%, #ffdebe 160%);
  padding: 30rem;
  position: relative;

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

.search {
  height: 300rem;
}

.bottom-view {
  // width: 100%;
  position: relative;

  .recharge-view {
    width: 100%;
    height: calc(100% + 70rem);
    background: #fff;
    border-radius: 50rem 50rem 0rem 0rem;
    position: absolute;
    top: -70rem;
    padding: 30rem;
    font-weight: 500;
    z-index: 999;

    .title-view {
      color: #000000;
      font-size: 28rem;
      margin-top: 30rem;
    }

    .type-view {
      margin-top: 30rem;
      margin-bottom: 10rem;
      height: 56rem;
      line-height: 56rem;
      display: flex;
      font-weight: 500;

      .type-text-left,
      .type-text-right {
        padding: 0rem 20rem;
        background: #999999;
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
        padding: 0rem 20rem;
        background: #f9f9f9;
        color: #000000;
        font-size: 28rem;
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
      border-bottom: 2rem solid #f9fafc;

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
          color: #000;
        }
      }
    }

    .uni-input-placeholder {
      font-size: 26rem !important;
    }

    .definition-view {
      margin-top: 30rem;
      padding: 0rem 20rem;
      background: #f5f5fa;
      border-radius: 20rem;
      height: 92rem;
      line-height: 92rem;
      position: relative;

      .copy-btn {
        position: absolute;
        right: 20rem;
        top: 0rem;
        background: linear-gradient(#eb602d, #ffa64f) !important;
        background-clip: text !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
      }

      .uni-input {
        width: 100%;
        height: 92rem;
        line-height: 92rem;
        font-size: 28rem;
        font-weight: 500;
        color: #000000;

        &::placeholder {
          color: #00000060;
        }
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
      width: calc((100% - 72rem) / 4);
      height: 102rem;
      // padding: 24rem 0rem 22rem;
      display: flex;
      flex-direction: column;
      // justify-content: space-between;
      justify-content: center;
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
        margin-top: 10rem;
      }
    }
  }

  .order-box > :nth-child(4),
  .order-box > :nth-child(8) {
    margin: 0;
  }
}

.modal-winning-box {
  margin-top: 30rem;
  max-height: 35vh;

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

// 弹窗样式
.cu-dialog {
  position: absolute !important;
  left: 0rem !important;
  bottom: 0rem !important;
  width: 100% !important;
  height: auto !important;
  border-radius: 20rem 20rem 0rem 0rem !important;
  background: #fff;

  .top-content {
    padding: 10rem 50rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 96rem;
    border-bottom: 2rem solid #f6f7fa;
    margin-bottom: 30rem;

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

      .avatar {
        width: 72rem;
        height: 72rem;
        margin: 0rem 10rem;
        border-radius: 50%;
      }

      .userName {
        color: #000000;

        .top {
          font-size: 32rem;
          opacity: 0.7;
        }

        .vip-view {
          font-size: 20rem;
          font-weight: 400;
          color: #fff !important;
        }
      }
    }

    .right-view {
      text-align: right;
      margin-right: 20rem;

      .green {
        width: 20rem;
        height: 20rem;
        background: green;
        border-radius: 50%;
      }

      .gray {
        width: 20rem;
        height: 20rem;
        background: gray;
        border-radius: 50%;
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

  .labl-view {
    text-align: left;
    padding: 10rem 50rem;
    color: #3a3a3a;
    font-size: 28rem;
    font-weight: 500;

    .label-text {
      margin-right: 10rem;
    }
  }

  .btn-view {
    margin: 20rem 30rem;
    width: calc(100% - 60rem);
    background: linear-gradient(180deg, #eb602d 0%, #ffa64f 160%);
    border-radius: 50rem;
    text-align: center;
    color: #fff;
    font-weight: 500;
    font-size: 40rem;
    height: 100rem;
    line-height: 100rem;
  }
}

.cu-bar {
  min-height: 110rem;
  display: flex;
  align-items: center;
  position: relative;
}

.cu-bar .content {
  width: 100% !important;
  color: #000000;
  font-size: 40rem;
  font-weight: 600;
  opacity: 0.7;
  text-align: center;
}

.close-icon {
  position: absolute;
  right: 20rem;
  top: 50%;
  transform: translateY(-50%);
  color: #bbbbc5;
  font-size: 54rem;
}

.text-red {
  color: #000000 !important;
  font-weight: 500;
}

.actPayment {
  background: #ffa64f !important;
  color: #fff !important;
}

.actPaymentMethod {
  background: #ffa64f !important;
  color: #ffffff !important;

  .item-title {
    color: #ffffff !important;
  }
}

.uni-input-placeholder {
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
    background-color: #f17638;
    color: #fff;
    border-radius: 80rem;
    font-size: 26rem;
    font-weight: 600;
    height: 52rem;
    line-height: 52rem;
    padding: 0 28rem;
    margin-left: auto;
    margin-right: auto;
  }

  .left-btn {
    background-color: #fff2df;
    color: #000000;
    opacity: 0.7;
  }

  .right-btn {
    background-color: #eb602d;
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

.cu-modal {
  width: 100%;
  max-width: 750rem;
  margin: 0 auto;
}

.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0rem;
  z-index: 9996;
  background: rgba(0, 0, 0, 0.5);
  max-width: 750rem;
  margin: 0 auto;
}

.popup {
  position: fixed;
  z-index: 9998;
  bottom: 0rem;
  width: 100%;
  max-width: 750rem;
  margin: 0 auto;

  .popup-content {
    border-radius: 16rem 16rem 0rem 0rem;
    background: #fff;
    padding-bottom: 40rem;

    .popup-title {
      padding: 40rem 40rem 0rem;
      color: rgb(37, 37, 41);
      font-size: 28rem;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .close-img {
        width: 48rem;
        height: 48rem;
      }
    }

    .bet-type {
      padding: 24rem;
      background: #fffef8;
      display: flex;
      justify-content: center;
      font-weight: bold;
    }

    .select-box {
      .bet-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 30rem;
      }

      .left-btn {
        padding: 10rem 50rem;
        background: #dca45b;
        border-radius: 20rem;
        margin-right: 100rem;
        color: #fff;
      }

      .right-btn {
        padding: 10rem 50rem;
        background: #fff;
        border-radius: 20rem;
        margin-right: 10rem;
        border: 1rem solid #333;
      }
    }
  }
}

.form-box {
  font-size: 28rem;
  margin-top: 30rem;

  .form-model {
    margin-bottom: 28rem;
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

.qrCode-view {
  text-align: center;
  padding: 30rem 0rem;

  .qrCode-img {
    width: 340rem;
    height: 340rem;
    padding: 20rem;
    background-color: #f9f9f9;
    border-radius: 10rem;
  }

  .copy-btn {
    margin-left: 20rem;
    background: linear-gradient(#eb602d, #ffa64f) !important;
    background-clip: text;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
  }
}
.not-method {
  margin-top: 140rem;
  text-align: center;
  color: #fe7501;
  display: flex;
  flex-direction: column;
  align-items: center;
  img {
    height: 320rem;
    margin-bottom: 10rem;
  }
}

:deep(.van-picker-column__item--selected) {
  background-color: #fffbf5;
}
</style>
