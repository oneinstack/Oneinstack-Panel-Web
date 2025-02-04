<template>
  <van-popup
    class="popup-bottom-center"
    :show="show"
    position="bottom"
    borderRadius="16"
    :round="true"
    @close="conf.closePopup"
  >
    <div class="popup-content">
      <div class="popup-title">
        <div style="width: 10%">
          <img class="close-img" src="/static/img/close.png" @click="conf.closePopup" />
        </div>
        <div>
          <text>{{ $t('game.bet') }}</text>
        </div>
        <div style="width: 10%">
          <img v-if="showShare && sconfig.userInfo && svalue.configv1['im_open']" class="share-img"
						style="margin-right: 24rem" src="/static/theme/blue/share.png" @click="conf.share"
						:class="{ 'disabled': betShare }" />
        </div>
      </div>
      <div class="bet-type">
        <slot></slot>
      </div>
      <div class="select-box">
        <div class="money">
          <div class="money-title">{{ $t('game.money') }}</div>
          <div class="money-list">
            <div
              v-for="amount in conf.quickRechargeAmount.list"
              :key="amount"
              class="money-item"
              :class="{ 'money-active': conf.num == amount }"
              @click="conf.num = amount"
            >
              {{ lottery.wallet.coinSymbol }}{{ amount }}
            </div>
          </div>
        </div>
        <div class="input">
          <div class="input-title">{{ $t('game.customize') }}:</div>
          <div class="input-box">
            <input placeholder="" v-model="conf.num" inputmode="decimal" @input="conf.vfFun($event, 'num')" />
          </div>
        </div>
        <div class="bet-btn" @click="conf.submit">
          {{ $t('game.totalPrice') }} {{ lottery.wallet.coinSymbol }}{{ conf.num || 0 }}
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import i18n from '@/lang'
import { sconfig } from '@/sstore/sconfig'
import { LotteryConfInter } from '@/sstore/slottery'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import { svf } from '@/sstore/svf'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
const props = defineProps({
  show: {
    default: false
  },
  lottery: {
    default: {} as LotteryConfInter
  },
  showShare: {
		default: true
	},
  betShare: {
    default: false
  }
})
const emit = defineEmits(['submit', 'share'])
const conf = reactive({
  num: 10 as any,
  translateY: 0,
  quickRechargeAmount: {
    list: [10, 20, 50, 100] // 快速下注列表
  },
  vf: {},
  vfFun: (e: Event, name: string) => {
    ;(conf.vf as any)[name](e)
    const money = parseFloat(props.lottery.wallet.money)
    if (conf.num > money) {
      conf.num = money
      return
    }
    if (!conf.num.length) conf.num = 0
  },
  // 下注
  submit() {
    if (!sconfig.userInfo) return System.router.push('/login')
    if (conf.num == 0) {
      return System.toast(i18n.t('common.SelectMoney'))
    }
    emit('submit', conf.num)
  },
  // 分享注单
  share() {
    if (!sconfig.userInfo) return System.router.push('/login')
    if(props.betShare) return
    emit('share', conf.num)
  },
  // 关闭下注弹窗
  closePopup() {
    emit('submit', 0)
  }
})
onMounted(async () => {
  conf.vf = svf.getVf(conf, {
    num: {
      float: true,
      fixed: 4
    }
  })
  if (!sconfig.userInfo) return
  await svalue.getDefaultWallet()
  conf.quickRechargeAmount.list = sconfig.walletInfo.quickRechargeAmount.map((item: any) => parseInt(item))
  if (sconfig.walletInfo.betMinAmount) conf.num = sutil.dataHandling(sconfig.walletInfo.betMinAmount)
  else conf.num = conf.quickRechargeAmount.list[0]
})
</script>

<style lang="less" scoped>
.popup-content {
  border-radius: 16rem 16rem 0rem 0rem;
  background: #fff;
  padding-bottom: 40rem;

  .popup-title {
    padding: 40rem 40rem 20rem;
    color: rgb(37, 37, 41);
    font-size: 32rem;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .close-img {
      width: 19rem;
      height: 19rem;
    }

    .share-img {
      width: 47rem;
      height: 35rem;
    }

    .title-right {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 8rem 16rem;
      border-radius: 8rem;
      background-color: rgba(0, 0, 0, 0);
      border: 2rem solid rgb(187, 187, 197);
      z-index: 8;
      font-size: 24rem;
      color: rgb(37, 37, 41);
    }

    .disabled {
      filter: grayscale(1);
    }
  }

  .bet-type {
    padding: 24rem;
    background: #E6F2FF;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130rem,1fr));
    gap: 12rem;
    place-items: center !important;
  }

  .select-box {
    padding: 0rem 40rem;

    .money {
      margin-bottom: 32rem;

      .money-title {
        color: #45454d;
        font-size: 28rem;
        font-weight: 700;
        margin-bottom: 16rem;
      }

      .money-list {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .money-item {
          width: 22%;
          height: 75rem;
          border-radius: 8rem;
          background: linear-gradient(180deg, #f2f4f9 0%, #f3f5fb 100%);
          box-shadow: 0 3.75 0 0 #c3c8dc;
          color: #252529;
          font-weight: 700;
          font-size: 28rem;
          display: flex;
          justify-content: center;
          align-items: center;

          &.money-active {
            background: #006FFF;
            color: #fff;
          }
        }
      }
    }

    .input {
      display: flex;
      align-items: center;
      margin-bottom: 32rem;

      .input-title {
        color: #45454d;
        font-weight: 700;
        font-size: 28rem;
        margin-right: 24rem;
      }

      .input-box {
        flex: 1;
        background: #f5f5fa;
        padding: 16rem 24rem;
        border-radius: 8rem;

        input {
          color: #252529;
          font-size: 28rem;
          font-weight: 700;
          width: 100%;
        }
      }
    }

    .bet-btn {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 96rem;
      color: #fff;
      font-size: 28rem;
      font-weight: 700;
      border-radius: 95rem;
      background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
			box-shadow: 0 2rem 0 0 rgba(255, 255, 255, .2) inset, 0 2rem 7rem 0 rgba(0, 0, 0, .25);
    }
  }
}
</style>
