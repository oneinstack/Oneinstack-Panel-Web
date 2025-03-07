<script setup lang="ts">
import changeItem from './com/black/changeItem.vue'
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'
import coinPopup from './com/black/coinPopup.vue'
import sutil from '@/sstore/sutil'
import { stheme } from '@/sstore/stheme'
import { index } from './exchange'

const conf = index()
</script>

<template>
  <x-page pageType="black">
    <template #title>{{ $t('swapModule.titleName') }}</template>
    <div class="change-box">
      <changeItem 
        title="From"
        :rTitle="conf.firstSelectInfo.walletMoney ? conf.firstSelectInfo.coinSymbol + sutil.dataHandling(conf.firstSelectInfo.walletMoney) : '--'"
        :maxNum="conf.firstSelectInfo.walletMoney"
        :isSelect="true"
        :disabled="!conf.secondSelectInfo.walletCoin || !conf.firstSelectInfo.walletCoin ? true : false"
        @input="(e:any) => { conf.topInputValue = e.val, conf.vfFun(e.type, 'topInputValue') }"
        @change="conf.handleOpenSelect('top', $event)"
      >
        <div class="r-name">
          <img src="/static/img/USDT.png" v-if="conf.firstSelectInfo.walletCoin == 'USDT'" />
          <img
            :src="conf.firstSelectInfo.nationalFlag"
            v-if="conf.firstSelectInfo.nationalFlag && conf.firstSelectInfo.walletCoin != 'USDT'"
          />
          <span>{{ conf.firstSelectInfo.walletCoin || '' }}</span>
        </div>
      </changeItem>
      <div class="line" style="margin-top: 80rem;margin-bottom: 60rem;" @click="conf.swapElements">
        <div class="change flex-center">
          <img src="/static/theme/black/exchange.png" />
        </div>
      </div>
      <changeItem 
        title="To"
        :rTitle="conf.secondSelectInfo.walletMoney ? conf.secondSelectInfo.coinSymbol + sutil.dataHandling(conf.secondSelectInfo.walletMoney) : '--'"
        :disabled="true"
        :lable="conf.secondSelectInfo.exchangeTotal"
        dataTarget="bottomModal"
        @change="conf.handleOpenSelect('bottom', $event)"
      >
        <div class="r-name">
          <img
            src="/static/img/USDT.png"
            v-if="conf.secondSelectInfo.walletCoin == 'USDT'"
          />
          <img
            :src="conf.secondSelectInfo.nationalFlag"
            v-if="conf.secondSelectInfo.nationalFlag && conf.secondSelectInfo.walletCoin != 'USDT'"
          />
          <span>{{ conf.secondSelectInfo.walletCoin || '' }}</span>
        </div>
      </changeItem>
      <div class="c-title flex-b-c" style="margin-bottom: 0rem;margin-top: 40rem;">
        <div>Deposit Balance: <span style="color: #fff;">{{ conf.secondSelectInfo.exchangeTotal }}</span></div>
        <div>Bonus Balance: <span style="color: #fff;">0</span></div>
      </div>
      <div class="line"></div>
      <div class="c-title flex-b-c" v-if="conf.secondSelectInfo.coinCode && conf.firstSelectInfo.coinCode">
        <span>Rate</span>
        <div class="t-right">
          <img src="/static/theme/black/rate.png" />
          <span>{{conf.firstNumber + ' ' + conf.firstSelectInfo.coinCode}} ≈ {{ conf.swapResult + ' ' + conf.secondSelectInfo.coinCode }} </span>
        </div>
      </div>
      <div class="c-title flex-b-c">
        <span>Estimated Time</span>
        <div class="t-right">30 Seconds</div>
      </div>
      <div class="c-title flex-b-c">
        <span>Exchange fee</span>
        <div class="t-right">0 USDT</div>
      </div>
      <div class="e-btn">
        <greenBtn @click="conf.handleDataSubmit">
          <span style="font-size: 32rem;">Exchange</span>
        </greenBtn>
      </div>
    </div>
    <!-- 钱包选择 -->
    <coinPopup
      :show="conf.modalName == 'topModal'"
      :dataArr="conf.topSelectList"
      :selectId="conf.firstSelectInfo.id"
      @close="conf.modalName = undefined"
      @change="(e:any) => { conf.changeItem('top', e) }"
    />
    <coinPopup
      :show="conf.modalName == 'bottomModal'"
      :dataArr="conf.bottomSelectList"
      :selectId="conf.secondSelectInfo.id"
      @close="conf.modalName = undefined"
      @change="(e:any) => { conf.changeItem('bottom', e) }"
    />
  </x-page>
</template>

<style scoped lang="less">
.change-box {
  padding: 24rem;
}

.c-title {
  color: #BFBFBF;
  font-size: 28rem;
  margin-bottom: 16rem;
  padding: 0rem 2rem;

  .t-right {
    display: flex;
    align-items: center;
    color: #fff;
    font-weight: 600;
    img{
      height: 40rem;
      width: 40rem;
    }
  }
}

.r-name {
  display: flex;
  align-items: center;
  margin-right: 20rem;

  img {
    height: 40rem;
    margin-right: 12rem;
  }
}

.line {
  height: 2rem;
  width: 100%;
  background: #3B4041;
  position: relative;
  margin: 40rem 0rem;

  .change {
    background: #3A4142;
    border: 2rem solid #4B5253;
    border-radius: 12rem;
    width: 70rem;
    height: 70rem;
    position: absolute;
    top: -34rem;
    left: calc(50% - 35rem);

    img {
      width: 40rem;
      height: 40rem;
    }
  }
}
.e-btn{
  height: 88rem;
  margin-top: 50rem;
}
</style>
