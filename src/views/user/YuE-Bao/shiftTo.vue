<template>
  <x-page>
    <template #title>
      {{ conf.appInfo.app_name + ' fortune' }}
    </template>
    <div class="tabCar">
      <div
        v-for="item in conf.tabCar"
        :key="item.value"
        class="item"
        :class="{ active: item.isClick }"
        :value="item.value"
        @click="conf.changeActive(item)"
      >
        {{ item.label }}
      </div>
    </div>
    <!-- 内容 -->
    <div class="content">
      <div class="money">
        <div class="left">
          <div class="lable">
            {{
              conf.info.app_name + ' bank' + (conf.walletData.coinSymbol ? '(' + conf.walletData.coinSymbol + ')' : '')
            }}
          </div>
          <div class="number" @click="conf.showMoneyBox = !conf.showMoneyBox">
            {{ sutil.dataHandling(conf.tableData.totalBalance, 4, 4) }}
          </div>
          <div class="moneyBox" v-if="conf.showMoneyBox">
            <div class="triangle"></div>
            {{ conf.tableData.totalBalance }}
          </div>
        </div>
        <div class="right">
          <div class="lable">
            {{ $t('yueb.Balance') + (conf.walletData.coinSymbol ? '(' + conf.walletData.coinSymbol + ')' : '') }}
          </div>
          <div class="number" @click="conf.showMoneyBox1 = !conf.showMoneyBox1">
            {{ sutil.dataHandling(conf.walletData.walletMoney, 4, 4) }}
          </div>
          <div class="moneyBox" v-if="conf.showMoneyBox1">
            <div class="triangle"></div>
            {{ conf.walletData.walletMoney }}
          </div>
        </div>
      </div>
      <div class="form">
        <div class="input-box">
          <div class="lable">{{ conf.type !== undefined ? $t(`yueb.${conf.type}`) : '' }}</div>
          <div class="input">
            <img class="input-img" src="/static/img/gold-coin.png" mode="" />
            <input
              inputmode="decimal"
              v-model="conf.changeMoney"
              @input="conf.vfFun($event, 'changeMoney')"
              :placeholder="$t('common.PleaseEnter')"
            />
            <div class="full" @click="conf.setMoney">{{ $t('yueb.Full') }}</div>
          </div>
        </div>
      </div>
      <div class="verify" @click="conf.submit">{{ $t('passwordModule.Verify') }}</div>
    </div>
  </x-page>
</template>

<script lang="ts" setup>
import { apis } from '@/api'
import i18n from '@/lang'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import { svf } from '@/sstore/svf'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
const conf = reactive({
  showMoneyBox: false,
  showMoneyBox1: false,
  showMyTask: false,
  colors: '#F07336',
  navName: '',
  active: 1, //转入转出类型 (0 转出 1转入)
  changeMoney: '',
  code: '',
  shiftToMoney: '',
  rollOutMoney: '',
  type: undefined as any,
  tableData: {} as any,
  coinlist: [] as any[],
  defaultCoin: {} as any, //默认币种列表
  walletData: {} as any, //钱包
  tabCar: [
    {
      label: i18n.t('yueb.TransferIn'),
      value: 0,
      isClick: true
    },
    {
      label: i18n.t('yueb.Rollout'),
      value: 1,
      isClick: false
    }
  ],
  appInfo: {} as any,
  info: {} as any,
  vf: {} as any,
  //金额输入事件
  vfFun: (e: any, name: string) => {
    conf.vf[name](e)
    if (conf.active == 0 && parseFloat(conf.changeMoney) > parseFloat(conf.walletData.walletMoney)) {
      conf.changeMoney = conf.walletData.walletMoney
    } else if (conf.active == 1 && parseFloat(conf.changeMoney) > parseFloat(conf.tableData.totalBalance)) {
      conf.changeMoney = conf.tableData.totalBalance
    }
  },

  //请求提交 转入转出
  submit: async () => {
    let money = conf.changeMoney

    let infoTip = '',
      isShowTip = false
    if (parseFloat(conf.changeMoney) == 0 && !conf.active) {
      isShowTip = true
      infoTip = i18n.t('yueb.tip1')
    }

    if (parseFloat(conf.changeMoney) == 0 && conf.active) {
      isShowTip = true
      infoTip = i18n.t('yueb.tip2')
    }

    if (isShowTip) {
      System.toast(infoTip)
      return
    }

    //转出的金额为负数
    if (conf.active == 1) {
      // 转出
      money = '-' + conf.changeMoney
    }
    let obj = {
      uid: sconfig.userInfo.uid,
      changeMoney: Number(money)
    }

    System.loading()
    const { code } = await apis.submit({
      ...obj,
      complete: () => {
        System.loading(false)
      }
    })

    System.toast(i18n.t(`code.${code}`), 'success')
    setTimeout(() => {
      conf.changeBack(code)
      conf.getInfo()
    }, 300)
  },

  // 获取钱包余额
  getWallet: async () => {
    const { data } = await apis.walletlist()
    data.forEach((item: any) => {
      if (item.walletCoin == conf.defaultCoin.coinCode) {
        item.coinSymbol = conf.defaultCoin.coinSymbol
        conf.walletData = item
      }
    })
  },
  //获取余额宝-钱包信息
  getInfo: async () => {
    const { data } = await apis.yebWalletDetail({
      uid: sconfig.userInfo.uid
    })
    conf.tableData = data
    conf.getWallet()
  },
  changeActive(item: any) {
    conf.changeMoney = ''
    conf.tabCar.forEach((v) => {
      v.isClick = false
      item.value == v.value && (v.isClick = true)
      conf.type = item.value == 0 ? 'TransferInAmount' : 'TransferOutAmount'
    })
    conf.active = item.value
  },
  getTime() {
    var today = new Date() // 获取当前日期和时间
    var yesterday = new Date(today) // 创建一个副本，以便进行操作
    yesterday.setDate(today.getDate() - 1) // 设置副本的日期为昨天
    var yesterdayTimestamp = Math.floor(yesterday.getTime() / 1000)
    return yesterdayTimestamp
  },
  init() {
    conf.getInfo()
  },

  //返回
  changeBack(code: string) {},
  // full按钮
  setMoney() {
    if (conf.active == 0) {
      conf.changeMoney = conf.walletData.walletMoney
    } else {
      conf.changeMoney = conf.tableData.totalBalance
    }
  }
})

const init = async () => {
  conf.vf = svf.getVf(conf, {
    changeMoney: {
      float: true,
      fixed: 4
    }
  })
  conf.info = await svalue.getAppConfiguration()
  conf.appInfo = await svalue.getAppConfiguration()
  conf.coinlist = await svalue.getCoinlist()
  conf.coinlist.forEach((item) => {
    if (item.isDefault) conf.defaultCoin = item
  })
  const option = System.getRouterParams()
  conf.active = option.type
  conf.tabCar.forEach((v) => {
    v.isClick = false
    option.type == v.value && (v.isClick = true)
    conf.type = option.type == 0 ? 'TransferInAmount' : 'TransferOutAmount'
  })
  conf.init()
}
onMounted(() => {
  init()
})
</script>

<style lang="less" scoped>
.error {
  color: red;
  font-size: 27rem;
  margin-top: 10rem;
}

.tabCar {
  width: 100%;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .item {
    width: 50%;
    height: 90rem;
    line-height: 90rem;
    text-align: center;
    font-size: 32rem;
    font-weight: 600;
  }

  .item.active {
    border-bottom: 2px solid #f5843e;
    color: #f5843e;
    transition: 0.2s;
  }
}

.content {
  margin-top: 25rem;

  .money {
    background-color: #fff;
    min-height: 160rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rem 0;
    box-sizing: border-box;

    .left,
    .right {
      position: relative;
      width: 50%;
      text-align: center;
      font-size: 36rem;
    }

    .lable {
      color: #999;
    }

    .number {
      color: #f5843e;
      font-size: 48rem;
      word-wrap: break-word;
      padding: 0 8rem;
    }

    .left {
      border-right: 1px solid #dcdcdc;
    }

    .moneyBox {
      // display: none;
      position: absolute;
      width: initial;
      padding: 10rem;
      background-color: #fff;
      text-align: center;
      border-radius: 10rem;
      left: 50%;
      top: 110%;
      box-shadow: 0px 0px 6px #ccc;
      font-size: 23rem;
    }

    .moneyBox:after {
      position: absolute;
      display: inline-block;
      top: -7rem;
      left: 25%;
      width: 0;
      height: 0px;
      content: '';
      border-style: solid;
      border-width: 4px;
      border-color: #fff #fff transparent transparent;
      transform: rotate(-45deg);
      box-shadow: 1px -1px 2px #dfdcdc;
      // transform: rotate(135deg)
    }
  }
}

.form {
  background-color: #fff;
  margin-top: 25rem;
  display: flex;
  flex-direction: column;
  padding: 40rem;
  box-sizing: border-box;

  .input {
    display: flex;
    // justify-content: space-evenly;
    align-items: center;
    margin: 15rem 0;

    .input-img {
      width: 40rem;
      height: 40rem;
      margin-right: 25rem;
    }

    input {
      background-color: #fff6e6;
      height: 70rem;
      border-radius: 10rem;
      width: 82%;
      margin-right: 25rem;
      padding: 0 20rem;
    }

    .full {
      color: #f5843e;
    }
  }

  .code {
    margin-top: 30rem;
    display: flex;
    justify-content: start;
    align-items: center;

    .input-img {
      width: 40rem;
      height: 40rem;
    }

    input {
      background-color: #fff6e6;
      height: 70rem;
      border-radius: 10rem;
      flex: 1;
      margin: 0 25rem;
      padding: 0 20rem;
    }
  }
}

.verify {
  width: 80%;
  height: 80rem;
  background: linear-gradient(to bottom, #eb602d, #ffa64f);
  color: #fff;
  font-size: 38rem;
  border-radius: 50rem;
  line-height: 80rem;
  text-align: center;
  margin: 60rem auto 0;
}
</style>
