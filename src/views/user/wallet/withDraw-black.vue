<script setup lang="ts">
import coinPopup from './com/black/coinPopup.vue'
import selectPopup from './com/black/selectPopup.vue'
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'
import inputItem from './com/black/inputItem.vue'
import custPopup from '../setting/com/custPopup.vue'
import sutil from '@/sstore/sutil'
import { index } from './withDraw'

const conf = index()
</script>

<template>
  <x-page no-footer>
    <template #title>{{ $t('WithdrawModule.titleName') }}</template>
    <!-- 选择充值钱包信息 -->
    <div class="content">
      <!-- 选择币种 -->
      <div class="b-16">
        <inputItem
          title="Withdrawal Currency"
          :lable="conf.infoObj?.coinCode"
          :img="conf.infoObj?.nationalFlag"
          @change="conf.modalName = 'coinType'"
        />
      </div>
      <!-- 提现方式 -->
      <div class="b-16">
        <inputItem
          title="Withdrawal Methods"
          :lable="conf.choosePaymentItem?.payMethodType"
          @change="conf.modalName = 'method'"
        />
      </div>
      <!-- 提现频道 -->
      <div class="b-16" @click="conf.handleOpenModal('seleceChannel')">
        <template v-if="conf.selectChannelInfo.payDataType">
          <inputItem
          v-if="conf.selectChannelInfo.payDataType == 'SCAN_CODE_PAYMENT'"
          :title="$t('rechargeModule.card')"
          :lable="conf.selectChannelInfo.paymentData.paymentName"
          :img="conf.selectChannelInfo.paymentData.paymentImgUrl"
          />
          <!-- payDataType => ONLINE_PAYMENT -->
          <inputItem
            v-if="conf.selectChannelInfo.payDataType == 'ONLINE_PAYMENT'"
            :title="$t('rechargeModule.card')"
            :lable="conf.selectChannelInfo.paymentData.onlinePayName"
            :img="conf.selectChannelInfo.bankIcon"
          />
          <!-- payDataType => BANK_CARD_PAYMENT -->
          <inputItem
            v-if="conf.selectChannelInfo.payDataType == 'BANK_CARD_PAYMENT'"
            :title="$t('rechargeModule.card')"
            :lable="conf.selectChannelInfo.bankName + '(' + conf.selectChannelInfo.paymentData.newBankCardNum + ')'"
            :img="conf.selectChannelInfo.bankIcon"
          />
          <!-- payDataType => USDT_PAYMENT -->
          <inputItem
            v-if="conf.selectChannelInfo.payDataType == 'USDT_PAYMENT'"
            :title="$t('rechargeModule.card')"
            :lable="conf.selectChannelInfo.paymentData.USDTAgreement"
            :img="conf.selectChannelInfo.bankIcon"
          />
        </template>
        <inputItem
          v-else
          :title="$t('rechargeModule.card')"
        />
      </div>
      <div class="c-title flex-b-c">
        <span>Withdrawal amount</span>
        <div v-if="conf.minVal">
          Min: 
          <span style="color: #FC3C3C;">{{ (conf.infoObj.coinSymbol == 'USDT' ? conf.infoObj.coinSymbol + ' ' : conf.infoObj.coinSymbol) + conf.minVal }}</span>
        </div>
      </div>
      <div class="c-item flex-b-c" style="margin-bottom: 10rem;">
        <input
          class="input"
          inputmode="decimal"
          :placeholder="$t('rechargeModule.PleaseEnter')"
          v-model="conf.formData.inputValue"
          @input="conf.vfFun($event, 'inputValue')"
        />
        <div class="r-tips" v-if="conf.payMethodCode == 'USDT_PAYMENT' && conf.formData.inputValue">{{ conf.exchangeRateNum }}</div>
      </div>
      <div class="btn-list">
        <div class="btn-item flex-center" @click="conf.changeMoney(0)">Min</div>
        <div class="btn-item flex-center" @click="conf.changeMoney(0.25)">25%</div>
        <div class="btn-item flex-center" @click="conf.changeMoney(0.5)">50%</div>
        <div class="btn-item flex-center" @click="conf.changeMoney(1)">Max</div>
      </div>
      <div class="c-tip flex-b-c">
        <div>{{ $t('rechargeModule.ServiceCharge') }}:<span>{{ conf.formData.service || ' -- ' }}</span></div>
        <div
          v-if="
            conf.choosePaymentItem &&
            conf.choosePaymentItem.payMethodType === 'USDT' &&
            conf.infoObj &&
            conf.infoObj.coinCode !== 'USDT'
          "
        >{{ $t('rechargeModule.ExchangeCharge') }}:<span>{{ conf.formData.ExchangeCharge || ' -- ' }}</span></div>
      </div>
      <div style="height: 88rem;margin-top: 40rem;" v-if="conf.formData.inputValue && conf.remainingCoding <= 0 && conf.usertype != 3">
        <greenBtn @click="conf.handleDataSubmit">
          <span style="font-size: 32rem;">Withdrawal</span>
        </greenBtn>
      </div>
      <div class="explain">
        <!-- 剩余打码量提示 -->
        <div style="color: #fff" v-if="conf.remainingCoding > 0">
          {{ $t('WithdrawModule.remainingCodingTip') + ' :' }}
          <span>
            {{ conf.infoObj.coinSymbol + conf.currentCoinRemainingCoding || ' -- ' }}
          </span>
        </div>
        <!-- 最小提现金额、最大提现金额提示 -->
        <div style="margin-top: 12rem;" v-if="conf.minVal && conf.maxVal" >
            {{ $t('rechargeModule.min') }}
            <span>
              {{
                ' ' +
                (conf.infoObj.coinSymbol == 'USDT' ? conf.infoObj.coinSymbol + ' ' : conf.infoObj.coinSymbol) +
                conf.minVal +
                ' '
              }}
            </span>
            ,
            {{ $t('rechargeModule.max') }}
            <span>
              {{
                ' ' +
                (conf.infoObj.coinSymbol == 'USDT' ? conf.infoObj.coinSymbol + ' ' : conf.infoObj.coinSymbol) +
                conf.maxVal +
                ' '
              }}
            </span>
          </div>
      </div>
    </div>
    <!-- 现在钱包币种 -->
    <coinPopup :show="conf.modalName == 'coinType'" :dataArr="conf.rechargeWalletList" :selectId="conf.infoObj.id"
      @close="conf.modalName = undefined" @change="(e) => { conf.modalName = undefined, conf.infoObj = e }" />
    <!-- 选择提现方式 -->
    <selectPopup :show="conf.modalName == 'method'" :dataArr="conf.paymentMethodsList"
      :selectId="conf.choosePaymentItem?.id" @close="conf.modalName = undefined"
      @change="(e) => conf.handelChangePaymentMethod(e)" />
    
      <custPopup :show="conf.modalName == 'seleceChannel'" @close="conf.hideModal">
        <div class="channel-list">
            <template v-for="item of conf.paymentChannelList" :key="item.id">
                <div class="select-item flex-b-c" :class="{ 'select-active': item.isChecked }"
                    @click="conf.handleSelectChannel(item)">
                    <!-- payDataType => SCAN_CODE_PAYMENT -->
                    <div class="left-view" v-if="item.payDataType == 'SCAN_CODE_PAYMENT'">
                      <img class="left-img" :src="item.paymentData.paymentImgUrl" />
                      <span>{{ item.paymentData.paymentName }}</span>
                    </div>
                    <!-- payDataType => ONLINE_PAYMENT -->
                    <div class="left-view" v-if="item.payDataType == 'ONLINE_PAYMENT'">
                      <img class="left-img" :src="item.bankIcon" />
                      <span>{{ item.paymentData.onlinePayName }}</span>
                    </div>
                    <!-- payDataType => BANK_CARD_PAYMENT -->
                    <div class="left-view" v-if="item.payDataType == 'BANK_CARD_PAYMENT'">
                      <img class="left-img" :src="item.bankIcon" />
                      <span>{{ item.bankName + '(' + item.paymentData.newBankCardNum + ')' }}</span>
                    </div>
                    <!-- payDataType => USDT_PAYMENT -->
                    <div class="left-view" v-if="item.payDataType == 'USDT_PAYMENT'">
                      <img class="left-img" :src="item.bankIcon" />
                      <span>{{ item.paymentData.USDTAgreement }}</span>
                    </div>
                    <div class="icon"></div>
                </div>
            </template>
        </div>
    </custPopup>
  </x-page>
</template>

<style scoped lang="less">
.content {
  background: #323738;
  border-radius: 20rem;
  margin: 24rem;
  padding: 30rem 24rem 60rem;

  .c-title {
    color: #BFBFBF;
    font-size: 28rem;
    margin-bottom: 16rem;
    padding: 0rem 2rem;
  }

  .b-16{
    margin-bottom: 16rem;
  }

  .c-item {
    background: #292D2E;
    border: 2rem solid #383E3E;
    height: 80rem;
    padding: 20rem;
    border-radius: 12rem;
    color: #fff;
    font-size: 28rem;
    font-weight: 700;
    margin-bottom: 30rem;

    .left-table {
      display: flex;
      align-items: center;

      img {
        height: 40rem;
        margin-right: 12rem;
      }
    }

    .r-arrow {
      width: 44rem;
      height: 44rem;
      background: #464F50;
      border-radius: 12rem;
    }

    .input {
      flex: 1;
    }

    .r-tips{
      color: #1CF187;
      text-align: right;
      box-sizing: border-box;
      line-height: initial;
      white-space: normal;
      word-wrap: break-word;
    }
  }

  .c-tip {
    color: #BFBFBF;
    font-size: 20rem;
  }

  .btn-list {
    display: flex;
    margin-bottom: 20rem;
    .btn-item {
      flex: 1;
      background: #4A5354;
      height: 56rem;
      border-radius: 10rem;
      color: #B3BEC1;
      font-size: 24rem;
      margin-right: 12rem;
      &:last-of-type{
        margin-right: 0rem;
      }
    }
  }
}
.explain{
  background: #314A40;
  border-radius: 20rem;
  color: #B3BEC1;
  font-size: 24rem;
  padding: 20rem;
  margin-top: 20rem;
  span{
    color: #1CF187;
  }
}
.channel-list {
    padding: 0 24rem 24rem;
    max-height: 50vh;
    overflow-y: auto;

    .select-item {
        height: 90rem;
        padding: 0rem 16rem;
        color: #fff;
        font-size: 26rem;
        margin-bottom: 10rem;

        .left-view {
            display: flex;
            align-items: center;

            .left-img {
                height: 42rem;
                width: 42rem;
                border-radius: 50%;
                margin-right: 20rem;
            }
        }

        .icon {
            border: 3rem solid #36393A;
            width: 40rem;
            height: 40rem;
            border-radius: 50%;
        }
    }

    .select-active {
        background: #323738;
        border-radius: 12rem;

        .icon {
            border: 8rem solid #1CF187;
        }
    }
}
</style>
