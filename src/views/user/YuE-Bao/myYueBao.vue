<template>
  <x-page headerBgColor="transparent" topfill noFooter>
    <template #title>
      {{ $t('yueb.Mybalance') }}
    </template>
    <div class="myYueBao-box column fit-height">
      <div class="yeb-top">
        <div class="card">
          <div class="title">{{ $t('yueb.TotalAmount') }}</div>
          <div class="total" @click="conf.showMoneyBox = !conf.showMoneyBox">
            {{ (conf.tableData.coinSymbol || '') + sutil.dataHandling(conf.tableData.totalBalance, 4, 4) }}
          </div>
          <div class="moneyBox" v-if="conf.showMoneyBox">
            <div class="triangle"></div>
            {{ conf.tableData.totalBalance || '0.0000' }}
          </div>
        </div>
        <img class="bg" src="/static/img/yeb-bg.png" mode="" />
      </div>
      <div class="box col">
        <div class="box-content column fit-height no-wrap">
          <div class="popup-mask" v-if="conf.selectOpen" @click="conf.selectOpen = false"></div>
          <div class="nav">
            <!-- 搜索栏 -->
            <div class="nav-list">
              <div class="btn-list">
                <template v-for="(item, index) in conf.typeList" :key="index">
                  <div
                    class="select-item"
                    :class="{ 'active': conf.selectTypeObj.value == item.value }"
                    @click="conf.handleSelectType(item)"
                  >
                    {{ item.name }}
                  </div>
                </template>
              </div>

              <div class="nav-item time" @click="conf.handleOpenDate">
                {{ conf.selectDateStr }}
                <div class="down-arrow">
                  <img class="down-img" src="/static/img/to-Bottom.png" />
                </div>
              </div>
            </div>
          </div>
          <!-- 余额宝收益 记录详情 -->
          <div class="col" style="overflow: auto">
            <div class="winning-box" style="width: 100%" v-if="conf.detailData.length > 0">
              <div class="winning-item" v-for="(item, itemIndex) in conf.detailData" :key="itemIndex">
                <div class="content">
                  <div class="left-user">
                    <div class="userName" :class="'hasOp'">
                      <div>
                        <span>{{ item._type }}</span>
                      </div>
                      <div>
                        <span style="opacity: 0.4; font-size: 24rem">{{ item._createTime }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="right-money">
                    <div class="money">
                      {{
                        item.type == 2 ? item.income : item.changeMoney >= 0 ? '+' + item.changeMoney : item.changeMoney
                      }}
                      <div class="hasLine">
                        {{ item.type == 2 ? item.addIncome : item.newBalance }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="conf.detailData.length > 0" style="margin-bottom: 15rem">
                <x-no-data noicon></x-no-data>
              </div>
            </div>
            <x-no-data v-if="conf.detailData.length == 0"></x-no-data>
          </div>
        </div>
      </div>
    </div>
    <!-- 日期选择组件 -->
    <dataTimePicker
      v-model:show="conf.isOpenDate"
      @confirm="conf.handleConfirmDate"
      :selectDate="conf.selectDateArr"
    ></dataTimePicker>
  </x-page>
</template>

<script lang="ts" setup>
import dataTimePicker from './components/ch-datetime-picker.vue'
import { index } from './myYueBao'
import sutil from '@/sstore/sutil'

const conf = index()
</script>

<style lang="less" scoped>
.myYueBao-box {
  width: 100%;
  overflow: hidden;

  .moneyBox {
    position: absolute;
    width: initial;
    padding: 10rem;
    background-color: #fff;
    text-align: center;
    border-radius: 10rem;
    left: 50%;
    top: 88%;
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
  }

  .yeb-top {
    width: 100%;
    height: 400rem;
    position: relative;
    margin-bottom: 10rem;

    .bg {
      width: 100%;
      height: 100%;
      position: absolute;
      top: -30rem;
    }

    .card {
      width: 90%;
      height: 200rem;
      position: absolute;
      margin: 0 auto;
      background: #fff;
      z-index: 1;
      left: 5%;
      bottom: 0rem;
      text-align: center;
      border-radius: 30rem;
      min-height: 220rem;
      font-weight: 600;

      .title {
        color: #000;
        font-size: 40rem;
        padding: 30rem 0;
      }

      .total {
        font-size: 48rem;
        color: #fc9b01;
      }

      .center {
        display: flex;
        width: 100%;
        align-items: center;

        .left,
        .right {
          width: 50%;
          position: relative;

          .text {
            font-size: 30rem;
            padding: 40rem 0 15rem;
            width: 100%;
          }

          .number {
            font-size: 40rem;
            padding-bottom: 20rem;
          }
        }

        .left .number {
          color: #fc9b01;
        }
      }
    }
  }

  .box {
    position: relative;
  }

  .box-content {
    background-color: #fff;
    width: 90%;
    height: 100%;
    margin-top: 20rem;
    position: absolute;
    top: 0;
    left: 5%;
    border-radius: 30rem 30rem 0 0;
    overflow: hidden;

    .popup-mask {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
      background: rgba(0, 0, 0, 0.3);
    }

    .nav {
      background: #fff;
      position: relative;
      z-index: 3;
      border-radius: 22rem 22rem 0 0;

      .nav-list {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #000;
        font-weight: 500;
        font-size: 24rem;
        padding: 0rem 30rem;
        height: 120rem;
        border-bottom: 1rem solid #f6f7fa;
        .nav-item {
          min-width: 140rem;
          height: 62rem;
          border: 1px solid #ffa64f;
          color: #fc9b01;
          border-radius: 10rem;
          padding: 0 7rem;
          display: flex;
          justify-content: space-evenly;
          align-items: center;
          position: relative;
          .down-arrow {
            margin-left: 7rem;
            height: 100%;
            display: flex;
            align-items: center;
            .down-img {
              width: 18rem;
              height: 12rem;
            }
          }
        }
        .time {
          border: initial;
          font-size: 28rem;
        }
      }
      .select {
        position: absolute;
        top: 120rem;
        width: 100%;
        padding: 20rem 0 20rem;
        background: #fff;
        .select-list {
          max-height: 45vh;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: start;
          .select-item {
            height: 60rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #fff6e6;
            color: #fc9b01;
            width: 30%;
            font-size: 32rem;
            margin-left: 20rem;
            border-radius: 10rem;

            &.active {
              background: #f6843f;
              color: #fff;
            }
          }
        }
        .btn-list > :nth-child(1),
        .btn-list > :nth-child(4),
        .btn-list > :nth-child(7) {
          margin-left: 0;
        }
      }
      .btn-list {
        width: 100%;
        max-height: 45vh;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: start;
        .select-item {
          height: 42rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #fff6e6;
          color: #fc9b01;
          width: 30%;
          margin-left: 20rem;

          &.active {
            background: #f6843f;
            color: #fff;
          }
        }
      }
      .btn-list > :nth-child(1) {
        margin-left: 0;
      }
    }
  }
}
.winning-box {
  padding: 0rem 24rem 15rem;
  background: #fff;
  .winning-item {
    height: 128rem;
    border-bottom: 3px solid #f9fafc;
  }
  .content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    position: initial;
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
      .hasLine {
        font-size: 24rem;
        color: #999999;
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
  .more {
    background: #fff;
    padding: 24rem 24rem 24rem;
    .more-btn {
      box-shadow: rgba(0, 0, 0, 0.1) 0px 1.06667vw 1.06667vw;
      border-radius: 2.13333vw;
      height: 78rem;
      display: flex;
      align-items: center;
      justify-content: center;

      span {
        margin-right: 20rem;
        font-size: 24rem;
        font-weight: 700;
      }
    }
  }
  .more-not {
    padding: 36rem 0rem 36rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rem;
    color: #707070;
  }
}
</style>
