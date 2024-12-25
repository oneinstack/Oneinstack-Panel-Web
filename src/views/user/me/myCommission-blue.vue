<template>
  <x-page :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>
      {{ $t('me.Commission') }}
    </template>
    <div class="box">
      <div class="content-view">
        <div style="width: 100%; height: 100%">
          <div class="winning-box" v-if="conf.detailData.length > 0">
            <div class="winning-item" v-for="(item, itemIndex) in conf.detailData" :key="itemIndex">
              <div class="left-user">
                <div class="userName">
                  <div>
                    <span>{{ item.tradeObjPaymentInfo.tradeObjName || '--' }}</span>
                  </div>
                  <div>
                    <span style="color: #bcbcbc; font-size: 20rem">{{ item.tradeTime }}</span>
                  </div>
                </div>
              </div>
              <div class="right-money">
                <div class="money">{{ conf.getCoin(item.walletCoin) + item.money }}</div>
              </div>
            </div>
          </div>
          <x-no-data v-if="conf.detailData.length == 0"></x-no-data>
        </div>
      </div>
    </div>
  </x-page>
</template>

<script lang="ts" setup>
import { index } from './myCommission'
import stheme from '@/sstore/stheme'

const conf = index()
</script>

<style lang="less" scoped>
.box {
  width: 100%;
  .content-view {
    width: 100%;

    .winning-box {
      // overflow-y: hidden;
      width: 100%;
      height: 100%;
      padding: 0rem 24rem 24rem;
      margin-top: 24rem;
      background: #fff;
      margin-top: 30rem;

      .winning-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 96rem;
        border-bottom: 1px solid #f9fafc;
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
            width: 56rem;
            height: 56rem;
            margin-right: 8rem;
          }
          .userName {
            color: rgb(132, 132, 144);
            font-size: 24rem;
          }
        }
        .right-money {
          text-align: right;
          .money {
            font-size: 24rem;
            padding-right: 10rem;
            span {
              font-size: 32rem;
            }
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
  }
}
</style>
