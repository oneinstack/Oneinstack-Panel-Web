<template>
  <x-page bgColor="#ededed" backIcon="cross">
    <template #title>
      <span class="title">{{ $t('chatRoom.send_rpkt') }}</span>
    </template>
    <div class="red-envelope">
      <div class="type-select" @click="conf.typeShow = true" v-if="conf.isGroup">
        <span style="margin-right: 10rem">
          {{ conf.typeIndex === 3 ? $t('chatRoom.random_rpkt') : $t('chatRoom.normal_rpkt') }}
        </span>
        <van-icon name="arrow-down" color="#b99456" size="32rem"></van-icon>
      </div>
      <div class="money-input" v-if="conf.isGroup">
        <div class="money-left">
          <img style="width: 28rem;height: 35rem;margin-right: 10rem;" src="/static/img/chat/send-num.svg" />
          {{ $t('chatRoom.rpkt_count') }}
        </div>
        <input :placeholder="$t('chatRoom.enter_rpkt')" placeholder-class="placeholderStyle" class="input"
          @input="conf.vrf['number']" v-model.trim="conf.number" />
        <div style="margin-left: 20rem">{{ $t('chatRoom.pieces') }}</div>
      </div>
      <div class="money-input">
        <div class="money-left" style="flex-shrink: 0;">
          <div class="icon" v-if="conf.typeIndex == 3">{{ $t('chatRoom.random') }}</div>
          {{ conf.typeIndex == 3 ? $t('chatRoom.total_amt') : $t('chatRoom.single_amt') }}
        </div>
        <input :placeholder="`${conf.walletInfo.coinSymbol}0.00`" style="max-width: 260rem;" class="input"
          @input="conf.vrf['money']" v-model.trim="conf.money" />
      </div>
      <div class="area">
        <input placeholder-class="placeholderStyle" :max="6" :placeholder="conf.dataPlace" v-model.trim="conf.content"
          @input="conf.vrf['content']" />
      </div>
      <div class="money-num">
        {{ conf.walletInfo.coinSymbol }}
        {{ !sutil.isNull(allMoney) && allMoney > 0 ? allMoney.toFixed(2) : 0 }}
      </div>
      <div class="btn">
        <div :class="{ 'active': !sutil.isNull(allMoney) && allMoney >= 0.01 }" @click="conf.checkPassword">
          {{ $t('chatRoom.put_money') }}
        </div>
      </div>
    </div>
    <van-popup :show="conf.typeShow" @close="conf.typeShow = false" borderRadius="20" position="bottom">
      <div class="type-list">
        <div class="type-item border-b" @click="conf.changeType(3)">{{ $t('chatRoom.random_rpkt') }}</div>
        <div class="type-item" @click="conf.changeType(2)">{{ $t('chatRoom.normal_rpkt') }}</div>
        <div class="line"></div>
        <div class="type-item" @click="conf.typeShow = false">{{ $t('chatRoom.back') }}</div>
      </div>
    </van-popup>
    <!-- <check-password :show="passwordShow" :money="allMoney" @close="selectPassword"></check-password> -->
  </x-page>
</template>

<script setup lang="ts">

import { sim } from '@/sstore/sim'
import i18n from '@/lang';
import sutil from '@/sstore/sutil';
import { svalue } from '@/sstore/svalue'
import { svf } from '@/sstore/svf'
import System from '@/utils/System';
import { showConfirmDialog } from 'vant';
import { computed, onMounted, reactive } from 'vue';

const conf = reactive({
  isGroup: true, //是否是群聊
  typeShow: false,
  typeIndex: 2, //2普通红包，3拼手气红包
  passwordShow: false,

  money: undefined as any, //总金额
  number: undefined as any, //最大领取个数，普通红包为1，拼手气红包大于1
  content: '', //封面显示内容
  dataPlace: '',
  walletInfo: {coinSymbol: ''} as any,
  vrf: {} as any,
  back() {
    // uni.navigateBack()
  },
  changeType(type: any) {
    conf.typeIndex = type
    conf.typeShow = false
  },
  async checkAllowPut(types: any, money: any) {
    await svalue.getAppConfiguration()
    let maxMoney = parseFloat(svalue.configv1['lottery_im_red_packet_max_money']),
      minMoney = parseFloat(svalue.configv1['lottery_im_red_packet_min_money']),
      maxNumber = parseFloat(svalue.configv1['lottery_im_red_packet_max_of_signe_time'])
    const isAllow = !(types.some((type: any) => {
      switch (type) {
        case 'maxMoney':
          return money > maxMoney && System.toast(i18n.t('code.100043' + minMoney))

        case 'minMoney':
          return money < minMoney && System.toast(i18n.t('code.100043' + minMoney))
        case 'maxNumber':
          return conf.number > maxNumber && System.toast(i18n.t('code.100042' + maxNumber))
      }
    }))
    return isAllow
  },
  async checkPassword() {
    if (conf.typeIndex == 3) {
      if (conf.money / conf.number < 0.01) {
        System.toast(i18n.t('chatRoom.min_single' + ' 0.01'))
        return
      }
    }
    if (conf.number && conf.money) {
      if (conf.isGroup) {
        if (!await conf.checkAllowPut(['maxNumber'], conf.money)) return
      } else {
        if (!await conf.checkAllowPut(['maxMoney', 'minMoney'], conf.money)) return
      }
      conf.selectPassword({
        verifySafety: '123456',
        type: 2
      })
    }
    // if (conf.number && conf.money) conf.passwordShow = true
  },
  async selectPassword(e: any) {
    conf.passwordShow = false
    if (e.type == 1) {
      showConfirmDialog({
        title: '',
        message: e.msg,
        cancelButtonText: i18n.t('chatRoom.cancel'),
        confirmButtonText: e.code == '11323' ? i18n.t('chatRoom.setting') : i18n.t('chatRoom.retry'),
      })
        .then(() => {
          conf.passwordShow = true
        })
        .catch(() => {
          // on cancel
        });
    } else if (e.type === 2) {
      await sim.sendRedpack({
        type: conf.typeIndex,
        money: conf.money,
        number: conf.number,
        data: conf.content || conf.dataPlace,
        tradePassword: e.verifySafety
      })
      sutil.pageBack()
    }
  }
})

const allMoney = computed(() => {
  let money = Number(conf.money || 0)
  let number = parseInt(conf.number || 0)
  return conf.typeIndex === 3 ? money : money * number
})
onMounted(async () => {
  conf.vrf = svf.getVf(conf, {
    number: { int: true },
    money: { float: true },
    content: { length: 60, trim: false }
  })

  conf.dataPlace = i18n.t('chatRoom.congrats')
  // conf.isGroup = sim.getCurrentInfo()?.conversationType === 3
  if (!conf.isGroup) {
    conf.number = 1
  }
  conf.walletInfo = await svalue.getDefaultWallet()
})
</script>

<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}
.contact_action {
  // padding-left: 36rem;
  display: flex;
}

.red-envelope {
  padding: 40rem 30rem;

  .type-select {
    font-size: 28rem;
    color: #b99456;
    margin-bottom: 20rem;
    margin-left: 20rem;
    display: flex;
    align-items: center;
    font-weight: 600;
  }

  .money-input {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #333;
    // font-weight: 600;
    font-size: 30rem;
    background: #fff;
    padding: 30rem;
    border-radius: 8rem;
    margin-bottom: 60rem;
    box-sizing: content-box;

    .van-icon-envelop {
      color: #ee5938;
      margin-right: 20rem;
      font-size: 40rem;
    }

    .money-left {
      display: flex;
      align-items: center;

      .icon {
        height: 45rem;
        background: #c49739;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 28rem;
        margin-right: 20rem;
        border-radius: 4rem;
        padding: 0 10rem;
      }
    }

    .input {
      flex: 1; 
      text-align: right;
      // padding: 0 20rem;
    }
  }

  .area {
    background: #fff;
    // height: 200rem;
    padding: 30rem;
    font-size: 32rem;
    border-radius: 8rem;
  }

  .input::placeholder {
    color: #a7a7a7;
  }

  .money-num {
    font-size: 70rem;
    font-weight: 700;
    text-align: center;
    margin-top: 140rem;
  }

  .btn {
    margin-top: 60rem;
    display: flex;
    justify-content: center;

    div {
      width: 300rem;
      background: #d1d1d1;
      height: 90rem;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 30rem;
      border-radius: 10rem;
      color: #a8a8a8;

      &.active {
        color: #fff;
        background-color: #ff6247;
      }
    }
  }
}

.type-list {
  background: #fff;
  font-size: 28rem;

  .type-item {
    height: 100rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .border-b {
    border-bottom: 1rem solid #eee;
  }

  .line {
    height: 20rem;
    width: 100%;
    background: #ededed;
  }
}
</style>
