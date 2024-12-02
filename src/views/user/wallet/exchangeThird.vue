<script setup lang="ts">
import { apis } from '@/api'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import sshake from '@/sstore/sshake'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import svf from '@/sstore/svf'
import System from '@/utils/System'
import { nextTick, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'

const conf = reactive({
  topSelectList: [] as any[],
  initArr: [] as any[],
  firstPopupShow: false,
  secondPopupShow: false,
  firstSelectInfo: {
    code: '',
    walletMoney: '',
    platformId: ''
  } as any,
  secondSelectInfo: {
    code: '',
    walletMoney: '',
    platformId: ''
  } as any,
  changeImg: '/static/img/wallet/change2.png',
  topInputValue: null as any,
  bottomInputValue: null as any,
  exchangeRate: '',
  modalName: null as any,
  topSearch: '',
  bottomSearch: '',
  coinCode: '',
  typeCode: '',
  sliderValue: 0,
  sliderMax: 100,
  coinArr: [] as any[],
  vf: {} as any,
  //输入框 -- 货币汇率转换
  vfFun: (e: any, name: string) => {
    conf.vf[name](e)
    nextTick(() => {
      if (parseFloat(conf.topInputValue) > parseFloat(conf.firstSelectInfo.walletMoney)) {
        conf.topInputValue = Number(conf.firstSelectInfo.walletMoney)
      }
      if (conf.bottomInputValue || conf.topInputValue) {
        conf.currencyConversion()
      }
    })
  },

  async getMoneyInfo(firstSelectInfo: any) {
    System.loading()
    const { data } = await apis.gameWalletForCenter({
      coinCode: sconfig.systemWalletInfo.coinCode,
      gamePlatformCode: firstSelectInfo.code,
      final: () => {
        System.loading(false)
      }
    })
    firstSelectInfo.walletMoney = data.walletMoney
  },

  //获取列表
  getPayPlatformList(coinCode: string) {
    conf.coinCode = coinCode
    apis.getPayPlatformList({
      coinCode,
      success: async (res: any) => {
        if (res.code == 200) {
          conf.initArr = res.data.map((item: any) => {
            let coin = conf.coinArr.find((c) => c.coinCode == item.platformCoinCode)
            return {
              coinCode: coin?.coinCode,
              coinTousdt: coin?.coinTousdt,
              coinSymbol: coin?.coinSymbol,
              ...item
            }
          })
          this.topSelectList = this.initArr
          if (conf.typeCode) {
            conf.firstSelectInfo = conf.initArr.find((x) => x.code == conf.typeCode)
            if (!conf.secondSelectInfo.code) conf.secondSelectInfo = conf.initArr[0]
            if (conf.typeCode == 'Current') conf.secondSelectInfo = []
          } else {
            this.firstSelectInfo = this.topSelectList[0]
          }
          if (conf.secondSelectInfo.code) {
            conf.secondSelectInfo = conf.initArr.find((x) => x.code == conf.secondSelectInfo.code)
          }
          // else {
          // 	this.secondSelectInfo = this.initArr.find(x => x.code == 'BUGO')
          // }
          this.sliderMax = this.firstSelectInfo.walletMoney

          const fcode = this.firstSelectInfo.code
          if (fcode === conf.typeCode && fcode !== 'Current') {
            await conf.getMoneyInfo(conf.firstSelectInfo)
          }
          if (conf.topSelectList.length > 1 && conf.typeCode == 'Current') {
            await Timer.delay(100)
            //默认选中第一个
            await conf.handleOpt(conf.topSelectList[1], 'bottom')
            await conf.handleOpt(conf.topSelectList[1], 'bottom')
          }
        } else {
          System.toast(i18n.t(`code.${res.code}`))
        }
      },
      complete: () => {
        System.loading(false)
      }
    })
  },

  //上下select切换、左右汇率切换
  swapElements() {
    conf.sliderValue = 0
    setTimeout(() => {
      let obj1 = JSON.parse(JSON.stringify(conf.firstSelectInfo)) || {}
      let obj2 = JSON.parse(JSON.stringify(conf.secondSelectInfo)) || {}
      conf.firstSelectInfo = obj2
      conf.secondSelectInfo = obj1
      conf.topInputValue = ''
      conf.bottomInputValue = ''
      conf.sliderMax = conf.firstSelectInfo.walletMoney
    }, 100)
  },

  //返回
  goBack() {
    sutil.pageBack()
  },

  allMoney() {
    if (conf.firstSelectInfo.walletMoney) {
      conf.topInputValue = conf.firstSelectInfo.walletMoney
      conf.sliderValue = conf.topInputValue
      conf.currencyConversion()
    }
  },

  handleSilder(e: any) {
    conf.sliderValue = e.target.value
    conf.topInputValue = e.target.value
    conf.currencyConversion()
  },

  //货币换算
  currencyConversion() {
    let thirdObj = conf.firstSelectInfo.code != 'Current' ? conf.firstSelectInfo : conf.secondSelectInfo
    if (!thirdObj.hasOwnProperty('coinTousdt')) {
      return
    }
    let currentObj = conf.firstSelectInfo.code == 'Current' ? conf.firstSelectInfo : conf.secondSelectInfo
    let inputVal = conf.firstSelectInfo.code != 'Current' ? conf.topInputValue : conf.bottomInputValue
    let num1 = sutil.division(inputVal, thirdObj.coinTousdt, false)
    let total = sutil.Mul(num1, currentObj.coinTousdt)
    let monery = sutil.Mul(sutil.division(thirdObj.coinTousdt, currentObj.coinTousdt, false), currentObj.walletMoney)
    monery = parseInt(monery.toString())
    if (conf.firstSelectInfo.code != 'Current') {
      conf.bottomInputValue = total.toFixed(4)
      if (sutil.isNull(conf.bottomInputValue)) conf.bottomInputValue = '0'
    } else {
      conf.topInputValue = total.toFixed(4)
      if (sutil.isNull(conf.topInputValue)) conf.topInputValue = '0'
      //判断
      nextTick(() => {
        if (parseFloat(conf.bottomInputValue) > monery) {
          conf.bottomInputValue = monery
          System.toast(i18n.t('wallet.outCurrentWallet'))
          conf.bottomInputValue = ''
          conf.topInputValue = ''
        }
      })
    }
  },

  formatDecimal(num: any, decimal: any) {
    num = num.toString()
    let index = num.indexOf('.')
    if (index !== -1) {
      num = num.substring(0, decimal + index + 1)
    } else {
      num = num.substring(0)
    }
    return parseFloat(num).toFixed(decimal)
  },

  // 下拉框弹窗 -- 搜索
  searchIcon(type: any, e: any) {
    let key = e.target.value.toLowerCase()
    if (!key) {
      conf.topSelectList = conf.initArr
      return
    }
    //top的弹窗关键字搜索
    conf.topSelectList = conf.topSelectList.filter((item) => {
      return item.code.toLowerCase().includes(key)
    })
  },

  //click下拉框
  handleOpenSelect(type: any, e: any) {
    conf.modalName = e.currentTarget.dataset.target
    if (type == 'top') {
      conf.firstPopupShow = !conf.firstPopupShow
    } else {
      conf.secondPopupShow = !conf.secondPopupShow
    }
  },

  //下拉框选择option的click事件
  async handleOpt(item: any, type: any) {
    if (item.walletMoney === -1) {
      await conf.getMoneyInfo(item)
      return
    }

    if (type == 'top') {
      conf.firstPopupShow = !conf.firstPopupShow
      conf.firstSelectInfo = item
    } else {
      conf.secondPopupShow = !conf.secondPopupShow
      conf.secondSelectInfo = item
    }
    conf.modalName = null
    conf.topSearch = ''
    conf.bottomSearch = ''
    conf.currencyConversion()
  },

  //关闭弹窗
  hideModal(e: any) {
    conf.modalName = null
    conf.firstPopupShow = false
    conf.secondPopupShow = false
    conf.topSearch = ''
    conf.bottomSearch = ''
    conf.topSelectList = conf.initArr
  },

  //Connect Wallet -- 汇兑
  handleDataSubmit() {
    if (!conf.firstSelectInfo.code) {
      System.toast(i18n.t('swapModule.chooseWalletTip'))
      return
    }
    if (!conf.topInputValue) {
      System.toast(i18n.t('swapModule.enterAmountTip'))
      return
    }
    if (!conf.secondSelectInfo.code) {
      System.toast(i18n.t('swapModule.chooseWalletTip'))
      return
    }
    sshake.shakeFunction({
      key: 'thirdpartyBtn',
      time: 3000,
      success: () => {
        // 点击按钮执行的操作
        System.loading()
        apis.thirdpartyTransfer({
          sourceGameCode: conf.firstSelectInfo.code,
          sourceGamePlatformId: conf.firstSelectInfo.platformId,
          targetGameCode: conf.secondSelectInfo.code,
          targetGamePlatformId: conf.secondSelectInfo.platformId,
          tradeAmount: conf.firstSelectInfo.code != 'Current' ? conf.topInputValue : conf.bottomInputValue,
          tradeCoinCode: conf.coinCode,
          sourceGamePlatformCode: conf.firstSelectInfo.code,
          targetGamePlatformCode: conf.secondSelectInfo.code,
          success: (res: any) => {
            if (res.code == 200) {
              conf.topInputValue = null
              conf.bottomInputValue = null
              System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
              conf.typeCode = conf.firstSelectInfo.code
              // this.getPayPlatformList(this.coinCode)
              setTimeout(() => {
                conf.goBack()
              }, 300)
            } else {
              System.toast(i18n.t(`code.${res.code}`) || 'fail', 'error')
            }
          },
          complete: () => {
            System.loading(false)
          }
        })
      },
      fail: () => {
        // 请勿连续点击
        System.toast(i18n.t('user.shakeTip'), 'error')
      }
    })
  },

  async getWalletMoney() {
    System.loading()
    try {
      const wlist = await svalue.getWalletlist()
      const clist = await svalue.getCoinlist()
      let defaultWalletId = sconfig.userInfo.defaultWalletId
      wlist.forEach((item: any) => {
        if (item.id == defaultWalletId) {
          conf.coinArr = clist
          //第三方未接通 不调接口
          conf.getPayPlatformList(item.walletCoin)
        }
      })
    } catch (err) {
      System.loading(false)
    }
  }
})

conf.vf = svf.getVf(conf, {
  topInputValue: {
    int: true
  },
  bottomInputValue: {
    int: true
  }
})

const route = useRoute()
onMounted(() => {
  const routeParams = route.query
  console.log('object', routeParams)
  if (routeParams && routeParams.type) {
    conf.typeCode = routeParams.type as string
  }
  conf.getWalletMoney()
})
</script>

<template>
  <x-page>
    <template #title>
      {{ $t('swapModule.titleName') }}
    </template>
    <div class="box-view" style="width: 100%">
      <div class="padding bg-white">
        <div class="topView">
          <!-- 选择框 -->
          <div class="flex">
            <div class="flex-sub bg-grey padding-sm margin-xs radius">
              <div
                class="c-flex-align"
                @click="conf.firstSelectInfo.code !== 'Current' ? conf.handleOpenSelect('top', $event) : ''"
                data-target="topModal"
              >
                <div style="display: flex; align-items: center; justify-items: center">
                  <!-- <img :src="firstSelectInfo.nationalFlag" style="width:40rem;height: 40rem;" v-if="firstSelectInfo.nationalFlag" /> -->
                  <img class="imageLog" src="/static/img/bugo.png" mode="" v-if="conf.firstSelectInfo.code == 'BUGO'" />
                  <img
                    class="imageLog"
                    :src="'/static/img/centerWallet/' + conf.firstSelectInfo.code + '.png'"
                    mode=""
                    v-else
                  />
                  <span style="margin-left: 10rem; font-size: 40rem; color: #000000; opacity: 0.7; font-weight: 600">
                    {{ conf.firstSelectInfo.code || '' }}
                  </span>
                </div>
                <span
                  class="cuIcon-triangledownfill"
                  v-if="!conf.firstPopupShow && conf.firstSelectInfo.code !== 'Current'"
                ></span>
                <span
                  class="cuIcon-triangleupfill"
                  v-if="conf.firstPopupShow && conf.firstSelectInfo.code !== 'Current'"
                ></span>
              </div>
              <div class="cu-modal" :class="conf.modalName == 'topModal' ? 'show' : ''">
                <div class="cu-dialog">
                  <div class="cu-bar bg-white justify-end">
                    <div class="content">{{ $t('swapModule.SelectCurrency') }}</div>
                    <div class="action" @click="conf.hideModal">
                      <van-icon name="cross" class="cuIcon-close text-red" />
                    </div>
                  </div>
                  <div class="padding-xl">
                    <div class="search-view">
                      <van-icon name="search" class="cuIcon-search" />
                      <input
                        type="text"
                        :placeholder="$t('swapModule.placeholderSearchName')"
                        v-model="conf.topSearch"
                        style="width: 90%; text-align: left"
                        @input="conf.searchIcon('top-search', $event)"
                      />
                    </div>
                    <div
                      style="
                        width: 100%;
                        text-align: left;
                        margin: 15rem 0rem;
                        font-size: 28rem;
                        color: #000000;
                        opacity: 0.7;
                        font-weight: 600;
                        margin-left: 30rem;
                      "
                    >
                      {{ $t('swapModule.CurrencyName') }}
                    </div>
                    <div class="winning-box" scroll-y="true" style="max-height: 300rem; height: auto !important">
                      <template v-for="(item, itemIndex) in conf.topSelectList" :key="itemIndex">
                        <div
                          class="winning-item"
                          @click="conf.handleOpt(item, 'top')"
                          :class="conf.firstSelectInfo.code == item.code ? 'actOpt' : ''"
                          v-if="item.code != conf.secondSelectInfo.code"
                        >
                          <div class="left-user">
                            <!-- <img class="avatar" :src="item.nationalFlag" /> -->
                            <div class="userName">
                              <div class="top-name">
                                <span>{{ item.code }}</span>
                              </div>
                              <!-- <div class="bottom-name">
																 <span>{{coinCode}} </span>
															</div> -->
                            </div>
                          </div>
                          <div class="right-money">
                            <div class="money">
                              {{ item.coinSymbol
                              }}{{ item.walletMoney != '-1.00' ? sutil.dataHandling(item.walletMoney) : '--' }}
                            </div>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex-sub bg-grey padding-sm margin-xs radius">
              <div class="select-text">
                {{
                  $t('swapModule.Balance') + ' : ' + conf.firstSelectInfo.coinSymbol
                    ? conf.firstSelectInfo.coinSymbol
                    : '--'
                }}{{
                  conf.firstSelectInfo.walletMoney != '-1.00'
                    ? sutil.dataHandling(conf.firstSelectInfo.walletMoney)
                    : '--'
                }}
              </div>
            </div>
          </div>

          <!-- 输入框 -->
          <div class="flex">
            <div
              class="flex-sub bg-grey padding-sm margin-xs radius"
              style="
                background-color: #fffbf5 !important;
                border-radius: 10rem;
                height: 100rem;
                line-height: 100rem;
                position: relative;
                border: 1px solid #ddd;
              "
              :style="{
                'background-color':
                  conf.firstSelectInfo.code == 'Current' ? '#f5f5f5 !important' : ' #FFFBF5 !important',
                'border': conf.firstSelectInfo.code == 'Current' ? '1px solid #ddd' : ''
              }"
            >
              <input
                class="uni-input disabeld"
                inputmode="decimal"
                :placeholder="
                  conf.firstSelectInfo.code != 'Current'
                    ? $t('swapModule.placeholderEnterAmount')
                    : 'The amount after currency exchange'
                "
                v-model="conf.topInputValue"
                :disabled="conf.firstSelectInfo.code == 'Current'"
                @input="conf.vfFun($event, 'topInputValue')"
              />
            </div>
          </div>
        </div>

        <!-- change图片 -->
        <div class="flex">
          <div class="flex-sub bg-grey padding-sm margin-xs radius" style="text-align: center">
            <img :src="conf.changeImg" mode="" class="change-img" @click="conf.swapElements" />
          </div>
        </div>

        <div class="bottomView">
          <!-- 选择框 -->
          <div class="flex">
            <div class="flex-sub bg-grey padding-sm margin-xs radius">
              <div
                class="c-flex-align"
                @click="conf.secondSelectInfo.code !== 'Current' ? conf.handleOpenSelect('bottom', $event) : ''"
                data-target="bottomModal"
              >
                <div style="display: flex; align-items: center; justify-items: center">
                  <!-- <img :src="secondSelectInfo.nationalFlag" style="width:40rem;height: 40rem;"
										v-if="conf.secondSelectInfo.nationalFlag" /> -->
                  <img
                    class="imageLog"
                    src="/static/img/bugo.png"
                    mode=""
                    v-if="conf.secondSelectInfo.code == 'BUGO'"
                  />
                  <template v-else>
                    <img
                      v-if="conf.secondSelectInfo.code"
                      class="imageLog"
                      :src="'/static/img/centerWallet/' + conf.secondSelectInfo.code + '.png'"
                      mode=""
                    />
                  </template>
                  <span style="margin-left: 10rem; font-size: 40rem; color: #000000; opacity: 0.7; font-weight: 600">
                    {{ conf.secondSelectInfo.code || '' }}
                  </span>
                </div>
                <!--  <span class="cuIcon-triangledownfill" v-if="!secondPopupShow"> </span>
								 <span class="cuIcon-triangleupfill" v-else> </span> -->
                <span
                  class="cuIcon-triangledownfill"
                  v-if="!conf.secondPopupShow && conf.secondSelectInfo.code !== 'Current'"
                ></span>
                <span
                  class="cuIcon-triangleupfill"
                  v-if="conf.secondPopupShow && conf.secondSelectInfo.code !== 'Current'"
                ></span>
              </div>
              <div class="cu-modal" :class="conf.modalName == 'bottomModal' ? 'show' : ''">
                <div class="cu-dialog">
                  <div class="cu-bar bg-white justify-end">
                    <div class="content">{{ $t('swapModule.SelectCurrency') }}</div>
                    <div class="action" @click="conf.hideModal">
                      <van-icon name="cross" class="cuIcon-close text-red" />
                    </div>
                  </div>
                  <div class="padding-xl">
                    <div class="search-view">
                      <van-icon name="search" class="cuIcon-search" />
                      <input
                        type="text"
                        :placeholder="$t('swapModule.placeholderSearchName')"
                        class="search-input"
                        v-model="conf.bottomSearch"
                        @input="conf.searchIcon('bottom-search', $event)"
                      />
                    </div>
                    <div
                      style="
                        width: 100%;
                        text-align: left;
                        margin: 15rem 0rem;
                        font-size: 28rem;
                        color: #000000;
                        opacity: 0.7;
                        font-weight: 600;
                        margin-left: 30rem;
                      "
                    >
                      {{ $t('swapModule.CurrencyName') }}
                    </div>
                    <div class="winning-box" scroll-y="true" style="max-height: 300rem; height: auto !important">
                      <template v-for="(item, itemIndex) in conf.topSelectList" :key="itemIndex">
                        <div
                          class="winning-item"
                          @click="conf.handleOpt(item, 'bottom')"
                          :class="conf.secondSelectInfo.code == item.code ? 'actOpt' : ''"
                          v-if="item.code != conf.firstSelectInfo.code"
                        >
                          <div class="left-user">
                            <!-- <img class="avatar" :src="item.nationalFlag" /> -->
                            <div class="userName">
                              <div class="top-name">
                                <span>{{ item.code }}</span>
                              </div>
                              <!-- <div class="bottom-name">
																 <span>{{coinCode}} </span>
															</div> -->
                            </div>
                          </div>
                          <div class="right-money">
                            <div class="money">
                              {{ item.coinSymbol
                              }}{{ item.walletMoney != '-1.00' ? sutil.dataHandling(item.walletMoney) : '--' }}
                            </div>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex-sub bg-grey padding-sm margin-xs radius">
              <div class="select-text">
                {{
                  $t('swapModule.Balance') + ' : ' + conf.secondSelectInfo.coinSymbol
                    ? conf.secondSelectInfo.coinSymbol
                    : '--'
                }}{{ conf.secondSelectInfo.walletMoney ? sutil.dataHandling(conf.secondSelectInfo.walletMoney) : '--' }}
              </div>
            </div>
          </div>
          <!-- 输入框 -->
          <div class="flex">
            <div
              class="flex-sub bg-grey padding-sm margin-xs radius"
              style="background-color: #fffbf5 !important; border-radius: 10rem"
              :style="{
                'background-color':
                  conf.secondSelectInfo.code == 'Current' ? '#f5f5f5 !important' : ' #FFFBF5 !important',
                'border': conf.secondSelectInfo.code == 'Current' ? '1px solid #ddd' : ''
              }"
            >
              <input
                class="uni-input"
                inputmode="decimal"
                v-model="conf.bottomInputValue"
                :placeholder="conf.secondSelectInfo.code != 'Current' ? $t('swapModule.placeholderEnterAmount') : ''"
                :disabled="conf.secondSelectInfo.code == 'Current'"
                @input="conf.vfFun($event, 'bottomInputValue')"
              />
            </div>
          </div>
        </div>
        <div
          style="margin-top: 10rem; padding: 10rem; display: flex; align-items: center; font-size: 28rem; opacity: 0.7"
        >
          <!--  <span style="color: #464646;">{{$t('swapModule.Price') + ' : '}} </span> -->
          <span style="margin: 0rem 10rem; color: #717171">
            {{ conf.firstSelectInfo.coinTousdt || '' }}
            <span style="margin: 0rem 5rem 0rem 10rem">{{ conf.firstSelectInfo.coinCode || ' -- ' }}</span>
          </span>
          <!--  <span style="margin: 0rem 10rem;color: #464646;">{{$t('swapModule.per')}} </span> -->
          <span style="margin: 0rem 10rem; color: #717171">≈</span>
          <span style="margin: 0rem 10rem; color: #717171">
            {{ conf.secondSelectInfo.coinTousdt || '' }}
            <span style="margin: 0rem 10rem 0rem 5rem">{{ conf.secondSelectInfo.coinCode || ' -- ' }}</span>
          </span>
        </div>
      </div>
    </div>
    <div class="btn-view">
      <div @click="conf.handleDataSubmit">{{ $t('swapModule.Remittance') }}</div>
    </div>
    <div class="footTip">
      <span>※ Matters needing attention:</span>
      <div class="tips">
        1.In order to ensure that the transfer amount of the third-party game wallet is an integer, the current wallet
        cannot enter the amount
      </div>
      <div class="tips">
        2.Relevant remittance can only be made according to the amount entered in the third-party game wallet
      </div>
    </div>
  </x-page>
</template>

<style scoped lang="less">
.cuIcon-close {
  font-size: 32rem;
}

.justify-end {
  justify-content: flex-end !important;
}

.bg-white {
  background-color: #ffffff;
  color: #666666;
}

.flex-sub {
  flex: 1;
}

.cu-form-group uni-picker .picker {
  text-align: left !important;
}

.bg-grey {
  background-color: #fff !important;
  color: #333 !important;
}

.select-text {
  width: 100%;
  text-align: right;
  color: #717171;
  opacity: 0.5;
  font-size: 24rem;
  font-weight: 500;
}

.padding {
  padding: 20rem !important;
  border-radius: 20rem;
}

.c-flex-align {
  display: flex;
  align-items: center;
}
.imageLog {
  width: 40rem;
  height: 40rem;
}

.icon-triangle {
  width: 16rem;
  height: 16rem;
  margin-left: 10rem;
  font-size: 30rem;
}

.change-img {
  width: 94rem;
  height: 94rem;
  margin: 20rem 0rem;
}

.change3-img {
  margin-left: 15rem;
  width: 30rem;
  height: 30rem;
  transform: rotate(90deg);
}

.uni-input {
  height: 100rem;
  line-height: 100rem;
  font-size: 32rem;
  color: #999793 !important;
  font-weight: bolder !important;
  padding: 0rem 30rem;
  color: #000000;
  opacity: 0.4;
  font-size: 32rem;
}

.all-btn {
  position: absolute;
  top: 0;
  right: 20rem;
  color: #ffa64f;
  font-size: 30rem;
}

.cuIcon-search {
  // padding-top: 10rem;
  margin-right: 10rem;
}

.btn-view {
  margin-top: 50rem;
  width: calc(100% - 60rem);
  background: linear-gradient(180deg, #eb602d 0%, #ffa64f 160%);
  border-radius: 82rem;
  text-align: center;
  color: #fff;
  font-weight: 500;
  font-size: 40rem;
  height: 100rem;
  line-height: 100rem;
  margin-left: 30rem;
}
.footTip {
  padding: 40rem;
  span {
    font-size: 28rem;
    color: #ff2e00;
    font-weight: bold;
    // margin-bottom: 15rem;
  }
  .tips {
    color: #919191;
    font-size: 24rem;
  }
}
.diolog-bottom-view {
  display: flex;
  background-color: #fffbf5 !important;
  padding: 10rem;
  border-radius: 20rem;
}

.search-view {
  background-color: #fffbf5 !important;
  display: flex;
  // height: 48rem;
  // line-height: 48rem;
  border-radius: 38rem;
  align-items: center;
  margin-left: 30rem;
  width: calc(100% - 60rem);
  padding: 10rem;

  .cuIcon-search {
    font-size: 25rem;
    margin-left: 30rem;
  }

  .search-input {
    height: 48rem;
    line-height: 48rem;
    font-size: 25rem !important;
    font-weight: 500;
    color: #00000020;
    width: 100%;
    text-align: left;
  }
}

.diolog-bottom-view {
  margin-top: 20rem;
}

.btn-text {
  position: absolute;
  right: 60rem;
  padding: 0rem 10rem;
  border-radius: 20rem;
  background: linear-gradient(#ed6831, #fc9c4a) !important;
  color: #fff;
}

.winning-box {
  max-height: 480rem;
  // overflow-y: hidden;
  // padding: 0rem 24rem 24rem;
  margin-top: 24rem;
  background: #fff;

  .winning-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 96rem;
    border-bottom: 1px solid #f9fafc;

    .left-user {
      display: flex;
      align-items: center;
      margin-left: 30rem;

      .avatar {
        width: 60rem;
        height: 60rem;
        margin-right: 8rem;
      }

      .userName {
        font-size: 25rem;
        font-weight: 600;
        color: #000000;

        .top-name {
          opacity: 0.7;
        }

        .bottom-name {
          opacity: 0.4;
          font-size: 16rem;
        }
      }
    }

    .right-money {
      text-align: center;
      margin-right: 30rem;

      .money {
        font-size: 30rem;
        padding-right: 10rem;
        color: #000000;
        opacity: 0.8;
        font-weight: 500;
      }

      .amount {
        color: rgb(132, 132, 144);
        font-size: 24rem;
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

.actOpt {
  background: #fffbf5;
}

.cu-dialog {
  border-radius: 50rem;
  box-shadow: 0 2rem 20rem #fffbf5;
  padding-bottom: 30rem;
}

.cu-modal {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.content {
  margin-left: 30rem !important;
  width: 100% !important;
  text-align: left !important;
  font-size: 28rem;
  color: #000000;
  opacity: 0.7;
  font-weight: 600;
}

.padding-sm {
  padding: 0rem !important;
}

.text-red {
  color: #cccccc;
  font-weight: 600;
}

.padding-xl {
  background: #fff;
  padding: 0rem;
}

.cuIcon-triangledownfill,
.cuIcon-triangleupfill {
  margin-left: 6rem;
  font-size: 40rem;
}

.cuIcon-triangledownfill {
  border-top: 8rem solid #000;
  border-left: 8rem solid transparent;
  border-right: 8rem solid transparent;
}

.cuIcon-triangleupfill {
  border-bottom: 8rem solid #000;
  border-left: 8rem solid transparent;
  border-right: 8rem solid transparent;
}
</style>
