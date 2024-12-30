<script setup lang="ts">
import sutil from '@/sstore/sutil'
import { stheme } from '@/sstore/stheme'
import { index } from './exchange'

const conf = index()
</script>

<template>
  <x-page :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>{{ $t('swapModule.titleName') }}</template>
    <div class="box-view">
      <div class="padding bg-white">
        <div class="topView">
          <!-- 选择框 -->
          <div class="left-view">
            <div class="flex-sub bg-grey padding-sm margin-xs radius">
              <div class="c-flex-align" @click="conf.handleOpenSelect('top', $event)" data-target="topModal">
                <div class="wallet-view">
                  <img src="/static/img/USDT.png" v-if="conf.firstSelectInfo.walletCoin == 'USDT'" class="wallet-img" />
                  <img
                    :src="conf.firstSelectInfo.nationalFlag"
                    v-if="conf.firstSelectInfo.nationalFlag && conf.firstSelectInfo.walletCoin != 'USDT'"
                    class="wallet-img"
                  />
                  <span class="wallet-name">{{ conf.firstSelectInfo.walletCoin || '' }}</span>
                </div>
                <van-icon
                  name="arrow"
                  :style="{ transform: !conf.firstPopupShow ? 'rotate(90deg)' : 'rotate(-90deg)' }"
                />
              </div>
              <van-popup :show="conf.modalName == 'topModal'" class="cu-dialog" closeable @close="conf.hideModal">
                <div class="title">{{ $t('swapModule.SelectCurrency') }}</div>
                <div class="padding-xl">
                  <div class="search-view">
                    <van-icon name="search" class="cuIcon-search" />
                    <input
                      type="text"
                      :placeholder="$t('swapModule.placeholderSearchName')"
                      class="search-input"
                      v-model="conf.topSearch"
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
                    {{ $t('otcOrderDetailsModule.Currency') }}
                  </div>
                  <div class="winning-box" style="max-height: 500rem">
                    <div
                      class="winning-item"
                      v-for="(item, itemIndex) in conf.topSelectList"
                      :key="itemIndex"
                      @click="conf.handleOpt(itemIndex, 'top', conf.topSelectList)"
                      :class="item.selected ? 'actOpt' : ''"
                    >
                      <div class="left-user">
                        <img class="avatar" src="/static/img/USDT.png" v-if="item.walletCoin == 'USDT'" />
                        <img class="avatar" :src="item.nationalFlag" v-else />
                        <div class="userName">
                          <div class="top-name">
                            <span>{{ item.walletCoin }}</span>
                          </div>
                          <div class="bottom-name">
                            <span style="color: #bcbcbc">{{ item.coinTousdt }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="right-money">
                        <div class="money">{{ sutil.dataHandling(item.walletMoney) }}</div>
                      </div>
                    </div>
                    <x-no-data v-if="conf.topSelectList.length == 0"></x-no-data>
                  </div>
                </div>
              </van-popup>
            </div>
            <div class="flex-sub bg-grey padding-sm margin-xs radius">
              <div class="select-text">
                {{ $t('swapModule.Balance') + ' : '
                }}{{
                  conf.firstSelectInfo.walletMoney
                    ? conf.firstSelectInfo.coinSymbol + sutil.dataHandling(conf.firstSelectInfo.walletMoney)
                    : '--'
                }}
              </div>
            </div>
          </div>

          <!-- 输入框 -->
          <div class="flex">
            <div class="flex-sub bg-grey padding-sm margin-xs radius">
              <input
                class="uni-input"
                inputmode="decimal"
                :placeholder="$t('common.PleaseEnter')"
                v-model="conf.topInputValue"
                :maxlength="conf.firstSelectInfo.walletMoney && conf.firstSelectInfo.walletMoney.length"
                @input="conf.vfFun($event, 'topInputValue')"
                :disabled="!conf.secondSelectInfo.walletCoin || !conf.firstSelectInfo.walletCoin ? true : false"
              />
            </div>
          </div>
        </div>

        <!-- change图片 -->
        <div class="swap-view">
          <img src="/static/theme/blue/swap.svg" mode="" class="change-img" @click="conf.swapElements" />
        </div>

        <div class="bottomView">
          <!-- 选择框 -->
          <div class="left-view">
            <div class="flex-sub bg-grey padding-sm margin-xs radius">
              <div class="c-flex-align" @click="conf.handleOpenSelect('bottom', $event)" data-target="bottomModal">
                <div class="wallet-view">
                  <img
                    src="/static/img/USDT.png"
                    v-if="conf.secondSelectInfo.walletCoin == 'USDT'"
                    class="wallet-img"
                  />
                  <img
                    :src="conf.secondSelectInfo.nationalFlag"
                    v-if="conf.secondSelectInfo.nationalFlag && conf.secondSelectInfo.walletCoin != 'USDT'"
                    class="wallet-img"
                  />
                  <span class="wallet-name">{{ conf.secondSelectInfo.walletCoin || '' }}</span>
                </div>
                <van-icon
                  name="arrow"
                  :style="{ transform: !conf.secondPopupShow ? 'rotate(90deg)' : 'rotate(-90deg)' }"
                />
              </div>
              <van-popup :show="conf.modalName == 'bottomModal'" class="cu-dialog" closeable @close="conf.hideModal">
                <div class="title">{{ $t('swapModule.SelectCurrency') }}</div>
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
                    {{ $t('otcOrderDetailsModule.Currency') }}
                  </div>
                  <div class="winning-box" scroll-y="true" style="max-height: 500rem">
                    <div
                      class="winning-item"
                      v-for="(item, itemIndex) in conf.bottomSelectList"
                      :key="itemIndex"
                      @click="conf.handleOpt(itemIndex, 'bottom', conf.bottomSelectList)"
                      :class="item.selected ? 'actOpt' : ''"
                    >
                      <div class="left-user">
                        <img class="avatar" src="/static/img/USDT.png" v-if="item.walletCoin == 'USDT'" />
                        <img class="avatar" :src="item.nationalFlag" v-else />
                        <div class="userName">
                          <div class="top-name">
                            <span>{{ item.walletCoin }}</span>
                          </div>
                          <div class="bottom-name">
                            <span style="color: #bcbcbc">{{ item.coinTousdt }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="right-money">
                        <div class="money">{{ sutil.dataHandling(item.walletMoney) }}</div>
                      </div>
                    </div>
                    <x-no-data v-if="conf.bottomSelectList.length == 0"></x-no-data>
                  </div>
                </div>
              </van-popup>
            </div>
            <div class="flex-sub bg-grey padding-sm margin-xs radius">
              <div class="select-text">
                {{ $t('swapModule.Balance') + ' : '
                }}{{
                  conf.secondSelectInfo.walletMoney
                    ? conf.secondSelectInfo.coinSymbol + sutil.dataHandling(conf.secondSelectInfo.walletMoney)
                    : '--'
                }}
              </div>
            </div>
          </div>
          <!-- 输入框 -->
          <div class="flex items-center relative" style="height: 150rem">
            <div class="uni-input row justify-end" style="width: 100%">{{ conf.bottomInputValue }}</div>
            <div class="row" style="height: 100rem; width: 100%">
              <div
                class="swap-info no-wrap row items-center justify-end"
                style="margin: 0; transform: translateY(-14rem); width: 100%"
                v-if="conf.secondSelectInfo.exchangeFee && conf.secondSelectInfo.exchangeFeeVal > 0"
              >
                <span style="text-wrap: nowrap">{{ $t('rechargeModule.ExchangeCharge') }}</span>
                <span style="text-wrap: nowrap" class="simbol">:</span>
                <span style="text-wrap: nowrap">
                  {{ (conf.secondSelectInfo.exchangeFeeVal || 0) + ' ' + conf.secondSelectInfo.coinCode }}
                </span>
              </div>
              <div
                class="swap-info no-wrap row items-center justify-end"
                style="margin: 0; width: 100%"
                :style="{
                  transform: `translateY(-${conf.secondSelectInfo.exchangeFee && conf.secondSelectInfo.exchangeFeeVal > 0 ? 20 : 40}rem)`
                }"
                v-if="conf.secondSelectInfo.exchangeTotal"
              >
                <span style="text-wrap: nowrap">{{ $t('home.total') }}</span>
                <span style="text-wrap: nowrap" class="simbol">:</span>
                <span style="text-wrap: nowrap">
                  {{ (conf.secondSelectInfo.exchangeTotal || 0) + ' ' + conf.secondSelectInfo.coinCode }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="row justify-between">
          <div class="swap-info" v-if="conf.secondSelectInfo.coinCode && conf.firstSelectInfo.coinCode">
            <span>{{ conf.firstNumber + ' ' + conf.firstSelectInfo.coinCode }}</span>
            <span class="simbol">≈</span>
            <span>{{ conf.swapResult + ' ' + conf.secondSelectInfo.coinCode }}</span>
          </div>
        </div>
        <div class="swap-info" v-if="conf.secondSelectInfo.coinCode && conf.firstSelectInfo.coinCode">
          <span>{{ $t('rechargeModule.notice') }}:</span>
          <span style="margin-left: 6rem">{{ $t('rechargeModule.specific') }}</span>
        </div>
      </div>
    </div>
    <div class="btn-view">
      <div @click="conf.handleDataSubmit">{{ $t('swapModule.Remittance') }}</div>
    </div>
  </x-page>
</template>

<style scoped lang="less">
.cu-form-group uni-picker .picker {
  text-align: left !important;
}
.bg-grey {
  background-color: #fff !important;
  color: #333 !important;
}

.select-text {
  width: 100%;
  // text-align: right;
  color: #aaaaaa;
  // opacity: 0.5;
  font-size: 26rem;
  font-weight: 500;
}

.padding {
  padding: 56rem 28rem !important;
  border-radius: 20rem;
  background-color: transparent !important;
}
.c-flex-align {
  display: flex;
  align-items: center;
}

.icon-triangle {
  width: 16rem;
  height: 16rem;
  margin-left: 10rem;
  font-size: 30rem;
}

.change-img {
  width: 120rem;
  height: 120rem;
  margin: 20rem 0rem;
}

.change3-img {
  margin-left: 15rem;
  width: 30rem;
  height: 30rem;
  transform: rotate(90deg);
}

.uni-input {
  width: 100%;
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

.cuIcon-search {
  margin-right: 10rem;
}

.btn-view {
  width: calc(100% - 60rem);
  background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
  border-radius: 82rem;
  text-align: center;
  color: #fff;
  font-weight: 500;
  font-size: 40rem;
  height: 100rem;
  line-height: 100rem;
  margin-left: 30rem;
}

.diolog-bottom-view {
  display: flex;
  background-color: #fffbf5 !important;
  padding: 10rem;
  border-radius: 20rem;
}

.search-view {
  background: #f6f7fa;

  // background-color: #fffbf5 !important;
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
    color: #000000;
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
  overflow-y: auto;

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
        text-align: left;
        margin-left: 10rem;
        .top-name {
          opacity: 0.7;
        }
        .bottom-name {
          // opacity: 0.4;
          font-size: 22rem !important;
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
  background: #f6f7fa;
}

.cu-dialog {
  max-width: 750rem !important;
  width: 90%;
  border-radius: 50rem;
  box-shadow: 0 2rem 20rem #fffbf5;
  padding-bottom: 30rem;
  overflow-y: hidden;

  .title {
    height: 57px;
    display: flex;
    align-items: center;
    padding-left: 30rem !important;
    font-size: 28rem;
    color: #000000;
    opacity: 0.7;
    font-weight: 600;
  }
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
  font-size: 40rem;
}

.topView,
.bottomView {
  border-radius: 40rem;
  background: #ffffff;
  overflow: hidden;
  display: flex;
  height: 244rem;
  align-items: center;
  justify-content: space-between;
  padding: 40rem;
  width: 100% !important;
}

.left-view {
  min-width: 306rem !important;
}

.wallet-view {
  display: flex;
  align-items: center;
  justify-items: center;
}

.wallet-img {
  width: 40rem;
  height: 40rem;
}

.wallet-name {
  margin-left: 16rem;
  font-size: 48rem;
  color: #000000;
  font-weight: 600;
}

.flex-sub .bg-grey .padding-sm .margin-xs .radius {
  height: 100rem;
  line-height: 100rem;
}

.uni-input {
  text-align: right !important;
  font-size: 48rem !important;
  font-weight: 600 !important;
  color: #000000 !important;
  opacity: 1;
  padding: 0 !important;
}

input::placeholder {
  opacity: 0.4 !important;
  font-size: 26rem !important;
}

.swap-view {
  margin: -45rem 0rem;
  width: 100%;
  text-align: center;
}

.swap-info {
  font-size: 22rem;
  font-weight: 500;
  opacity: 0.4;
  color: #000000;
  margin: 30rem 0rem 0rem 25rem;
}

.simbol {
  margin: 0rem 10rem;
}

.cuIcon-right {
  margin-left: 12rem;
  color: #000000;
  font-weight: bolder;
}
</style>
