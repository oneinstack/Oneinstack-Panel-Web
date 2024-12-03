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
          <div class="not-method" v-if="!conf.payMentLoading && !conf.paymentList.length">
            <img mode="heightFix" src="/static/img/wallet/no-method.png" />
            <span>{{ $t('wallet.notRecharge') }}</span>
          </div>
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
import { apis } from '@/api'
import i18n from '@/lang'
import sapp from '@/sstore/sapp'
import sconfig from '@/sstore/sconfig'
import sshake from '@/sstore/sshake'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import svf from '@/sstore/svf'
import sweb from '@/sstore/sweb'
import StatusBarConfig from '@/utils/StatusBarConfig'
import System from '@/utils/System'
import QrcodeVue from 'qrcode.vue'
import { computed, nextTick, onMounted, reactive, watch } from 'vue'

const conf = reactive({
  modalName: null as any,
  modalShow: computed<boolean>({
    get: () => !!conf.modalName,
    set: () => (conf.modalName = null)
  }),
  serviceHeiht: 680,
  //充值钱包信息
  infoObj: {
    name: '',
    currentMoney: '',
    number: '',
    walletIndex: -1,
    quickRechargeAmount: []
  } as any,
  //提交数据
  formData: {
    payMethodCode: '', //支付方式code
    paymentVendor: '', //支付厂商
    paymentChannel: '', //支付通道
    rechargeAmount: '',
    userName: '',
    remark: ''
  } as any,
  paymentMethodsList: [] as any, //支付方式list
  paymentVendorList: [] as any, //支付厂商list
  paymentChannelList: [] as any, //支付通道list
  selectPaymentVendorInfo: {} as any, //选择支付厂商信息
  selectPaymentChannelInfo: {
    bindParam: []
  } as any, //选择支付通道信息
  indicatorStyle: `height: 50px;`,
  valueArr: [] as any,
  currentCoinIndex: null as any,
  defaultAmountList: [] as any, //默认充值金额列表
  rechargeMinVal: '',
  rechargeMaxVal: '',
  bankCardInfo: {
    bankBranch: '',
    bankCardUserName: '',
    bankCardNum: ''
  },
  scanCodeInfo: {
    scanCodePayImgUrl: '',
    scanCodePayName: ''
  } as any,
  qrCodeObj: {} as any,
  qrcode: '', //二维码的内容链接
  size: 150, //二维码的大小
  unit: 'px', //大小单位 !!! rem单位有误
  load_make: true, //组件加载完成后自动生成二维码
  show_loading: false, //是否添加loading
  onval: true, //val值变化时自动重新生成二维码
  background: '#ffffff', //背景色
  foreground: '#000', //点色
  pdground: '#000', //角标色
  icon: '', //二维码图标
  lv: 3, //二维码容错级别
  isOpenDialog: false,
  usdtWalletList: [] as any, //usdt钱包信息
  exchangeRateNum: null as any,
  allData: [],
  isInputDisabled: false,
  paymentList: [],
  payMentLoading: true,
  swiperList: [] as any,
  defaultCoinWallet: {} as any,
  rechargeWalletList: [] as any,
  scanCodePayImgUrl: '',
  scanCodePayName: '',
  webUrl: '',
  vf: {} as any,
  vfFun: (e: any, name: string) => {
    conf.vf[name](e)
    nextTick(() => {
      conf.defaultAmountList?.forEach((item: any) => {
        Reflect.set(item, 'isClick', false)
        if (parseFloat(conf.formData[name]) == item.money) {
          Reflect.set(item, 'isClick', true)
        }
      })

      if (conf.formData.payMethodCode == 'USDT_PAYMENT') {
        conf.getUSDT()
      }
    })
  },
  //返回
  goBack() {
    sutil.pageBack()
  },

  //获取币种列表
  getCoinlist() {
    System.loading()
    conf.swiperList = []
    apis.coinlist({
      success: (res: any) => {
        if (res.code == 200) {
          conf.swiperList = res.data || []
          conf.defaultCoinWallet = conf.swiperList.find((item: any) => item.isDefault)
          conf.getWalletList(conf.swiperList, null)
          conf.usdtWalletList = conf.swiperList.find((v: any) => v.coinCode == 'USDT')
        } else {
          System.toast(res.message)
        }
      },
      complete: () => {
        System.loading(false)
      }
    })
  },

  //获取用户钱包list
  getWalletList(arr: any, type: any) {
    apis.walletlist({
      success: async (res: any) => {
        if (res.code == 200) {
          let currentWallet = Cookie.get('currentWallet')
          if (!currentWallet) {
            let defaultInfo = await svalue.getDefaultWallet()
            currentWallet = defaultInfo.coinCode
          }
          conf.rechargeWalletList = res.data || []
          conf.rechargeWalletList?.forEach((item: any, itemIndex: number) => {
            let index = arr.findIndex((into: any) => into.coinCode == item.walletCoin)
            if (index != -1) {
              let obj = {
                ...arr[index],
                ...item
              }
              conf.rechargeWalletList[itemIndex] = obj
              if (item.walletCoin == currentWallet) {
                sapp.globalData.defaultWalletInfo = obj
                conf.infoObj = obj
                conf.infoObj.walletIndex = itemIndex
                conf.currentCoinIndex = itemIndex
                nextTick(() => {
                  this.getPaymentMethodsData()
                })
              }
            }
          })
        }
      }
    })
  },

  //获取支付方式数据
  getPaymentMethodsData() {
    System.loading()
    apis.payMethodList({
      success: (res: any) => {
        if (res.code == 200) {
          let data = res.data
          conf.allData = data
          if (conf.infoObj.coinCode == 'USDT') {
            conf.paymentMethodsList = conf.allData.filter((item: any) => item.payMethodCode == 'USDT_PAYMENT')
          } else {
            conf.paymentMethodsList = data
          }
          conf.paymentMethodsList?.forEach((item: any, index: number) => {
            item.isClicked = false
            if (index == 0) {
              item.isClicked = true
              conf.formData.payMethodCode = item.payMethodCode
            }
          })
          nextTick(() => {
            conf.getPaymentVendorData()
          })
        }
      },
      complete: () => {
        System.loading(false)
      }
    })
  },

  //选择支付方式change
  handelChangePaymentMethod(obj: any) {
    conf.payMentLoading = true
    conf.paymentMethodsList?.forEach((item: any) => {
      item.isClicked = false
      item.payMethodCode == obj.payMethodCode && (item.isClicked = true)
    })
    conf.formData.payMethodCode = obj.payMethodCode
    conf.defaultAmountList = []
    conf.rechargeMinVal = ''
    conf.rechargeMaxVal = ''
    conf.getPaymentVendorData()
    conf.handleClearSelectData()
  },

  //清空选择数据
  handleClearSelectData() {
    conf.formData.paymentVendor = ''
    conf.formData.paymentChannel = ''
    conf.formData.rechargeAmount = ''
    conf.formData.userName = ''
    conf.formData.remark = ''
    conf.selectPaymentVendorInfo = {}
    conf.selectPaymentChannelInfo = {}
    conf.selectPaymentChannelInfo.bindParam = []
    conf.bankCardInfo.bankBranch = ''
    conf.bankCardInfo.bankCardUserName = ''
    conf.bankCardInfo.bankCardNum = ''
    conf.scanCodePayImgUrl = ''
    conf.scanCodePayName = ''
    conf.qrCodeObj = {}
    conf.defaultAmountList?.forEach((item: any) => {
      Reflect.set(item, 'isClick', false)
    })
  },

  //获取支付厂商、支付通道数据
  getPaymentVendorData() {
    conf.paymentVendorList = []
    conf.paymentList = []
    apis.rechargePayList({
      methodCode: conf.formData.payMethodCode || conf.paymentMethodsList[0]?.payMethodCode,
      coin: conf.infoObj.coinCode,
      success: (res: any) => {
        if (res.code == 200) {
          conf.paymentList = res.data
          conf.payMentLoading = false
          if (conf.formData.payMethodCode == 'ONLINE_PAYMENT') {
            conf.paymentVendorList = res.data || []
            conf.paymentVendorList.length == 1 && conf.handleSelectModal('vendor', conf.paymentVendorList[0])
          } else {
            conf.paymentChannelList = res.data || []
            conf.paymentChannelList.length == 1 && conf.handleSelectModal('channel', conf.paymentChannelList[0])
          }
        }
      }
    })
  },

  //选择充值钱包picker
  rechargeWalletPickerChange({ currentOption }: any) {
    conf.currentCoinIndex = conf.rechargeWalletList.findIndex((item: any) => item.coinCode == currentOption.coinCode)
  },

  //选择充值钱包 -- 确认btn
  onClickConfirmUnit() {
    let index = conf.currentCoinIndex
    conf.infoObj = conf.rechargeWalletList[index] || {}
    conf.infoObj.walletIndex = index
    conf.modalName = null
    if (conf.infoObj.coinCode == 'USDT') {
      conf.paymentMethodsList = conf.allData.filter((item: any) => item.payMethodCode == 'USDT_PAYMENT')
    } else {
      conf.paymentMethodsList = conf.allData
    }
    conf.paymentMethodsList?.forEach((item: any, index: number) => {
      item.isClicked = false
      if (index == 0) {
        item.isClicked = true
        conf.formData.payMethodCode = item.payMethodCode
      }
    })
    nextTick(() => {
      conf.getPaymentVendorData()
      conf.handleClearSelectData()
    })
    conf.defaultAmountList = []
    conf.rechargeMinVal = ''
    conf.rechargeMaxVal = ''
  },

  //打开选择通道模态框
  handleOpenModal(e: string) {
    if (e == 'PaymentChannel' && !conf.formData.paymentVendor && conf.formData.payMethodCode == 'ONLINE_PAYMENT') {
      System.toast(i18n.t('rechargeModule.selectPaymentVendor') + '!' || '') //请先选择支付厂商
      return
    }
    conf.modalName = e
  },

  //关闭模态框
  hideModal() {
    conf.modalName = null
  },

  //模态框选择
  handleSelectModal(type: any, obj: any) {
    conf.defaultAmountList = []
    conf.rechargeMinVal = ''
    conf.rechargeMaxVal = ''
    switch (type) {
      //选择厂商
      case 'vendor':
        conf.formData.paymentVendor = obj.payPlatformCode
        conf.selectPaymentVendorInfo = obj
        conf.paymentVendorList?.forEach((item: any) => {
          item.isChecked = false
          obj.payPlatformCode == item.payPlatformCode && (item.isChecked = true)
        })
        conf.paymentChannelList = obj.payChannelList || []
        conf.formData.paymentChannel = ''
        conf.selectPaymentChannelInfo = {}
        conf.selectPaymentChannelInfo.bindParam = []
        conf.bankCardInfo.bankBranch = ''
        conf.bankCardInfo.bankCardUserName = ''
        conf.bankCardInfo.bankCardNum = ''
        conf.scanCodePayImgUrl = ''
        conf.scanCodePayName = ''
        conf.qrCodeObj = {}
        conf.paymentChannelList.length == 1 && conf.handleSelectModal('channel', conf.paymentChannelList[0])
        break
      //选择通道
      case 'channel':
        if (conf.formData.payMethodCode == 'ONLINE_PAYMENT' && obj.bindParam) {
          obj.bindParam = typeof obj.bindParam == 'string' ? JSON.parse(obj.bindParam) : obj.bindParam
          obj.bindParam?.forEach((item: any) => {
            Reflect.set(item, 'value', '')
            item.name == 'userName' && (item.value = sconfig.userInfo.userWithdrawName || '')
            item.name == 'idCard' && (item.value = sconfig.userInfo.userIdCard || '')
          })
        }
        conf.formData.paymentChannel = obj.payChannelId

        if (conf.formData.payMethodCode == 'BANK_CARD_PAYMENT') {
          conf.bankCardInfo = JSON.parse(obj.channelData)
        }

        if (conf.formData.payMethodCode == 'SCAN_CODE_PAYMENT') {
          conf.scanCodeInfo = JSON.parse(obj.channelData)
        }

        if (conf.formData.payMethodCode == 'USDT_PAYMENT') {
          conf.qrCodeObj = JSON.parse(obj.channelData)
          conf.qrcode = conf.qrCodeObj.USDTPayUrl
        }

        conf.paymentChannelList?.forEach((item: any) => {
          item.isChecked = false
          obj.payChannelId == item.payChannelId && (item.isChecked = true)
        })
        conf.selectPaymentChannelInfo = obj
        let arr = obj.payAmount?.split(',')
        arr?.forEach((item: any) => {
          conf.defaultAmountList.push({
            money: conf.formatNumberToFixed2(item),
            isClick: false
          })
        })
        conf.rechargeMinVal = conf.formatNumberToFixed2(obj.payAmountMin).toString()
        conf.rechargeMaxVal = conf.formatNumberToFixed2(obj.payAmountMax).toString()
        conf.isInputDisabled = false
        break
    }
    conf.hideModal()
  },

  //截取小数两位 => 不进行四舍五入
  formatNumberToFixed2(num: any) {
    let multiplier = Math.pow(10, 2)
    let roundedNum = Math.floor(num * multiplier)
    return roundedNum / multiplier
  },

  //生成二维码
  qrR(e: any) {},

  //input框 => 获取焦点事件
  handleInputFocus() {
    if (!conf.formData.paymentChannel) {
      System.toast(i18n.t('rechargeModule.card') || '')
      conf.isInputDisabled = true
    } else {
      conf.isInputDisabled = false
    }
  },

  //快捷金额列表click事件
  handleClickRechargeAmount(obj: any) {
    conf.defaultAmountList?.forEach((item: any) => {
      Reflect.set(item, 'isClick', false)
      item.money == obj.money && (item.isClick = true)
    })
    conf.formData.rechargeAmount = obj.money
    if (conf.formData.payMethodCode == 'USDT_PAYMENT') {
      nextTick(() => {
        conf.getUSDT()
      })
    }
  },

  //获取USDT数据
  getUSDT() {
    //当前币种汇率 /目标币种汇率 * 当前金额 => 结果截取四位小数不进行四舍五入
    //当前 usdt
    let targetNum = conf.usdtWalletList.coinTousdt
    //目标 选中的币种
    let currentNum = conf.infoObj.coinTousdt

    let num = sutil.division(targetNum, currentNum, false)
    let sum = sutil.Mul(num, conf.formData.rechargeAmount)
    sum = sutil.formatNumber(sum)
    conf.exchangeRateNum = '≈ ' + sum + ' USDT'
  },

  //复制
  handleCopyCode(val: string) {
    let promoteCode = val //拿到想要复制的值

    // #ifdef H5
    let copyInput = document.createElement('input') //创建input元素
    document.body.appendChild(copyInput) //向页面底部追加输入框
    copyInput.setAttribute('value', promoteCode) //添加属性，将url赋值给input元素的value属性
    copyInput.select() //选择input元素
    document.execCommand('Copy') //执行复制命令
    System.toast(i18n.t('invite.CopySuccessful') || '', 'success') //弹出提示信息，不同组件可能存在写法不同
    //复制之后再删除元素，否则无法成功赋值
    copyInput.remove() //删除动态创建的节点
    // #endif
  },

  // 数据提交
  handleDataSubmit() {
    let obj: any = null,
      isRequest = true,
      promptMessage = ''
    if (conf.formData.payMethodCode != 'ONLINE_PAYMENT' && !conf.formData.userName) {
      isRequest = false
      promptMessage =
        conf.formData.payMethodCode == 'USDT_PAYMENT'
          ? i18n.t('rechargeModule.txidTip')
          : i18n.t('rechargeModule.userName')
    }
    if (conf.formData.payMethodCode == 'ONLINE_PAYMENT' && conf.selectPaymentChannelInfo.bindParam.length > 0) {
      let index = conf.selectPaymentChannelInfo.bindParam.findIndex((item: any) => !item.value && item.required)
      if (index != -1) {
        isRequest = false
        promptMessage = 'Please enter ' + conf.selectPaymentChannelInfo.bindParam[index].label
      }
    }
    if (!conf.formData.rechargeAmount) {
      isRequest = false
      promptMessage = i18n.t('rechargeModule.rechargeAmountEmptytTip')
    }
    if (!conf.formData.paymentChannel) {
      isRequest = false
      promptMessage = i18n.t('rechargeModule.cardTip')
    }
    if (conf.formData.payMethodCode == 'ONLINE_PAYMENT' && !conf.formData.paymentVendor) {
      isRequest = false
      promptMessage = i18n.t('rechargeModule.selectPaymentVendor') + '!'
    }
    if (!isRequest) {
      System.toast(promptMessage || 'Please complete the form filling out!')
      return
    }

    let val = parseFloat(conf.formData.rechargeAmount)
    if (val > parseFloat(conf.rechargeMaxVal)) {
      System.toast(i18n.t('rechargeModule.max') + ' ' + conf.infoObj.coinSymbol + conf.rechargeMaxVal || '')
      return
    }
    if (val < parseFloat(conf.rechargeMinVal)) {
      System.toast(i18n.t('rechargeModule.min') + ' ' + conf.infoObj.coinSymbol + conf.rechargeMinVal || '')
      return
    }

    obj = {
      walletId: conf.infoObj.id,
      money: conf.formData.rechargeAmount,
      payMethodCode: conf.formData.payMethodCode,
      payChannelId: conf.selectPaymentChannelInfo.payChannelId,
      userRemark: conf.formData.remark
    }

    if (conf.formData.payMethodCode == 'ONLINE_PAYMENT') {
      if (conf.selectPaymentChannelInfo.bindParam) {
        conf.selectPaymentChannelInfo.bindParam?.forEach((item: any) => {
          if (item.required) {
            let key = item.name
            item.obj = {}
            item.obj[key] = item.value
            obj = { ...obj, ...item.obj }
          }
        })
      }
    } else {
      let newObj = {
        userName: conf.formData.userName
      }
      obj = { ...obj, ...newObj }
    }

    sshake.shakeFunction({
      key: 'rechargeBtn',
      time: 2000,
      success: () => {
        System.loading()
        apis.recharge({
          ...obj,
          success: (res: any) => {
            if (res.code == 200) {
              conf.hideModal()
              conf.formData.rechargeAmount = ''
              if (res.data.codeUrl) {
                conf.isOpenDialog = true
                conf.webUrl = res.data.codeUrl
              } else {
                System.toast(i18n.t(`code.${res.code}`) || '', 'success')
                setTimeout(() => {
                  conf.goBack()
                }, 2000)
              }
              if (
                this.formData.payMethodCode == 'ONLINE_PAYMENT' &&
                (!sconfig.userInfo?.userWithdrawName || !sconfig.userInfo?.userIdCard)
              ) {
                !sconfig.userInfo.userWithdrawName &&
                  (sconfig.userInfo.userWithdrawName = conf.selectPaymentChannelInfo.bindParam.find(
                    (item: any) => item.name == 'userName'
                  )?.value)
                !sconfig.userInfo.userIdCard &&
                  (sconfig.userInfo.userIdCard = conf.selectPaymentChannelInfo.bindParam.find(
                    (item: any) => item.name == 'idCard'
                  )?.value)
              }
            } else {
              let min = conf.infoObj.coinSymbol + conf.rechargeMinVal
              let max = conf.infoObj.coinSymbol + conf.rechargeMaxVal
              conf.hideModal()
              System.toast(
                res.code == 1216
                  ? i18n.t(`code.${res.code}`) + res.msg
                  : res.code == 1233
                    ? i18n.t(`code.${res.code}`) + ' ( ' + min + ' ~ ' + max + ' )'
                    : i18n.t(`code.${res.code}`)
              )
            }
          },
          complete: () => {
            System.loading(false)
          }
        })
      },
      fail: (res: any) => {
        // 请勿连续点击
        System.toast(i18n.t('user.shakeTip'), 'error')
      }
    })
  },

  // 第三方充值弹窗btns
  handleDialogBtns(type: string) {
    conf.isOpenDialog = false
    switch (type) {
      case 'confirm':
        sweb.open(conf.webUrl)
        break
      case 'cancel':
        conf.goBack()
        break
    }
  }
})

conf.vf = svf.getVf(conf.formData, {
  rechargeAmount: {
    int: true
  }
})

watch(
  () => conf.currentCoinIndex,
  (newVal) => {
    conf.valueArr[0] = conf.rechargeWalletList[newVal].coinCode
  },
  {
    deep: true // 深度监听父组件传过来对象变化
  }
)

onMounted(() => {
  nextTick(() => {
    if (parseFloat(conf.serviceHeiht.toString()) < 300) conf.serviceHeiht = 680
    conf.serviceHeiht = window.innerHeight - sutil.rem2px(300) - sutil.rem2px(104) - StatusBarConfig.statusHeight
  })
  conf.getCoinlist()
})
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
    border-bottom: 1px solid #f6f7fa;
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
  min-height: 57px;
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
  max-width: 500px;
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
  max-width: 500px;
  margin: 0 auto;
}

.popup {
  position: fixed;
  z-index: 9998;
  bottom: 0rem;
  width: 100%;
  max-width: 500px;
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
