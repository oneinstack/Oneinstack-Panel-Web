<template>
  <x-page headerBgColor="transparent" topfill noFooter>
    <template #right>
      <img @click="conf.gomytask" src="/static/img/more.png" style="width: 40rem; height: 10rem; margin-right: 30rem" />
    </template>

    <div class="yueBao-box">
      <x-statusbar header />
      <div class="yeb-log">
        <img class="log" src="/static/img/yeb-log.png" mode="" />
        <div class="">{{ conf.appInfo.app_name }} fortune</div>
      </div>
      <div class="yeb-content">
        <div class="title">{{ $t('yueb.TotalAmount') + `(${conf.coinlist.coinSymbol})` }}</div>
        <div class="money" @click="conf.goPage('/user/YuE-Bao/myYueBao')">
          <span>{{ sutil.dataHandling(conf.tableData.totalBalance || 0, 4, 4) || '0.00' }}</span>
          <img class="money-icon" src="/static/img/rig-icon.png" mode="" />
        </div>
        <div class="moneyTime" v-if="!conf.tableData.isFrozen">
          <div class="left">
            <div class="text">{{ $t('yueb.Totalearnings') + `(${conf.coinlist.coinSymbol})` }}</div>
            <div class="number" @click="conf.goPage('/user/YuE-Bao/earnings')">
              <span>{{ conf.tableData.totalIncome < 0 ? '0.00' : conf.tableData.totalIncome || '0.00' }}</span>
              <img class="money-icon" src="/static/img/rig-icon.png" mode="" />
            </div>
          </div>
          <div class="rit">
            <div class="text">{{ $t('yueb.Annualized') + ' (‱)' }}</div>
            <div class="number" @click="conf.gomytask">
              <span>{{ conf.tableData.fixYearRate || '0.00' }}</span>
              <img class="money-icon" src="/static/img/rig-icon.png" mode="" />
            </div>
          </div>
        </div>
        <div class="bottom" v-if="!conf.tableData.isFrozen">
          <div class="to" @click="conf.handleIntoPage(0)">{{ $t('yueb.TransferIn') }}</div>
          <div class="out" @click="conf.handleIntoPage(1)">{{ $t('yueb.Rollout') }}</div>
        </div>
        <div class="frozen" v-else>
          <span>{{ $t('yueb.frozen') }}</span>
          <div class="frozenUrl">
            {{ $t('yueb.freeze') }}
          </div>
          <div class="btn" @click="conf.goto">{{ $t('yueb.HeIp') }}</div>
        </div>
      </div>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

const conf = reactive({
  showMyTask: true,
  colors: '#F07336',
  tableData: {} as any,
  appInfo: {} as any,
  coinlist: {} as any,

  //请求查询余额宝币种
  // getcheckCoin(){
  // 	console.log
  // 	conf.$api.checkCoin({
  // 	data:{uid:sconfig.userInfo.uid}})
  // },

  //请求余额信息
  getInfo: async () => {
    System.loading()
    const { data } = await apis.yebWalletDetail({
      uid: sconfig.userInfo.uid,
      complete: () => {
        System.loading(false)
      }
    })

    data.fixYearRate = Number(data.fixYearRate) <= 0 ? '0.0000' : data.fixYearRate
    conf.tableData = data
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
  //右边icon
  gomytask() {
    System.router.push('/user/YuE-Bao/yebContent')
  },
  goto() {
    //跳转客服页面
    System.router.push('/user/service/service')
  },
  goPage(url: string) {
    System.router.push(url)
  },

  // 页面跳转
  handleIntoPage(type: number) {
    System.router.push('/user/YuE-Bao/shiftTo?type=' + type)
  }
})

const init = async () => {
  let obj = await svalue.getCoinlist()
  obj.forEach((item) => {
    if (item.isDefault) conf.coinlist = item
  })
  conf.appInfo = await svalue.getAppConfiguration()

  conf.init()
}
onMounted(() => {
  init()
})
</script>

<style lang="less" scoped>
.yueBao-box {
  height: 100%;
  background: linear-gradient(to bottom, #f07336 40%, #fff);

  .yeb-log {
    height: 280rem;
    width: 100%;
    // background-color: antiquewhite;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 48rem;
    color: #fff;

    .log {
      width: 108rem;
      height: 108rem;
      margin: 50rem 0 30rem;
    }
  }

  .yeb-content {
    width: 90%;
    margin: 0 auto;
    background-color: #fff;
    border-radius: 30rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 60rem;

    .title {
      font-size: 36rem;
      color: #4d4d4d;
      font-weight: bold;
    }

    .money {
      font-size: 70rem;
      font-weight: 600;
      margin-bottom: 30rem;
      color: #000;

      .money-icon {
        width: 19rem;
        height: 30rem;
        vertical-align: middle;
        margin-left: 24rem;
      }
    }

    .moneyTime {
      width: 100%;
      // height: 120rem;
      display: flex;
      align-items: center;
      text-align: center;

      .money-icon {
        width: 8rem;
        height: 14rem;
        vertical-align: middle;
        margin-left: 15rem;
      }

      .text {
        color: #999999;
        font-size: 28rem;
        padding: 10rem;
        width: 100%;
        font-weight: bold;
      }

      .number {
        width: 100%;
        font-size: 40rem;
        padding: 0 0 10rem;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }

    .moneyTime > div {
      width: 50%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .bottom {
      padding: 70rem 0;
      width: 100%;
      display: flex;
      justify-content: space-evenly;

      align-items: center;

      div {
        width: 256rem;
        height: 106rem;
        text-align: center;
        line-height: 106rem;
        font-size: 36rem;
        color: #fff;
        border-radius: 30rem;
      }

      .out {
        background-color: #fff6e6;
        color: #f6843f;
      }

      .to {
        background-color: #f6843f;
      }
    }

    .frozen {
      font-size: 48rem;
      color: #f99044;
      margin: 0 auto 60rem;
      text-align: center;
      font-weight: 600;
      letter-spacing: 0.2rem;

      .frozenUrl {
        width: 520rem;
        font-size: 26rem;
        margin: 0 auto;
        margin-top: 20rem;
        color: #999;
        letter-spacing: initial;
        font-weight: 500;
      }

      .btn {
        margin: 0 auto;
        background-color: #f6843f;
        width: 256rem;
        height: 96rem;
        text-align: center;
        color: #fff;
        font-size: 36rem;
        line-height: 96rem;
        border-radius: 20rem;
        margin-top: 30rem;
      }
    }
  }
}
</style>
