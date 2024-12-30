<script setup lang="ts">
import { index } from './bankCard'
import stheme from '@/sstore/stheme'

const conf = index()
</script>

<template>
  <x-page no-footer :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>{{ $t('bankCradModule.titleName') }}</template>
    <!-- content -->
    <div class="content-view">
      <!-- 银行卡列表 -->
      <div class="cu-list menu-avatar">
        <div
          v-for="(item, index) in conf.bankCardList"
          :key="index"
          class="cu-item"
          :class="conf.modalName == 'move-box-' + index ? 'move-cur' : ''"
          @touchstart.passive="conf.ListTouchStart"
          @touchmove.passive="conf.ListTouchMove"
          @touchend.passive="conf.ListTouchEnd"
          :data-target="'move-box-' + index"
          @mouseenter="conf.handleMouseEvent('enter', $event)"
          @mouseleave="conf.handleMouseEvent('leave', $event)"
        >
          <div class="bg-box">
            <img class="menu-item--bg" :src="item.payPlatformIcon" v-if="item.payPlatformIcon" />
            <img class="menu-item--bg" :src="item._banckCardImg" v-else />
          </div>
          <div class="card-name">
            <div class="left">
              <img class="logo-img" :src="item.bankIcon" v-if="item.bankIcon" />
              <img class="logo-img" src="/static/img/banckLog.png" v-else />
              {{ item.bankName }}
            </div>
            <!-- <div class="rit">{{ item._payDataType }}</div> -->
          </div>
          <div class="code">
            {{
              item.paymentData.newBankCardNum ||
              item.paymentData._paymentName ||
              item.paymentData.newOnlinePayName ||
              item.paymentData.USDTAgreement
            }}
          </div>
          <!-- <div class="bankcard">{{item.[payObj[PayName]]}}</div> -->
          <!-- <div class="bankcard" v-if="item.payDataType == 'BANK_CARD_PAYMENT'">{{item.paymentData[item._bankName]}}</div> -->

          <div class="move">
            <div class="bg-red">
              <img src="/static/img/delete.png" class="icon-img" @click="conf.handleBtns(item, 'delete')" />
              <img src="/static/img/edit.png" class="icon-img" @click="conf.handleBtns(item, 'edit')" />
            </div>
          </div>
        </div>
      </div>
      <!-- 添加银行卡 -->
      <div class="add-bank-view" @click="conf.handleAddBankCard">
        <van-icon name="plus" />
        <span>{{ $t('bankCradModule.addBank') }}</span>
      </div>

      <!-- 删除提示框 -->
      <van-popup v-model:show="conf.modalShow" class="cu-modal-x">
        <div class="padding-xl" style="padding: 50rem; text-align: center">
          <div style="font-size: 36rem; opacity: 0.8; color: #828282">{{ $t('bankCradModule.deleteTip') }}</div>
        </div>
        <!-- btns -->
        <div class="modal-btn-view">
          <div class="left-btn" @click="conf.modalName2 = null">{{ $t('otcOrderDetailsModule.No') }}</div>
          <div class="right-btn" @click="conf.handleSureDelete">{{ $t('otcOrderDetailsModule.Yes') }}</div>
        </div>
      </van-popup>
    </div>
  </x-page>
</template>

<style scoped lang="less">
.content-view {
  width: 100%;
  padding: 30rem;

  .cu-list {
    .cu-item {
      width: 100%;
      height: 240rem;
      border-radius: 20rem;
      font-weight: 500;
      margin-bottom: 25rem;
      // background-color: initial;
      position: relative;
      // background: url('/static/img/bankcard.png');
      background-size: cover;
      // 核心代码：
      // -webkit-filter: brightness(0.8);
      // filter: brightness(0.8);
      color: #fff;
      // overflow: hidden;
      transition: all 0.6s ease-in-out 0s;
      transform: translateX(0);
      position: relative;
      display: flex;
      background-color: #ffffff;
      justify-content: flex-end;
      align-items: center;

      &.move-cur {
        transform: translateX(-260rem);
      }

      &.menu-avatar {
        overflow: hidden;
      }

      .bank-img {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        // 	// margin-right: 10rem;
        // 	// width: 90rem;
        // 	// height: 100%;
        // 	width: 100%;
        // 	height: 240rem;
        // 	opacity: 0.5;
        // 	border-radius: 20rem;
        // 	// border-radius: 50%;
        // 	// object-fit: contain;
      }

      .bankcard {
        position: absolute;
        right: 22rem;
        bottom: 34rem;
        font-size: 28rem;
      }

      .card-name {
        width: 100%;

        position: absolute;
        top: 30rem;
        left: 20rem;
        font-size: 32rem;
        // color: #000000;
        font-weight: 500;
        align-items: center;
        display: flex;
        justify-content: space-between;
        color: #fff;

        .left {
          vertical-align: middle;
          display: flex;
          align-items: center;
        }

        .rit {
          margin-right: 30rem;
        }

        // mix-blend-mode: overlay;
        // mix-blend-mode: soft-light;
        .logo-img {
          width: 50rem;
          height: 50rem;
          border-radius: 50%;
          margin-right: 10rem;
        }
      }

      .code {
        // position: absolute;
        // top: 130rem;
        // left: 100rem;
        font-weight: 500;
        color: #000000;
        font-size: 48rem;
        opacity: 0.9;
        margin: 0 auto;
        color: #fff;
        // mix-blend-mode: overlay;
        // mix-blend-mode: soft-light;
      }

      .bg-box {
        width: 100%;
        height: 240rem;
        position: absolute;
        top: 0rem;
        left: 0rem;
        overflow: hidden;
        border-radius: 20rem;

        .menu-item--bg {
          width: 100%;
          height: 100%;
          // filter: blur(90rem);
          background-repeat: no-repeat;
          background-size: cover;
        }
      }
    }
  }

  .add-bank-view {
    color: #000000;
    font-weight: 500;
    font-size: 40rem;
    width: 100%;
    height: 240rem;
    background: #fff;
    border-radius: 20rem;
    // line-height: 240rem;
    // text-align: center !important;
    display: flex;
    align-items: center;
    justify-content: center !important;
    // justify-items: center;
  }
}

.bg-red {
  background: transparent !important;
  font-size: 40rem;
  color: #000000;
}

.cu-list.menu-avatar > .cu-item {
  padding: 0rem !important;
}

.cu-list > .cu-item .move {
  position: absolute;
  right: 0;
  display: flex;
  width: 260rem;
  height: 100%;
  transform: translateX(100%);
}

.cu-list > .cu-item .move div {
  display: flex;
  flex: 1;
  justify-content: space-around;
  align-items: center;
}

.icon-img {
  width: 40rem;
  height: 40rem;
}

.cu-modal-x {
  border-radius: 40rem;
  width: 560rem;
  box-shadow: 0 2rem 10rem #fffbf5;
}

.modal-btn-view {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 50rem;
}

.left-btn,
.right-btn {
  text-align: center;
  background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
  color: #fff;
  border-radius: 80rem;
  font-size: 26rem;
  font-weight: 600;
  height: 52rem;
  line-height: 52rem;
  min-width: 132rem;
  padding: 0rem 20rem;
}

.left-btn {
  background: #e6f2ff;
  color: #006fff;
}
</style>
