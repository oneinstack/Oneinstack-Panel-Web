<script setup lang="ts">
import { apis } from '@/api'
import i18n from '@/lang'
import sapp from '@/sstore/sapp'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { computed, onMounted, reactive } from 'vue'

const conf = reactive({
  bankCardList: [
    // {
    // 	bankLogo:'/static/img/minutes5.png',
    // 	paymentPlatformType:1,
    // 	paymentData:{
    // 		bankCode:'bankCode',
    // 		bankCardNum:'123456789',
    // 	},
    // },
  ] as any[],
  modalName: null,
  listTouchStart: 0,
  listTouchDirection: null as string | null,
  payObj: [],
  PayName: '',
  menthodsList: [] as any[],
  userPayMethodId: '',
  modalName2: null as string | null,
  modalShow: computed<boolean>({
    get: () => conf.modalName2 === 'deleteModal',
    set: (val: boolean) => {
      conf.modalName2 = val ? 'deleteModal' : null
    }
  }),

  // 鼠标移入移出事件
  handleMouseEvent(type: any, e: any) {
    switch (type) {
      case 'enter':
        conf.listTouchDirection = 'left'
        conf.modalName = e.currentTarget.dataset.target
        break
      case 'leave':
        conf.listTouchDirection = 'right'
        conf.modalName = null
        break
    }
  },

  getpayMethodList() {
    conf.menthodsList = [
      {
        img: '/static/img/banckCard3.png',
        payMethodCode: 'USDT_PAYMENT'
      },
      {
        img: '/static/img/banckCard5.png',
        payMethodCode: 'ONLINE_PAYMENT'
      },
      {
        img: '/static/img/banckCard7.png',
        payMethodCode: 'SCAN_CODE_PAYMENT'
      },
      {
        img: '/static/img/banckCard8.png',
        payMethodCode: 'BANK_CARD_PAYMENT'
      }
    ]
  },

  //获取银行卡列表
  loadBank() {
    System.loading()
    apis.userPaymentType({
      success: (res: any) => {
        if (res.code == 200) {
          conf.bankCardList = res.data || []
          conf.bankCardList?.forEach((item, index) => {
            let a = item.payDataType.indexOf('_')
            item._payDataType = item.payDataType.slice(0, a)
            item.paymentData = JSON.parse(item.paymentData)

            let arr = conf.menthodsList.findIndex((v: any) => {
              return v.payMethodCode == item.payDataType
            })
            item._banckCardImg = conf.menthodsList[arr].img
            if (item.paymentData.bankCardNum) {
              let str1 = item.paymentData.bankCardNum
              item.paymentData.newBankCardNum = sutil.plusXing(str1, 0, 4, '*')
            }
            if (item.paymentData.paymentName) {
              let str2 = item.paymentData.paymentName
              item.paymentData._paymentName = sutil.plusXing(str2, 0, 4, '*')
            }
            if (item.paymentData.onlinePayName) {
              let str3 = item.paymentData.onlinePayName
              item.paymentData.newOnlinePayName = sutil.plusXing(str3, 0, 4, '*')
            }
          })
        } else {
          System.toast(i18n.t(`code.${res.code}`) || 'fail')
        }
      },
      complete: () => {
        System.loading(false)
      }
    })
  },

  //返回
  goBack() {
    sutil.pageBack()
  },

  // ListTouch触摸开始
  ListTouchStart(e: any) {
    conf.listTouchStart = e.touches[0].pageX || e.clientX
  },

  // ListTouch计算方向
  ListTouchMove(e: any) {
    let val = e.touches[0]?.pageX || e.clientX
    conf.listTouchDirection = val - conf.listTouchStart > 0 ? 'right' : 'left'
  },

  // ListTouch计算滚动
  ListTouchEnd(e: any) {
    if (conf.listTouchDirection == 'left') {
      conf.modalName = e.currentTarget.dataset.target
    } else {
      conf.modalName = null
    }
    conf.listTouchDirection = null
  },

  // btns => click事件
  handleBtns(obj: any, type: any) {
    switch (type) {
      //编辑
      case 'edit':
        sapp.tempData.BankCardInfo = obj
        sapp.tempData.BankCardType = 'edit'
        System.router.push('/user/me/addBankCard')
        break
      //删除
      case 'delete':
        conf.modalName2 = 'deleteModal'
        conf.userPayMethodId = obj.userPayMethodId
        break
    }
  },

  // 确定删除该支付方式btn
  handleSureDelete() {
    apis.unbindPaymentType({
      userPaymentTypeId: conf.userPayMethodId,
      success: (res: any) => {
        conf.modalName2 = null
        if (res.code == 200) {
          System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
          conf.loadBank()
        } else {
          System.toast(i18n.t(`code.${res.code}`))
        }
      }
    })
  },

  // 添加银行卡
  handleAddBankCard() {
    sapp.tempData.BankCardInfo = null
    sapp.tempData.BankCardType = 'add'
    System.router.push('/user/me/addBankCard')
  }
})

onMounted(() => {
  conf.getpayMethodList()
  conf.loadBank()
})
</script>

<template>
  <x-page no-footer>
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
        <div class="padding-xl" style="padding: 50rem; text-align: center;">
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
  background-color: #f17638;
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
  background-color: #fff2df;
  color: #000000;
  opacity: 0.7;
}
</style>
