<script setup lang="ts">
import { index } from './addBankCard'
import stheme from '@/sstore/stheme'

const conf = index()
</script>

<template>
  <x-page bgcolor="#fff" no-footer :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>{{ conf.titleName }}</template>
    <!-- content -->
    <div class="content-view">
      <div class="input-box">
        <div class="lable">{{ $t('addBankCradModule.PaymentMethods') }}</div>
        <div class="input-view" @click="!conf.isEditPage ? conf.handleOpenMadal('payment_methods') : ''">
          <div
            class="input"
            :class="[!conf.formData.payment_methods ? 'select-value' : '', conf.isEditPage ? 'disabledView' : '']"
          >
            {{ conf.formData.payment_methods || $t('addBankCradModule.pleaseSelectPaymentMethod') }}
          </div>
          <van-icon class="cuIcon-right" name="arrow" />
        </div>
      </div>
      <div class="input-box" v-if="conf.selectMethodObj.payMethodCode != 'USDT_PAYMENT'">
        <div class="lable">{{ $t('addBankCradModule.Country') }}</div>
        <div class="input-view" @click="!conf.isEditPage ? conf.handleOpenMadal('country') : ''">
          <div
            class="input"
            :class="[!conf.formData.country ? 'select-value' : '', conf.isEditPage ? 'disabledView' : '']"
          >
            {{ conf.formData.country || $t('addBankCradModule.pleaseSelectCountry') }}
          </div>
          <van-icon class="cuIcon-right" name="arrow" />
        </div>
      </div>
      <div
        class="input-box"
        v-if="
          conf.selectMethodObj.payMethodCode != 'USDT_PAYMENT'
            ? conf.formData.country && conf.formData.payment_methods
            : conf.formData.payment_methods
        "
      >
        <div class="lable">{{ $t('addBankCradModule.AccountType') }}</div>
        <div class="input-view" @click="!conf.isEditPage ? conf.handleOpenMadal('bank_type') : ''">
          <div
            class="input"
            :class="[!conf.formData.bank_type ? 'select-value' : '', conf.isEditPage ? 'disabledView' : '']"
          >
            {{ conf.formData.bank_type || $t('addBankCradModule.pleaseSelectAccountType') }}
          </div>
          <van-icon class="cuIcon-right" name="arrow" />
        </div>
      </div>
      <!-- 支付通道类型 -- BANK_CARD_PAYMENT -->
      <div v-if="conf.selectMethodObj.payMethodCode == 'BANK_CARD_PAYMENT'">
        <div class="input-box">
          <div class="lable">{{ $t('addBankCradModule.Cardholder') }}</div>
          <div class="input-view">
            <input
              class="input"
              :class="[conf.isEditPage ? 'disabledView' : '']"
              :placeholder="$t('addBankCradModule.pleaseEnterCardholder')"
              v-model="conf.formData.bankCardUserName"
              :disabled="conf.isEditPage"
            />
            <van-icon
              v-if="conf.formData.bankCardUserName && !conf.isEditPage"
              class="clear-icon"
              name="cross"
              @click="conf.handleClearInput('bankCardUserName')"
            />
          </div>
        </div>
        <!-- 选择country => 巴西 -->
        <div v-if="conf.selectAreaCodeObj.countryCode == 'BR'">
          <div class="input-box">
            <div class="lable">{{ $t('addBankCradModule.PixAccount') }}</div>
            <div class="input-view">
              <input
                class="input"
                :placeholder="$t('addBankCradModule.PixAccountTip')"
                v-model="conf.formData.bankCardNum"
              />
              <van-icon
                v-if="conf.formData.bankCardNum"
                name="cross"
                class="clear-icon"
                @click="conf.handleClearInput('bankCardNum')"
              />
            </div>
          </div>
          <div class="input-box">
            <div class="lable">{{ $t('addBankCradModule.CPFNumber') }}</div>
            <div class="input-view">
              <input
                class="input"
                :placeholder="$t('addBankCradModule.CPFNumberTip')"
                v-model="conf.formData.bankBranch"
                maxlength="11"
              />
              <van-icon
                v-if="conf.formData.bankBranch"
                name="cross"
                class="clear-icon"
                @click="conf.handleClearInput('bankBranch')"
              />
            </div>
          </div>
          <div class="input-box" v-if="conf.selectTypeObj.payTrdType == 'PHONE'">
            <div class="lable">{{ $t('addBankCradModule.Phone') }}</div>
            <div class="input-view" style="display: flex">
              <div class="left-view">
                <div class="input1" :class="!conf.formData.area_code ? 'select-value' : ''" style="display: flex">
                  <img :src="conf.selectAreaCodeObj.flagUrl" style="width: 37rem; height: 37rem; margin-right: 15rem" />
                  {{ conf.formData.area_code ? '+' + conf.formData.area_code : '' }}
                </div>
                <!-- <van-icon class="cuIcon-right" name="arrow" /> -->
              </div>
              <div class="right-view">
                <input
                  class="input2"
                  :placeholder="$t('addBankCradModule.pleaseEnterPhone')"
                  v-model="conf.formData.mobile_phone"
                />
              </div>
            </div>
          </div>
          <div class="input-box" v-if="conf.selectTypeObj.payTrdType == 'EMAIL'">
            <div class="lable">{{ $t('login.email') }}</div>
            <div class="input-view">
              <input
                class="input"
                :placeholder="$t('addBankCradModule.pleaseEnterEmail')"
                v-model="conf.formData.email"
              />
              <van-icon
                v-if="conf.formData.email"
                name="cross"
                class="clear-icon"
                @click="conf.handleClearInput('email')"
              />
            </div>
          </div>
        </div>

        <!-- 选择country => 印度 -->
        <div v-if="conf.selectAreaCodeObj.countryCode == 'IN'">
          <div class="input-box">
            <div class="lable">{{ $t('addBankCradModule.IFSC') }}</div>
            <div class="input-view">
              <input
                class="input"
                :placeholder="$t('addBankCradModule.pleaseEnterIFSC')"
                v-model="conf.formData.bankBranch"
              />
              <van-icon
                v-if="conf.formData.bankBranch"
                name="cross"
                class="clear-icon"
                @click="conf.handleClearInput('bankBranch')"
              />
            </div>
          </div>
          <div class="input-box">
            <div class="lable">{{ $t('addBankCradModule.AccountNumber') }}</div>
            <div class="input-view">
              <input
                class="input"
                :placeholder="$t('addBankCradModule.pleaseEnterAccountNumber')"
                v-model="conf.formData.bankCardNum"
              />
              <van-icon
                v-if="conf.formData.bankCardNum"
                name="cross"
                class="clear-icon"
                @click="conf.handleClearInput('bankCardNum')"
              />
            </div>
          </div>
          <div class="input-box">
            <div class="lable">{{ $t('addBankCradModule.Phone') }}</div>
            <div class="input-view" style="display: flex">
              <div class="left-view">
                <div class="input1" :class="!conf.formData.area_code ? 'select-value' : ''" style="display: flex">
                  <img :src="conf.selectAreaCodeObj.flagUrl" style="width: 37rem; height: 37rem; margin-right: 15rem" />
                  {{ conf.formData.area_code ? '+' + conf.formData.area_code : '' }}
                </div>
                <!-- <van-icon class="cuIcon-right" name="arrow" /> -->
              </div>
              <div class="right-view">
                <input
                  class="input2"
                  :placeholder="$t('addBankCradModule.pleaseEnterPhone')"
                  v-model="conf.formData.mobile_phone"
                />
              </div>
            </div>
          </div>
          <div class="input-box">
            <div class="lable">{{ $t('login.email') }}</div>
            <div class="input-view">
              <input
                class="input"
                :placeholder="$t('addBankCradModule.pleaseEnterEmail')"
                v-model="conf.formData.email"
              />
              <van-icon
                v-if="conf.formData.email"
                name="cross"
                class="clear-icon"
                @click="conf.handleClearInput('email')"
              />
            </div>
          </div>
        </div>
        <!-- <div class="input-box">
					<div class="lable">{{$t('addBankCradModule.VerificationCode')}}</div>
					<div class="input-view">
						<input class="input" :placeholder="$t('common.PleaseEnter')" v-model="formData.verification_code"/>
						<div class="code-btn" @click="handleGetCode" v-if="Countdown == 60">{{'verify'}}</div>
						<div class="countdown" v-else>{{Countdown + 's'}}</div>
					</div>
				</div> -->
      </div>

      <!-- 支付通道类型 -- ONLINE_PAYMENT / USDT_PAYMENT -->
      <div
        v-if="
          conf.selectMethodObj.payMethodCode == 'ONLINE_PAYMENT' || conf.selectMethodObj.payMethodCode == 'USDT_PAYMENT'
        "
      >
        <div class="input-box" v-if="conf.selectMethodObj.payMethodCode == 'USDT_PAYMENT'">
          <div class="lable">{{ $t('addBankCradModule.Network') }}</div>
          <div class="input-view" @click="conf.handleOpenMadal('protocol')">
            <div class="input" :class="!conf.formData.protocol ? 'select-value' : ''">
              {{ conf.formData.protocol || $t('addBankCradModule.pleaseSelectNetwork') }}
            </div>
            <van-icon class="cuIcon-right" name="arrow" />
          </div>
        </div>
        <div class="input-box" v-else>
          <div class="lable">{{ $t('addBankCradModule.Account') }}</div>
          <div class="input-view">
            <input
              class="input"
              :placeholder="$t('addBankCradModule.pleaseEnterAccount')"
              v-model="conf.formData.onlinePayName"
            />
            <van-icon
              v-if="conf.formData.onlinePayName"
              name="cross"
              class="clear-icon"
              @click="conf.handleClearInput('onlinePayName')"
            />
          </div>
        </div>
        <div class="input-box">
          <!-- <div class="lable">{{$t('addBankCradModule.PaymentAddress')}}</div> -->
          <div class="lable">{{ $t('addBankCradModule.Address') }}</div>
          <div class="input-view">
            <input
              class="input"
              :placeholder="$t('addBankCradModule.pleaseEnterAddress')"
              v-model="conf.formData.onlinePayUrl"
            />
            <van-icon
              v-if="conf.formData.onlinePayUrl"
              name="cross"
              class="clear-icon"
              @click="conf.handleClearInput('onlinePayUrl')"
            />
          </div>
        </div>
      </div>

      <!-- 支付通道类型 -- SCAN_CODE_PAYMENT -->
      <div v-if="conf.selectMethodObj.payMethodCode == 'SCAN_CODE_PAYMENT'">
        <div class="input-box">
          <div class="lable">{{ $t('addBankCradModule.Account') }}</div>
          <div class="input-view">
            <input
              class="input"
              :placeholder="$t('addBankCradModule.pleaseEnterAccount')"
              v-model="conf.formData.scanCodePayName"
            />
            <van-icon
              v-if="conf.formData.scanCodePayName"
              name="cross"
              class="clear-icon"
              @click="conf.handleClearInput('scanCodePayName')"
            />
          </div>
        </div>
        <div class="input-box">
          <div class="lable">{{ $t('addBankCradModule.QRCode') }}</div>
          <div class="photo-view">
            <van-uploader :after-read="conf.handleSelectPhoto">
              <van-icon name="plus" size="50" color="#ccc" v-if="!conf.isShowImg" />
              <img class="img-bg" :src="conf.formData.scanCodePayImgUrl" v-else />
            </van-uploader>
          </div>
        </div>
      </div>

      <!-- btn -->
      <div class="btn-view">
        <div class="sumit-btn" @click="conf.handleDataSubmit">
          {{ conf.isEditPage ? $t('passwordModule.Change') : $t('addBankCradModule.Bind') }}
        </div>
      </div>
    </div>

    <!-- 模态框 -->
    <van-popup
      class="popup-bottom-center"
      :show="conf.modalName && conf.modalName != 'area_code'"
      closeable
      position="bottom"
      @close="conf.hideModal"
    >
      <div class="cu-bar bg-white justify-end">
        <div class="content">{{ conf.modalTitle }}</div>
      </div>
      <div class="winning-box" scroll-y="true" style="width: 100%; max-height: 700rem">
        <!-- 国家模态框 -->
        <div v-if="conf.modalName == 'country'">
          <div
            class="winning-item"
            v-for="(item, itemIndex) in conf.countryList"
            :key="itemIndex"
            @click="conf.handleModalSelect('country', item, false)"
            :class="item.isChecked ? 'active-view' : ''"
          >
            <div class="left-view" style="width: 50%">
              <span>{{ item.showName }}</span>
            </div>
            <div class="right-view" style="width: 30%">
              <span>{{ item.countryCode }}</span>
            </div>
          </div>
          <x-no-data v-if="conf.countryList.length == 0" :top="0"></x-no-data>
        </div>
        <!-- 支付方式模态框 -->
        <div v-if="conf.modalName == 'payment_methods'">
          <div
            class="winning-item"
            v-for="(item, itemIndex) in conf.menthodsList"
            :key="itemIndex"
            @click="conf.handleModalSelect('methods', item, false)"
          >
            <div class="left-view">
              <!-- <img class="avatar" :src="item.bankLogo"/> -->
              <span>{{ item.payMethodName }}</span>
            </div>
            <div class="right-view">
              <van-radio-group :model-value="item.isChecked ? item.value : ''">
                <van-radio :name="item.value" checked-color="#28C445" />
              </van-radio-group>
            </div>
          </div>
          <x-no-data v-if="conf.menthodsList.length == 0" :top="0"></x-no-data>
        </div>
        <!-- 银行类型模态框 -->
        <div v-if="conf.modalName == 'bank_type'">
          <div
            class="winning-item"
            v-for="(item, itemIndex) in conf.bankTypeList"
            :key="itemIndex"
            @click="conf.handleModalSelect('bankType', item, false)"
          >
            <div class="left-view">
              <img class="avatar" :src="item.bankIcon" />
              <span>{{ item.bankName }}</span>
            </div>
            <div class="right-view">
              <van-radio-group :model-value="item.isChecked ? item.value : ''">
                <van-radio :name="item.value" checked-color="#28C445" />
              </van-radio-group>
            </div>
          </div>
          <x-no-data v-if="conf.bankTypeList.length == 0" :top="0"></x-no-data>
        </div>
        <!-- USDT协议模态框 -->
        <div v-if="conf.modalName == 'protocol'">
          <div
            class="winning-item"
            v-for="(item, itemIndex) in conf.protocolList"
            :key="itemIndex"
            @click="conf.handleModalSelect('protocol', item, false)"
          >
            <div class="left-view">
              <span>{{ item.name }}</span>
            </div>
            <div class="right-view">
              <van-radio-group :model-value="conf.protocolList.find((v: any) => v.isChecked)?.name">
                <van-radio :name="item.name" checked-color="#28C445" />
              </van-radio-group>
            </div>
          </div>
          <x-no-data v-if="conf.protocolList.length == 0" :top="0"></x-no-data>
        </div>
      </div>
    </van-popup>
    <!-- 手机区号模态框 -->
    <van-popup :show="conf.modalName == 'area_code'" class="cu-modal bottom-modal" @close="conf.modalName == ''">
      <div class="cu-dialog">
        <div class="padding-xl" v-if="conf.areaCodeList.length > 0">
          <!-- btns -->
          <div class="model-btn">
            <div class="left-btn" @click="conf.handleAreaCodeCancel">{{ $t('agencyCenterModule.cancellation') }}</div>
            <div class="right-btn" @click="conf.handleAreaCodeConfirm">{{ $t('agencyCenterModule.determine') }}</div>
          </div>
          <!-- picker -->
          <van-picker
            :show-toolbar="false"
            :columns="conf.areaCodeList"
            @scroll-into="conf.bindChange"
            class="picker-view"
          >
            <template #option="scope">
              <div class="item">{{ scope.cnName + ' ' + scope.areaCode }}</div>
            </template>
          </van-picker>
        </div>
        <x-no-data v-if="conf.areaCodeList.length == 0" :top="0"></x-no-data>
      </div>
    </van-popup>
  </x-page>
</template>

<style scoped lang="less">
.header-view {
  height: 104rem;
  background: linear-gradient(#ed6630, #fea24d) !important;
  display: flex;
  position: relative;
  line-height: 104rem;

  .back {
    color: #fff;
    position: absolute;
    left: 20rem;
  }

  .head-title {
    width: 100%;
    text-align: center;
    color: #fff;
    font-size: 32rem;
    font-weight: 600;
  }
}

.btn-view {
  width: 80%;
  margin-left: 10%;
  margin-top: 80rem;

  .sumit-btn {
    text-align: center;
    width: 100% !important;
    background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
    color: #fff;
    border-radius: 50rem;
    padding: 20rem;
    font-weight: bold;
    font-size: 36rem;
  }
}

.winning-box {
  // padding: 0rem 24rem 24rem;
  background: #fff;

  .winning-item {
    padding: 0rem 24rem 24rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 96rem;
    border-bottom: 1px solid #f9fafc;

    .left-view {
      display: flex;
      align-items: center;

      .avatar {
        width: 70rem;
        height: 70rem;
        margin-right: 15rem;
        border-radius: 50%;
      }

      .userName {
        color: rgb(132, 132, 144);
        font-size: 24rem;
      }
    }

    .right-view {
      text-align: right;

      .actOpt::before {
        content: '✔';
        width: 30rem;
        height: 40rem;
        transform: rotate(45deg);
        color: green;
      }
    }
  }
}

// .title,.cuIcon-right{
//     color:#A8A8A8;
// }

// .cuIcon-right{
// 	position: absolute;
// 	right: 10rem;
// }
.content-view {
  background: #fff;
  padding-bottom: 20rem;
}

.select-value {
  color: #c3c2c1 !important;
  overflow: hidden;
  text-overflow: clip;
  white-space: pre;
  word-break: keep-all;
  pointer-events: none;
  line-height: inherit;
}

.input-view {
  color: inherit;
  opacity: 0.9;
  font: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  text-align: inherit;
  text-indent: inherit;
  text-transform: inherit;
  text-shadow: inherit;
}

// // 弹窗样式
// .cu-dialog{
//     position: absolute !important;
//     left: 0rem !important;
//     bottom: 0rem !important;
//     width: 100% !important;
//     height: auto !important;
//     border-radius: 20rem 20rem 0rem 0rem !important;
// }

// .cu-modal{
// 	width: 100%;
// 	max-width: 500px;
// 	margin: 0 auto;
// }

.cu-bar {
  display: flex;
  position: relative;
  align-items: center;
  min-height: 100rem;
  justify-content: center;
}

.cu-bar .content {
  width: 100% !important;
  text-align: center;
  margin: auto;
  height: 60rem;
  font-size: 32rem;
  line-height: 60rem;
  cursor: none;
  pointer-events: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: #666666;
}

.activeRecharge {
  background: #fff6e6 !important;
  position: relative;
}

.cu-form-group {
  display: flex;
  justify-content: start;
  align-items: center !important;
}

.photo-view {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20rem 0rem;
  width: 280rem;
  height: 280rem;
  border-radius: 20rem;
  background-color: #f6f7fa;
  font-size: 40rem;
  color: #00000010;
  text-align: center;
  line-height: 280rem;

  .img-bg {
    width: 100%;
    height: 100%;
    border-radius: 20rem;
  }
}

input::placeholder,
.select-placeholder {
  color: #a8a8a860 !important;
}

.active-view {
  // background: #F17638;
  // color: #fff;
  background: #fffbf5;
  background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.input-box {
  padding: 30rem 30rem 0rem 30rem;

  .lable {
    color: #000;
    font-weight: 500;
    font-size: 32rem;
    padding-left: 20rem;
  }

  .input-view {
    position: relative;
    height: 72rem;

    .input {
      width: 100%;
      border-radius: 10rem;
      background: #f6f7fa;
      height: 72rem;
      padding: 16rem 22rem;
      color: #000;
      font-size: 28rem;
      margin-top: 20rem;

      &::placeholder {
        color: #c3c2c1;
        font-size: 28rem;
      }
    }

    .clear-icon {
      position: absolute;
      top: 60%;
      right: 20rem;
    }

    .cuIcon-right,
    .cuIcon-close {
      position: absolute;
      right: 20rem;
      top: calc(50% - 14rem);
      rotate: 90deg;
    }

    .code-btn {
      position: absolute;
      right: 20rem;
      min-width: 100rem;
      border-radius: 24rem;
      border: 1rem solid rgb(0, 0, 0);
      border-color: #ffd8ba !important;
      background: linear-gradient(to right, #eb602d, #ffa64f);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      top: calc(50% - 20rem);
      text-align: center;
      padding: 0rem 20rem;
    }

    .countdown {
      position: absolute;
      right: 20rem;
      min-width: 100rem;
      height: 40rem;
      line-height: 40rem;
      // border-radius: 24rem;
      // border: 1rem solid rgb(0, 0, 0);
      // border-color: #FFD8BA !important;
      background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      top: calc(50% - 20rem);
      text-align: center;
      padding: 0rem 20rem;
    }

    .left-view {
      width: 22%;
      position: relative;
      height: 72rem;
      margin-top: 20rem;

      .input1 {
        border-radius: 10rem;
        background: #f6f7fa;
        height: 72rem;
        padding: 16rem 22rem;
        color: #000;
        font-size: 28rem;
      }
    }

    .right-view {
      width: 78%;
      height: 72rem;
      margin-top: 20rem;
      background: #f6f7fa;

      .input2 {
        border-radius: 0rem 10rem 10rem 0rem;
        height: 40rem;
        margin: 16rem 22rem 16rem 0rem;
        padding-left: 22rem;
        color: #000;
        font-size: 28rem;
        border-left: 4rem solid #d5d4d1;
      }
    }
  }
}

.cu-dialog {
  // height: 356rem;
  border-radius: 40rem 40rem 0rem 0rem !important;
}

.padding-xl {
  padding: 0rem;
}

.model-btn {
  height: 98rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  font-size: 36rem;
  font-weight: 600;
  background: #fff;

  .left-btn {
    color: #a8a8a8;
  }

  .right-btn {
    background: linear-gradient(#eb602d, #ffa64f);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.picker-view {
  width: 100%;
  height: 258rem;
}

.item {
  line-height: 100rem;
  text-align: center;
  background: #fff !important;
  color: #000000;
}

.disabledView {
  background: #99999940 !important;
  pointer-events: auto !important;
  cursor: not-allowed !important;
}
</style>
