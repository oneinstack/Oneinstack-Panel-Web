<template>
  <x-page :headerBgColor="stheme.theme.blue.headerBgColor()">
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
import stheme from '@/sstore/stheme'
import { index } from './shiftTo'

const { conf, sutil } = index()
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
    border-bottom: 2px solid #006fff;
    color: #006fff;
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
      color: #006fff;
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
      background-color: #F6F7FA;
      height: 70rem;
      border-radius: 10rem;
      width: 82%;
      margin-right: 25rem;
      padding: 0 20rem;
    }

    .full {
      color: #006fff;
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
  background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
  color: #fff;
  font-size: 38rem;
  border-radius: 50rem;
  line-height: 80rem;
  text-align: center;
  margin: 60rem auto 0;
}
</style>
