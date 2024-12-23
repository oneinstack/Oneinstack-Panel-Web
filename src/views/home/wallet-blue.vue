<template>
    <x-page no-header tabbar>
      <template #top>
        <x-statusbar background="#336cff "/>
        <div class="w-head">
          <img class="head-bg" src="/static/theme/blue/bg-square.webp" />
          <!-- 总金额和通知 -->
          <div class="head-info">
            <div class="l-content">
              <img class="l-img" :src="sconfig.userInfo && sconfig.userInfo.userImgUrl" />
              <div class="l-total">
                <div class="title">{{ $t('wallet.topTitle') }}</div>
                <div class="num">
                  <span>{{ conf.openEye == 'open' ? conf.defaultCoin.coinSymbol + sutil.dataHandling(conf.total_money) :
                    conf.str_money }}</span>
                  <img class="eye-img" @click="conf.changeTotalEye" :src="`/static/img/wallet/eye-${conf.openEye}.png`" />
                </div>
              </div>
            </div>
            <div class="r-notice" @click="conf.handleNoticeClick" v-if="conf.noticeNum > 0">
              <img class="notice-img" src="/static/img/wallet/notice.png" />
              <div class="badge">{{ conf.noticeNum }}</div>
            </div>
          </div>
          <div class="center-box">
            <!-- swiper -->
            <swiper-wallet-blue v-if="conf.swiperList.length" :swiperList="conf.swiperList" :defaultCoin="conf.defaultCoin"
                @eyeClick="conf.handleWalletEyeClick" @swiper="conf.cardSwiper" @changeDefault="conf.handleDefaultwallet"
                @addWallet="conf.handleAddWallet"></swiper-wallet-blue>
            <!-- 充值、提现、转入、汇兑 -->
            <div class="select">
                <div class="select-item" @click="conf.handleCilckImg('Recharge', $event)">
                <img src="/static/theme/blue/recharge.webp" />
                <span>{{ $t('wallet.Recharge') }}</span>
                </div>
                <div class="select-item" @click="conf.handleCilckImg('Withdraw', $event)">
                <img src="/static/theme/blue/withdrawal.webp" />
                <span>{{ $t('wallet.Withdrawal') }}</span>
                </div>
                <div class="select-item" @click="conf.handleCilckImg('Remittance', $event)"
                v-show="conf.userWalletList.length > 1">
                <img src="/static/theme/blue/remittance.webp" />
                <span>{{ $t('wallet.Remittance') }}</span>
                </div>
                <div class="select-item" @click="conf.handleCilckImg('CentralWallet', $event)">
                <img src="/static/theme/blue/central.webp" />
                <span>{{ $t('wallet.central') }}</span>
                </div>
            </div>
          </div>
        </div>
        <div style="height: 24rem;"></div>
      </template>
      <!-- 消费记录详情 -->
      <div class="winning-box" style="width: 100%;" v-if="conf.detailData.length > 0">
        <div class="winning-item" v-for="(item, itemIndex) in conf.detailData" :key="itemIndex"
          @click="conf.handleDetailView(item)">
          <div class="content">
            <div class="left-user">
              <div class="userName" :class="item.tradeStatus == -1 ? 'hasOp' : ''">
                <div>
                  <!-- 判断是否首充/首提 -->
                  <span>{{ item.firstRecharge == 1 ? $t('wallet.FirstRecharge') : (item.firstPayouts == 1 ?
                    $t('wallet.FirstWithdrawal') : item.tradeTypeName) }}</span>
                  <!-- 交易中 -->
                  <span
                    v-if="(item.tradeStatus == 0 && item.tradeType == 2) || (item.tradeStatus == 2 && item.tradeType == 1) || (item.tradeStatus == 7 && (item.tradeType == 1 || item.tradeType == 2)) || item.tradeStatus == 5">
                    {{ '(' + $t('wallet.wait') + ')' }}
                  </span>
                  <span v-else-if="item.tradeStatus == 1 && item.recordMark == 1">{{ ' (' +
                    $t('otcOrderModule.dispute') + ')' }}</span>
                </div>
                <div>
                  <span style="opacity: 0.4;font-size:20rem;">{{ item.tradeTime }}</span>
                </div>
              </div>
            </div>
            <div class="right-money" :class="item.tradeStatus == -1 ? 'hasOp' : ''">
              <div class="money"
                :class="[item.firstRecharge == 1 ? 'orange' : item.tradeStatus == 0 || item.tradeStatus == 2 || item.tradeStatus == 3 || item.tradeStatus == 5 || item.tradeStatus == 4 || item.tradeStatus == 7 ? 'blue' : item.tradeStatus == 1 ? 'green' : 'red']">
                <!-- {{ item.coinSymbol=='USDT'?item.symbol+ item.coinSymbol +' '+ item.money: item.symbol+ item.coinSymbol + item.money}} -->
                <!-- 处理异常订单 -->
                <span v-if="item.tradeStatus == 7">
                  {{ item.tradeType == 1 ? item.symbol + item.coinSymbol + item.actualMoney : '' }}
                </span>
                <!-- 异常->成功 -->
                <span v-if="item.recordMark == 1 && item.tradeStatus != 7" style="color: #FFA12D;">
                  {{ item.tradeType == 1 ? item.symbol + item.coinSymbol + item.actualMoney : '' }}
                </span>
                <!-- 其他 -->
                <span v-if="item.recordMark != 1 && item.tradeStatus != 7">
                  {{ item.coinSymbol == 'USDT' ? item.symbol + item.coinSymbol + ' ' + item.money : item.symbol +
                    item.coinSymbol + item.money }}
                </span>
  
                <div v-if="item.tradeStatus == -1" class="hasLine"></div>
              </div>
            </div>
          </div>
          <!-- <div v-if="item.tradeStatus == -1" class="line"></div> -->
        </div>
      </div>
      <div v-if="conf.detailData.length == 0" class="noConsumptionRecords">
        {{ $t('wallet.noConsumptionRecordsTip') }}
      </div>
      <add-wallet v-if="conf.isShowCustomPopup" @sendData="conf.getPopupData"
        @dialogDataSubmit="conf.handleAddWlletSubmit">
      </add-wallet>
      <!-- 银行卡绑定提示框-->
      <cuModal :showNumberBox="conf.showNumberBox" @handleCloseBindDialog='conf.handleCloseBindDialog' />
    </x-page>
  </template>
  <script setup lang="ts">
  import { apis } from '@/api'
  import sconfig from '@/sstore/sconfig';
  import sutil from '@/sstore/sutil';
  import { svalue } from '@/sstore/svalue';
  import System from '@/utils/System';
  import i18n from '@/lang';
  import { onMounted, reactive } from 'vue'
  import addWallet from "./components/addWallet-blue.vue"
  import cuModal from "./components/cuModal.vue"
  import swiperWalletBlue from "./components/swiperWallet.vue"
  import { Scope } from 'tools-vue3';
  import { EPage } from '@/enum/Enum';
  const conf = reactive({
    openEye: 'open',
    total_money: 0,
    str_money: '******',
    swiperList: [] as any[], //货币列表
    userWalletList: [] as any[], //用户钱包列表
    detailData: [] as any[], //消费记录
    modalName: null,
    pageNum: 1,
    pageSize: 20,
    total: 0,
    isMore: false,
    noticeNum: 0, //小铃铛通知
    isRefash: false,
    scrollViewHeight: 300,
    isShowCustomPopup: false,
    addWalletInfo: {
      coinCode: ''
    },
    defaultCoin: {
      coinSymbol: '',
      coinCode: '',
      coinTousdt: ''
    }, //接口返回默认币种钱包
    list: [],
    cardCur: 100,
    showNumberBox: false,
    currentWallet: '',
    isShake: false,
    flag: false,
    defaultWalletInfo: {
      currentIndex: 0,
      coinCode: ''
    } as any,
    changeTotalEye() {
  
      conf.openEye = conf.openEye == 'open' ? 'close' : 'open'
      Cookie.set('showTotalWallet', conf.openEye)
    },
    handleNoticeClick() { },
    async cardSwiper(e: any) {
      
      conf.cardCur = e
      let val = conf.cardCur
      conf.pageNum = 1
      conf.detailData = []
      
      if (conf.swiperList[val]?.hasWallet) {
        // 更新钱包余额数据
        let wlist = await svalue.getWalletlist()
        let item = wlist.find((cur: any) => cur.walletCoin == conf.swiperList[val].walletCoin)
        if (item) conf.swiperList[val].walletMoney = item.walletMoney
  
        conf.defaultWalletInfo = conf.swiperList[val] || {}
        conf.defaultWalletInfo.currentIndex = val
        Cookie.set('currentWallet', conf.swiperList[val].coinCode)
        conf.pageNum = 1
        conf.detailData = []
        conf.getConsumptionRecords()
        // if (sconfig.userInfo.defaultWalletId != appObj.globalData.defaultWalletInfo.id) {
        // 	conf.handleDefaultwallet()
        // }
      }
  
    },
    handleAddWallet(e: any) {
      conf.isShowCustomPopup = true
      conf.addWalletInfo = e.obj
      conf.cardCur = e.index
    },
    //银行卡小眼睛click事件
    handleWalletEyeClick(obj: any, index: any) {
      conf.swiperList[index].openEye = !obj.openEye
      obj.hidden_amount = '*'.repeat(obj.coinTousdt.length)
    },
    handleDefaultwallet() {
      apis.defaultwallet({
        coinCode: conf.defaultWalletInfo.coinCode,
        success: (res: any) => {
          sconfig.userInfo.defaultWalletId = conf.defaultWalletInfo.id
          Cookie.set('userInfo', sconfig.userInfo)
        }
      });
    },
    handleLockClick() { },
    handleCilckImg(type: any, e: any) {
      conf.isRefash = true
      Cookie.set('userWalletList', conf.userWalletList)
      switch (type) {
        //充值
        case 'Recharge':
          if (conf.userWalletList.length == 0) {
            System.toast(i18n.t('wallet.noWalletTip'))
          } else {
            System.router.push('/user/wallet/Recharge')
          }
          break;
        //提现
        case 'Withdraw':
          let coin = conf.swiperList.find(item => item.id == sconfig.userInfo.defaultWalletId)?.walletCoin
          apis.hasPaymentType({
            coin: conf.defaultWalletInfo.walletCoin || conf.defaultWalletInfo.coinCode || coin,
            success: (res: any) => {
              if (res.data) {
                System.router.push('/user/wallet/withDraw')
              } else {
                conf.showNumberBox = true
              }
            }
          });
          break;
        //转入
        case 'Shift-to':
          conf.modalName = e.currentTarget.dataset.target
          break;
  
        //汇兑
        case 'Remittance':
          System.router.push('/user/wallet/exchange')
          break;
        //中心钱包
        case 'CentralWallet':
          System.router.push('/user/wallet/centerWallet')
          break;
      }
    },
    handleCloseBindDialog() {
      conf.showNumberBox = false
    },
    moreMessage() {
      conf.isMore = true
      if (conf.pageSize * conf.pageNum >= conf.total) {
        conf.isMore = false
        return
      }
      conf.pageNum++;
      conf.getConsumptionRecords();
    },
    handleDetailView(obj: any) {
      conf.isRefash = false
      Cookie.set('DetailViewInfo', obj)
      System.router.push('/user/wallet/consumptionDetails?obj=' + obj)
    },
    getPopupData(res: boolean) {
      conf.isShowCustomPopup = res
    },
    //自定义父组件函数 ==> 添加钱包提交数据
    handleAddWlletSubmit() {
      apis.createwallet({
        coinCode: conf.addWalletInfo.coinCode,
        success: (res: any) => {
          System.toast(i18n.t(`code.${res.code}`), 'success')
          svalue.walletlist = []
          conf.isShowCustomPopup = false
          // conf.currentWallet = conf.addWalletInfo.coinCode
          conf.getWalletList(null, conf.addWalletInfo)
        }
      });
    },
    //获取用户钱包消费记录-转账记录
    async getConsumptionRecords() {
      let info = await svalue.getAppConfiguration()
      conf.isMore = false
      let addNumType = [1,3,5,6,8,10,12,13,15,20,21,22,23,24,25,26,27,28,29,30,31,32,33]
      //获取当前钱包的消费记录
      apis.trade({
        coinCode: conf.defaultWalletInfo.walletCoin || conf.defaultWalletInfo.coinCode,
        current: conf.pageNum,
        size: conf.pageSize,
        success: (res: any) => {
          res.data.records?.forEach((item: any) => {
            if ( addNumType.includes(item.tradeType)) {
              item.symbol = ' + '
            } else {
              item.symbol = ' - '
            }
            item.tradeTypeName = i18n.t(`tradeType.${item.tradeType}`)
            if (item.tradeType == 13 || item.tradeType == 14 || item.tradeType ==
              15) item.tradeTypeName =
                info.app_name + ' ' + i18n.t(`tradeType.${item.tradeType}`)
  
            //当地标准时间
            item.tradeTime = sutil.getTime(item.tradeTime)
  
            item.money = sutil.dataHandling(item.money)
  
            //标识
            item.coinSymbol = ''
  
          })
          conf.detailData = [...conf.detailData, ...res.data.records]
          conf.total = res.data.total || 0
        }
      })
    },
    //获取用户钱包列表
    getWalletList(arr: any, obj: any) {
      if (arr == null) {
        arr = conf.swiperList
      }
  
      apis.walletlist({
        success: (res: any) => {
          conf.userWalletList = res.data || []
          conf.userWalletList?.forEach((item: any) => {
            let index = arr.findIndex((into: any) => into.coinCode == item.walletCoin)
            arr[index] = {
              ...item,
              ...arr[index]
            }
          })
  
          conf.total_money = 0
          let newArr = conf.swiperList || []
          arr.forEach((item: any, itemIndex: any) => {
            item.hasWallet = false
            if (item.hasOwnProperty('walletMoney')) {
              item.hasWallet = true
              // conf.$set(item,'openEye',true)
              item.defaultCoinMoney = sutil.division(sutil.Mul(item
                .walletMoney, conf.defaultCoin.coinTousdt),
                item.coinTousdt)
              conf.total_money = sutil.addNum(conf.total_money, item
                .defaultCoinMoney)
  
              item.hidden_amount = '*'.repeat(item.coinTousdt.length)
  
              if (newArr.length == 0) {
                item['openEye'] = true
              } else {
                item['openEye'] = newArr[itemIndex]
                  ?.openEyee
              }
            }
          })
          //当前钱包
          let newIndex = arr.findIndex((item: any) => item.coinCode == conf.currentWallet)
            if (newIndex != -1) {
              conf.cardCur = newIndex
            } else {
              conf.cardCur = arr.findIndex((item: any) => item.id == sconfig.userInfo.defaultWalletId)
            }
          if(conf.cardCur) {
            arr.unshift(...arr.splice(conf.cardCur, 1));
          }
          conf.swiperList = arr
          let val = conf.swiperList.findIndex(v => v.coinCode == conf.addWalletInfo.coinCode)
          if (val != -1) {
            conf.defaultWalletInfo = conf.swiperList[val] || {}
            conf.defaultWalletInfo.currentIndex = val
          }
        }
      })
    },
  })
  
  const init = async () => {
    let clist = await svalue.getCoinlist()
    conf.defaultWalletInfo = await svalue.getDefaultWallet()
    conf.swiperList = clist.filter(v => v.isOpen)
    conf.defaultCoin = clist.find(item => item.isDefault)
    conf.currentWallet = conf.defaultWalletInfo.coinCode
    conf.getWalletList(conf.swiperList, null)
    conf.getConsumptionRecords()
    conf.openEye = Cookie.get('showTotalWallet') || 'open'
    // const res = await apis.getTime()
    // const res1 = await apis.signinRecordList({
    //   final: (config, xhr) => {
    //     console.log('config', config)
    //     console.log('xhr', xhr)
    //   }
    // })
  }
  onMounted(() => {
    System.loading(false)
    init()
  })
  const event = Scope.Event()
  event.on(EPage.scrollBottom, () => {
    conf.moreMessage()
  })
  </script>
  <style lang="less" scoped>
  .w-head {
    width: 100%;
    position: relative;
    min-height: 650rem;
    // height: 702rem;
    overflow: hidden;
  
    .head-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 392rem;
      background: linear-gradient(#336cff 0%, #336cfffc 51%, rgba(255, 166, 79, 0) 100%);
    }
  
    .head-info {
      padding: 30rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 9;
  
      .l-content {
        display: flex;
        align-items: center;
  
        .l-img {
          margin-right: 16rem;
          width: 80rem;
          height: 80rem;
          border-radius: 50%;
        }
  
        .l-total {
          color: #fff;
          font-weight: 600;
          font-size: 32rem;
  
          .num {
            font-size: 28rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            margin-top: 10rem;
  
            .eye-img {
              margin-left: 10rem;
              width: 28rem;
              height: 20rem;
            }
          }
        }
      }
  
      .r-notice {
        position: relative;
        display: flex;
        justify-content: center;
  
        .notice-img {
          width: 50rem;
          height: 50rem;
        }
  
        .badge {
          position: absolute;
          top: -5px;
          background: #dd514c;
          height: 15px;
          padding: 0 5px;
          color: #FFF;
          border-radius: 8px;
          font-size: 11px;
        }
      }
    }

    .center-box{
        height: 530rem;
        .select {
            position: absolute;
            bottom: 0;
            height: 334rem;
            width: 100%;
            background: #FFFFFF;
            border-radius: 16rem;
            display: flex;
        
            .select-item {
            flex: 1;
            display: flex;
            justify-content: end;
            align-items: center;
            flex-direction: column;
            margin-bottom: 20rem;
        
            img {
                width: 108rem;
                height: 108rem;
            }
        
            span {
                color: #000000;
                font-size: 26rem;
                font-weight: 600;
                letter-spacing: -0.3px;
                // margin-top: 16rem;
            }
            }
        }

    }



  }
  
  
  .noConsumptionRecords {
    width: 100%;
    padding: 30rem;
    text-align: center;
    background: #fff;
    font-weight: bolder;
  }
  
  .winning-box {
    // overflow-y: hidden;
    padding: 0rem 24rem;
    background: #fff;
  
    .winning-item {
      position: relative !important;
      // .line{
      // 	width: 100%;
      // 	height: 10rem;
      // 	position: absolute !important;
      // 	background: #999 !important;
      // 	top: calc(50% - 5rem);
      // }
    }
  
  
  
    .content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 112rem;
      border-bottom: 3px solid #F9FAFC;
  
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
  
        .userName {
          color: rgb(132, 132, 144);
          font-size: 28rem;
          position: relative;
  
          span {
            color: #000000;
            font-weight: 500;
          }
        }
      }
  
      .right-money {
        text-align: right;
  
        .money {
          font-size: 32rem;
          padding-right: 10rem;
          font-weight: 500;
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
        color: #FFFFFF;
        font-size: 28rem;
      }
    }
  
  }
  
  // 充值弹窗
  .text-white {
    display: none !important;
  }
  
  
  .blue {
    color: #3C80F5;
  }
  
  .green {
    color: #2AA855;
  }
  
  .red {
    color: #E20000;
  }
  
  .hasLine {
    width: 100%;
    height: 4rem;
    position: absolute !important;
    background: #999 !important;
    top: calc(50% - 2rem);
  }
  
  .cu-load.loading::after {
    content: "loading...";
  }
  
  .bg-grey {
    background-color: #fff;
    color: #000000;
  }
  
  .cu-load.over::after {
    content: "There's nothing more left";
  }
  
  .hasOp {
    opacity: 0.5;
  }
  
  .yellow {
    color: #FFD7A3;
  }
  
  .orange {
    color: #f68740 !important;
  }
  </style>
  