<template>
  <x-page pageType="black">
    <template #title>{{ $t('rechargeModule.titleName') }}</template>
    <div class="r-content">
      <div class="flex-b-c curr">
        <div>Deposit Currency</div>
        <div class="c-input">
          <inputItem
            :lable="conf.infoObj?.coinCode"
            :img="conf.infoObj?.nationalFlag"
            @change="conf.modalName = 'coinType'"
          />
        </div>
      </div>
      <div v-if="conf.paymentMethodsList.length">
        <inputItem
          title="Deposit Method"
          :lable="conf.paymentMethodsList.find((v:any) => v.isClicked)?.payMethodName"
          @change="conf.modalName = 'method'"
        />
      </div>
      <div class="gifi">
        <img src="/static/theme/black/recharge-gift.png" />
        <div>Get extra <span>180%</span> bonus on minimum of <span>$1,057.31</span> deposit</div>
      </div>

      <!-- 支付方式 == ONLINE => 选择厂商 -->
      <div class="b-30" v-if="conf.formData.payMethodCode == 'ONLINE_PAYMENT'">
        <inputItem
          title="Please select a vendor"
          :img="conf.selectPaymentVendorInfo.imgUrl"
          :lable="conf.selectPaymentVendorInfo.appShowName"
          @change="conf.handleOpenModal('PaymentVendorModal')"
        />
      </div>
      <!-- 选择通道 -->
      <div class="b-30">
        <inputItem
          :title="$t('rechargeModule.card')"
          :img="conf.selectPaymentChannelInfo.imgUrl"
          :lable="conf.selectPaymentChannelInfo.appShowName"
          @change="conf.handleOpenModal('PaymentChannel')"
        />
      </div>

       <!-- 充值方式 == Bank => 相关信息 -->
      <template v-if="conf.formData.payMethodCode == 'BANK_CARD_PAYMENT' && conf.bankCardInfo.bankCardNum">
        <div class="b-30">
          <inputItem
            :title="$t('rechargeModule.BankCardName')"
            :lable="conf.bankCardInfo.bankCardUserName"
            :isSelect="false"
            disabled
            type="text"
          >
            <div class="copy flex-center" @click="conf.handleCopyCode(conf.bankCardInfo.bankCardUserName)">{{ $t('consumptionDetails.Copy') }}</div>
          </inputItem>
        </div>
        <div class="b-30">
          <inputItem
            :title="$t('rechargeModule.BankCardNumber')"
            :lable="conf.bankCardInfo.bankCardNum"
            :isSelect="false"
            disabled
            type="text"
          >
            <div class="copy flex-center" @click="conf.handleCopyCode(conf.bankCardInfo.bankCardNum)">{{ $t('consumptionDetails.Copy') }}</div>
          </inputItem>
        </div>
        <div class="b-30">
          <inputItem
            :title="$t('rechargeModule.IFSC')"
            :lable="conf.bankCardInfo.bankBranch"
            :isSelect="false"
            disabled
            type="text"
          >
            <div class="copy flex-center" @click="conf.handleCopyCode(conf.bankCardInfo.bankBranch)">{{ $t('consumptionDetails.Copy') }}</div>
          </inputItem>
        </div>
      </template>

      <!-- 充值方式 == SCAN_CODE => 相关信息 -->
      <template v-if="conf.formData.payMethodCode == 'SCAN_CODE_PAYMENT' && conf.scanCodeInfo.scanCodePayImgUrl">
        <div class="qrCode-view b-30">
          <img :src="conf.scanCodeInfo.scanCodePayImgUrl" class="qrCode-img" />
          <div class="qrCode-info">
            <div class="qrcode-title">Deposit Code</div>
            <div class="copy-text">
              <span>{{ conf.scanCodeInfo.scanCodePayAccount }}</span>
            </div>
            <div class="copy-btn flex-center" @click="conf.handleCopyCode(conf.scanCodeInfo.scanCodePayAccount)">
              <div class="copy-icon">
                <div class="copy-drack"></div>
              </div>
              <span>Copy Code</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 充值方式 == USDT => 相关信息 -->
      <template v-if="conf.formData.payMethodCode == 'USDT_PAYMENT' && conf.qrCodeObj.USDTPayUrl">
        <div class="qrCode-view">
          <div
            style="padding: 8rem 8rem 0rem; background-color: #f9f9f9; border-radius: 8rem;"
          >
            <qrcode-vue class="image" :value="conf.qrcode" :size="130" />
          </div>
          <div class="qrCode-info">
            <div class="qrcode-title">Deposit Address</div>
            <div class="copy-text">
              <dev>
                  <span>{{ conf.qrCodeObj.USDTPayUrl.slice(0,4) }}</span>{{ conf.qrCodeObj.USDTPayUrl.slice(4,(conf.qrCodeObj.USDTPayUrl.length / 2) - 2) }}<span>{{ conf.qrCodeObj.USDTPayUrl.slice((conf.qrCodeObj.USDTPayUrl.length / 2) - 2,(conf.qrCodeObj.USDTPayUrl.length / 2) + 2) }}</span>{{ conf.qrCodeObj.USDTPayUrl.slice((conf.qrCodeObj.USDTPayUrl.length / 2) + 2,conf.qrCodeObj.USDTPayUrl.length-4) }}<span>{{ conf.qrCodeObj.USDTPayUrl.slice(conf.qrCodeObj.USDTPayUrl.length-4) }}</span>
              </dev>
            </div>
            <div class="copy-btn flex-center" @click="conf.handleCopyCode(conf.qrCodeObj.USDTPayUrl)">
              <div class="copy-icon">
                <div class="copy-drack"></div>
              </div>
              <span>Copy Address</span>
            </div>
          </div>
        </div>
      </template>

      <!--  充值金额输入框 -->
      <div class="b-30" v-if="conf.defaultAmountList.length">
        <inputItem
          :title="`${conf.rechargeMinVal}-${conf.rechargeMaxVal} ${conf.infoObj?.coinCode}`"
          :isSelect="false"
          @input="(e:any) => { conf.formData.rechargeAmount = e.val, conf.vfFun(e.type, 'rechargeAmount') }"
          @focus="conf.handleInputFocus"
          :disabled="conf.isInputDisabled"
          :defaultList="conf.defaultAmountList"
          @changeMoney="conf.handleClickRechargeAmount"
        />
      </div>
      <!-- 支付方式  == ONLINE => 选择通道信息 -->
      <template v-if="conf.formData.payMethodCode == 'ONLINE_PAYMENT'">
        <template v-for="(item, itemIndex) in conf.selectPaymentChannelInfo.bindParam">
          <div class="b-30" v-if="item.required">
            <inputItem
              :title="item.label"
              :isSelect="false"
              type="text"
              @input="(e:any) => { item.value = e.val }"
            />
          </div>
        </template>
      </template>
      <!-- 支付方式 != ONLINE => 选择通道信息 -->
      <template v-else>
        <div class="b-30">
          <inputItem
              :title="$t('rechargeModule.PaymentInformation')"
              :isSelect="false"
              type="text"
              :placeholder="
                conf.formData.payMethodCode == 'USDT_PAYMENT'
                  ? $t('rechargeModule.txidTip')
                  : $t('rechargeModule.userName')
              "
              @input="(e:any) => { conf.formData.userName = e.val }"
            />
        </div>
      </template>
      <!--  备注输入框 -->
      <div class="b-30">
        <inputItem
          :title="$t('rechargeModule.PaymentNote')"
          :isSelect="false"
          type="text"
          :placeholder="$t('rechargeModule.userRemark')"
          @input="(e:any) => { conf.formData.remark = e.val }"
        />
      </div>
      <div style="height: 88rem;">
        <greenBtn @click="conf.handleDataSubmit">
          <span style="width: 32rem;">Deposit</span>
        </greenBtn>
      </div>
      <div class="explain">
        <div style="width: 80%;">1. Your transfer amount has to MATCH the submission amount.</div>
        <div>2. Each Order lD can ONLY be used once to avoidduplicates.</div>
        <div style="width: 90%;">3. Please follow the deposit guideline to make deposit, otherwise your deposit will be missing.</div>
      </div>
    </div>
    <!-- 钱包选择 -->
    <coinPopup
      :show="conf.modalName == 'coinType'"
      :dataArr="conf.rechargeWalletList"
      :selectId="conf.infoObj.id"
      @close="conf.modalName = undefined"
      @change="(e:any) => { conf.modalName = undefined, conf.infoObj = e }"
    />
    <!-- 选择充值方式 -->
    <selectPopup
      :show="conf.modalName == 'method'"
      :dataArr="conf.paymentMethodsList"
      @close="conf.modalName = undefined"
      @change="conf.handelChangePaymentMethod"
    />
    <!-- 选择供应商 -->
    <selectPopup
      :show="conf.modalName == 'PaymentVendorModal'"
      :dataArr="conf.paymentVendorList"
      @close="conf.modalName = undefined"
      @change="(e:any) => {conf.handleSelectModal('vendor', e)}"
    />
    <!-- 选择支付通道模态框 -->
    <selectPopup
      :show="conf.modalName == 'PaymentChannel'"
      :dataArr="conf.paymentChannelList"
      @close="conf.modalName = undefined"
      @change="(e:any) => {conf.handleSelectModal('channel', e)}"
    />
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
import inputItem from './com/black/inputItem.vue'
import coinPopup from './com/black/coinPopup.vue'
import selectPopup from './com/black/selectPopup.vue'
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'
import { index } from './recharge'
import QrcodeVue from 'qrcode.vue'

const conf = index()
</script>

<style scoped lang="less">
.r-content {
  background: #323738;
  border-radius: 20rem;
  margin: 24rem;
  padding: 30rem 24rem;
  .curr{
    color: #BFBFBF;
    font-size: 28rem;
    margin-bottom: 30rem;
    .c-input{
      flex: 1;
      margin-left: 100rem;
    }
  }
  .b-30{
    margin-bottom: 30rem;
  }
}
.explain{
  background: #314A40;
  border-radius: 20rem;
  color: #B3BEC1;
  font-size: 24rem;
  padding: 20rem;
  margin-top: 20rem;
}
.gifi{
  display: flex;
  align-items: center;
  height: 80rem;
  background: #514634;
  border-radius: 20rem;
  padding: 0 20rem;
  color: #fff;
  font-size: 20rem;
  margin-bottom: 30rem;
  margin-top: 20rem;
  img{
    height: 60rem;
    margin-right: 40rem;
  }
  span{
    color: #FF9820;
  }
}
.copy {
    background: #373E3F;
    height: 52rem;
    border-radius: 12rem;
    padding: 0rem 12rem;
    color: #1CF187;
    font-size: 20rem;
}
.qrCode-view {
  display: flex;
  padding-bottom: 30rem;
  color: #bfbfbf;

  .qrCode-info{
    font-family: Poppins;
    font-weight: 500;
    font-size: 24rem;
    color: #fff;
    margin-left: 24rem;
    padding: 8rem 0rem;
    flex: 1;
    
    .qrcode-title{
      color: #BFBFBF;
      font-size: 28rem;
      margin-bottom: 10rem;
    }
    .copy-text{
      background: #292D2E;
      border-radius: 16rem;
      height: 100rem;
      padding: 0rem 20rem;
      word-break: break-all;
      display: flex;
      align-items: center;
      width: 100%;
      span{
        color: #1CF187;
      }
    }
    .copy-btn{
      background: #4A5354;
      height: 70rem;
      border-radius: 16rem;
      margin-top: 16rem;

      div {
        border: 2rem solid #fff;
        width: 18rem;
        height: 20rem;
        border-radius: 4rem;
      }

      .copy-icon {
        position: relative;
        margin-right: 10rem;

        .copy-drack {
          position: absolute;
          top: 2rem;
          left: -6rem;
          background: #fff;
        }
      }
    }
  }

  .qrCode-img {
    width: 260rem;
    height: 260rem;
    padding: 8rem;
    background-color: #fff;
    border-radius: 8rem;
  }
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
</style>
