<script setup lang="ts">
import luckyWheel from './components/lucky-wheel.vue'
import selfInfo from './components/self-info.vue'
import friendAssist from './components/friend-assist.vue'
import openRewards from './components/open-rewards.vue'
import withdrawalCard from './components/withdrawal-card.vue'
import shareCard from './components/share-card.vue'
import entryAnimation from './components/entry-animation.vue'
import limitCard from './components/limit-card.vue'
import otherPlayerWithdrawal from './components/other-player-withdrawal.vue'
import withdrawPeopleDialog from './components/withdraw-people-dialog.vue'
import { reactive } from 'vue'
import { apis } from '@/api'
import System from '@/utils/System'
import i18n from '@/lang'
import { svalue } from '@/sstore/svalue'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { Scope } from 'tools-vue3'
import { RewardsType } from './types/enum'
import { ERouter } from '@/enum/Enum'

interface UserInfo {
  userImgUrl: string
  userName: string
}

const conf = reactive({
  amount: {
    total: 0,
    received: '----',
    pending: '----',
    unit: '',
    isWithdrawal: false,
    withdrawalTimes: 0,
    getWithdrawalTimes: async () => {
      const { data } = await apis.withdrawalRecord({ userId: conf.userInfo.id })
      conf.amount.withdrawalTimes = data.length
    }
  },
  wheel: {
    show: false,
    disabled: false, // 使转盘失效
    recordId: null, // 记录id
    receivedId: null, // 领取id
    times: 0, // 剩余次数
    countdown: '00:00:00', // 倒计时
    endTime: null as number | null, // 失效时间
    winningAmount: '00.01', // 点击转盘获得的金额
    rewardType: RewardsType.RED_PACKET, // 点击转盘转到的类型
    assistList: [] as UserInfo[], // 邀请列表
    isRotating: false, // 是否转动中
    click: () => {
      if (conf.wheel.isRotating) return
      if (conf.wheel.times === 0) return conf.overlay.open('Share')
    },
    restart: () => {
      if (conf.amount.isWithdrawal) return CEvent.emit(ERouter.reload)
    },
    start: () => {
      if (conf.wheel.times > 0) {
        conf.wheel.times--
        conf.wheel.isRotating = true
      }
    },
    end: async ({ type }: { type: RewardsType }) => {
      System.loading()
      const { data: res } = await apis.clickLuckyWheel({ userRecordId: conf.wheel.recordId })
      const { randomMoney, residueCount, reducePrice, totalAmount } = res
      conf.wheel.winningAmount = parseFloat(randomMoney).toString()
      conf.amount.pending = MathUtil.minus(reducePrice, totalAmount).toString()
      conf.amount.received = MathUtil.minus(conf.amount.total, conf.amount.pending).toString()
      conf.wheel.rewardType = type
      conf.wheel.times = parseInt(residueCount)
      conf.overlay.open('Rewards')
      System.loading(false)
    },
    update: async () => {
      const { data } = await apis.receiveLuckyWheel({
        luckyWheelId: conf.wheel.receivedId,
        toast(code) {
          conf.wheel.show = true
          conf.amount.isWithdrawal = true
          conf.wheel.disabled = true
          if (code === 1519) conf.overlay.open('Limit')
          else System.toast(i18n.t(`code.${code}`))
        }
      })
      const { id, bonus, residueCount, loseTime, clickCount, progress, coinCode } = data
      const coinlist = await svalue.getCoinlist()
      conf.amount.unit = coinlist.find((item) => item.coinCode === coinCode).coinSymbol
      const entryAnimationEnd = Cookie.get('entryAnimationEnd')
      if (!clickCount && !entryAnimationEnd) {
        conf.entryAnimation.show = true
        await conf.amount.getWithdrawalTimes()
        conf.amount.received = '0'
        conf.amount.pending = '0'
        conf.entryAnimation.received = MathUtil.minus(bonus, progress)
        conf.entryAnimation.times = residueCount
        await new Promise((resolve) => {
          let timerId = timer.on(() => {
            if (!conf.entryAnimation.show) {
              timer.un(timerId)
              resolve(true)
            }
          }, 1000)
        })
      } else if (!conf.wheel.show) conf.withdrawPeopleDialog.open()
      conf.wheel.show = true
      conf.amount.total = parseFloat(bonus)
      conf.amount.pending = parseFloat(progress).toString()
      conf.amount.received = MathUtil.minus(bonus, conf.amount.pending).toString()
      conf.wheel.recordId = id
      conf.wheel.times = parseInt(residueCount)
      conf.wheel.endTime = loseTime
    },
    checkWin: () => {
      if (parseInt(conf.amount.received) === parseInt(conf.amount.total.toString())) {
        conf.wheel.disabled = true
        timer.clear()
        setTimeout(() => {
          conf.overlay.open('Withdrawal')
        }, 1000)
      }
    },
    updateCountdown: async () => {
      await sconfig.getSystemTime()
      timer.on(async () => {
        const stime = await sconfig.getSystemTime()
        const tarr = sutil.getCountDown(conf.wheel.endTime! - stime)
        conf.wheel.countdown = `${tarr[0]}:${tarr[1]}:${tarr[2]}`
      }, 1000)
    },
    updateAssist: async (isFirst?: boolean) => {
      if (conf.wheel.isRotating) return
      const { data } = await apis.subUserlist({ id: conf.wheel.recordId })
      if (isFirst) {
        conf.wheel.assistList = data
        const beforeAssistList = Cookie.get('assistList') ? Cookie.get('assistList') : []
        if (data.length > beforeAssistList.length) conf.overlay.open('Assist')
        Cookie.set('assistList', JSON.stringify(conf.wheel.assistList))
        return
      }
      if (conf.wheel.assistList.length === data.length) return
      conf.overlay.open('Assist')
      conf.wheel.assistList = data
      Cookie.set('assistList', JSON.stringify(conf.wheel.assistList))
    }
  },
  overlay: {
    show: false,
    type: 'Share',
    open: (type: 'Share' | 'Assist' | 'Rewards' | 'Withdrawal' | 'Limit') => {
      conf.overlay.type = type
      conf.overlay.show = true
    },
    close: () => {
      conf.overlay.show = false
      switch (conf.overlay.type) {
        case 'Assist':
          conf.wheel.update()
          break
        case 'Rewards':
          conf.wheel.isRotating = false
          conf.wheel.checkWin()
          break

        case 'Withdrawal':
          conf.handleConfirmWithdrawal()
          break
      }
    }
  },
  userInfo: {
    id: null,
    avatarUrl: '',
    nickname: ''
  },
  otherPlayerWithdrawal: {
    list: [],
    get: async () => {
      const { data: res } = await apis.otherPlayerWithdrawalData({ dataType: 20 })
      conf.otherPlayerWithdrawal.list = res[20]
    }
  },
  entryAnimation: {
    show: false, // 进场动画
    received: 0,
    times: 0,
    open: () => {
      conf.wheel.show = true
    },
    close: () => {
      conf.entryAnimation.show = false
      Cookie.set('entryAnimationEnd', true)
    }
  },
  withdrawPeopleDialog: {
    show: false, // 其他用户提现弹框
    open: () => {
      conf.withdrawPeopleDialog.show = true
      setTimeout(() => {
        conf.withdrawPeopleDialog.show = false
      }, 2000)
    }
  },

  async handleCreateEvent() {
    if (!sconfig.userInfo) return System.router.replace('/login')
    const { userImgUrl, userNickname, userId } = sconfig.userInfo
    conf.userInfo.avatarUrl = userImgUrl
    conf.userInfo.nickname = userNickname
    conf.userInfo.id = userId
    const { data: res } = await apis.luckywheelinviteList()
    if (!res.length) {
      conf.wheel.show = true
      System.toast(i18n.t('luckyWheel.activityEnd'))
      conf.amount.isWithdrawal = true
      conf.wheel.disabled = true
      return
    }
    conf.wheel.receivedId = res[0].id
    await conf.wheel.update()
    conf.wheel.updateAssist(true)
    conf.otherPlayerWithdrawal.get()
    timer.on(() => conf.wheel.updateAssist(), 5000)
  },

  handleToPath(path: 'rules' | 'detail') {
    console.log(path)
    System.router.push(`/user/luckyWheel/${path}?id=${conf.wheel.recordId}&coinSymbol=${conf.amount.unit}`)
  },

  handleConfirmWithdrawal() {
    System.toast(i18n.t('luckyWheel.withdrawalSuccessful'), 'success')
    Cookie.remove('entryAnimationEnd')
    conf.amount.isWithdrawal = true
  }
})

const timer = Scope.Timer()
conf.handleCreateEvent()
</script>

<template>
  <entryAnimation
    class="entry-animation"
    :show="conf.entryAnimation.show"
    :times="{
      withdrawal: conf.amount.withdrawalTimes + 1,
      freeSpins: conf.entryAnimation.times
    }"
    :amount="{
      received: conf.entryAnimation.received,
      unit: conf.amount.unit
    }"
    :avatar="conf.userInfo.avatarUrl"
    @open="conf.entryAnimation.open"
    @end="conf.entryAnimation.close"
  />

  <x-page v-show="conf.wheel.show" headerBgColor="#ED2D1C" class="container">
    <template #title>
      <span>{{ $t('luckyWheel.title') }}</span>
    </template>
    <template #right>
      <div class="head-right">
        <img class="img" src="/static/img/luckyWheel/rules.png" mode="" @click="conf.handleToPath('rules')" />
        <template v-if="!conf.amount.isWithdrawal">
          <img class="img" src="/static/img/luckyWheel/details.png" mode="" @click="conf.handleToPath('detail')" />
        </template>
      </div>
    </template>

    <withdrawPeopleDialog :show="conf.withdrawPeopleDialog.show" />

    <div class="content">
      <div class="redpacket">
        <selfInfo />

        <div class="current-amount">
          <span class="unit">{{ conf.amount.unit }}</span>
          <span>{{ conf.amount.received }}</span>
        </div>

        <div class="pending-tips">
          <span
            v-html="$t('luckyWheel.onlyCash', { amount: conf.amount.pending, unit: conf.amount.unit })"
            :class="{ smallUnit: conf.amount.unit.length > 3 }"
          />
        </div>

        <div class="amount-two">
          <div class="received-amount">
            <div class="label">{{ $t('luckyWheel.amountReceived') }}</div>
            <span>
              <span class="unit" :class="{ small: conf.amount.unit.length > 3 }">{{ conf.amount.unit }}</span>
              {{ conf.amount.received }}
            </span>
          </div>
          <div class="pending-amount">
            <div class="label">{{ $t('luckyWheel.pendingAmount') }}</div>
            <span>
              <span class="unit" :class="{ small: conf.amount.unit.length > 3 }">{{ conf.amount.unit }}</span>
              {{ conf.amount.pending }}
            </span>
          </div>
        </div>

        <div class="wheel-box">
          <luckyWheel
            :times="conf.wheel.times"
            :cellData="
              Array.from({ length: 6 }, (_, index) => ({
                label: index % 2 ? $t('luckyWheel.redEnvelope') : $t('luckyWheel.cash'),
                type: index % 2 ? RewardsType.RED_PACKET : RewardsType.COIN
              }))
            "
            :disabled="conf.wheel.disabled"
            :text="conf.amount.isWithdrawal ? $t('luckyWheel.restart') : $t('luckyWheel.start')"
            @click="conf.wheel.click"
            @start="conf.wheel.start"
            @end="conf.wheel.end"
            @disabled-click="conf.wheel.restart"
          />
        </div>

        <div v-if="!conf.amount.isWithdrawal" class="drawing-records" @click="conf.handleToPath('detail')">
          {{ $t('luckyWheel.drawingRecords') }}
        </div>
      </div>

      <div class="countdown">
        <!-- <span>{{ wheel.countdown }} Reward vanishes</span> -->
      </div>

      <div
        v-if="!conf.amount.isWithdrawal && conf.wheel.times === 0 && !conf.wheel.disabled"
        class="speedup-btn"
        @click="conf.overlay.open('Share')"
      >
        <img class="img" src="/static/img/luckyWheel/flash.png" mode="" />
        <span>{{ $t('luckyWheel.speedUp') }}</span>
      </div>
    </div>

    <otherPlayerWithdrawal
      class="other-player-withdrawal"
      :list="conf.otherPlayerWithdrawal.list"
      :unit="conf.amount.unit"
    />

    <van-overlay :show="conf.overlay.show" z-index="99" @click="conf.overlay.close">
      <div class="overlay-content">
        <van-icon class="close" name="close" color="#FFFFFF" size="60rem" @click="conf.overlay.show = false" />
        <!-- 分享界面 -->
        <shareCard
          v-if="conf.overlay.type === 'Share'"
          :amount="{
            total: conf.amount.total,
            pending: conf.amount.pending,
            unit: conf.amount.unit
          }"
        />

        <!-- 好友助力界面 -->
        <friendAssist
          v-if="conf.overlay.type === 'Assist'"
          :avatar="conf.wheel.assistList[conf.wheel.assistList.length - 1].userImgUrl"
          :name="conf.wheel.assistList[conf.wheel.assistList.length - 1].userName"
        />

        <!-- 奖励界面 -->
        <openRewards
          v-if="conf.overlay.type === 'Rewards'"
          :type="conf.wheel.rewardType"
          :amount="conf.wheel.winningAmount"
          :unit="conf.amount.unit"
        />

        <!-- 提现界面 -->
        <withdrawalCard
          v-if="conf.overlay.type === 'Withdrawal'"
          :amount="conf.amount.total"
          :unit="conf.amount.unit"
          :avatar="conf.userInfo.avatarUrl"
          :name="conf.userInfo.nickname"
        />

        <!-- 参与次数达上限 -->
        <limitCard v-if="conf.overlay.type === 'Limit'" />
      </div>
    </van-overlay>
  </x-page>
</template>

<style scoped lang="less">
@import url('./styles/transition.css');

.entry-animation {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 999;
}

.container {
  padding-bottom: 32rem;
  width: 100%;
  height: 100%;
  background-image: url('/static/img/luckyWheel/bg.webp');
  background-repeat: no-repeat;
  background-size: 100% 100%;
  font-family: PingFang SC;

  .head-right {
    padding: 0 32rem;

    .img {
      width: 48rem;
      height: 48rem;

      &:first-child {
        margin-right: 12rem;
      }
    }
  }

  .content {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    padding: 0 32rem;
  }

  .current-amount {
    margin-top: 70rem;
    padding: 0 100rem;
    width: 100%;
    height: 124rem;
    text-align: center;
    font-size: 96rem;
    font-weight: 600;
    color: #ef1017;
    display: flex;
    justify-content: center;
    align-items: flex-end;

    .unit {
      padding-bottom: 12rem;
      margin-right: 8rem;
      font-size: 40rem;
    }
  }

  .redpacket {
    position: relative;
    margin-top: 58rem;
    width: 688rem;
    height: 1119rem;
    background-image: url('/static/img/luckyWheel/redpacket.webp');
    background-size: 100% 100%;

    .pending-tips {
      font-size: 30rem;
      font-weight: 600;
      text-align: center;
      color: #cd5e2c;

      .smallUnit {
        font-size: 28rem;

        ::v-deep(.unit) {
          margin-right: 4rem;
          font-size: 20rem;
        }
      }
    }

    .amount-two {
      margin-top: 24rem;
      padding: 24rem 124rem 0;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .label {
        font-size: 20rem;
        font-weight: 400;
        text-align: center;
        color: #cd5e2c;
      }

      .received-amount,
      .pending-amount {
        font-size: 32rem;
        font-weight: 600;
        color: #cd5e2c;
        text-align: center;

        .unit.small {
          margin-right: 4rem;
          font-size: 24rem;
        }
      }

      .pending-amount {
        color: #ef1017;
      }
    }

    .wheel-box {
      margin: 54rem auto 12rem;
      width: 640rem;
      height: 640rem;
    }

    .drawing-records {
      padding: 0 12rem;
      margin: 0 auto;
      width: max-content;
      height: 44rem;
      text-align: center;
      font-size: 20rem;
      font-weight: 600;
      line-height: 40rem;
      border: 1px solid #fff1b9;
      color: #fff1b9;
      border-radius: 40rem;
    }
  }

  .countdown {
    margin: 20rem auto;
    text-align: center;
    font-size: 24rem;
    font-weight: 500;
    color: #fff9df;
  }

  .speedup-btn {
    width: 684rem;
    height: 112rem;
    border-radius: 100rem;
    background: linear-gradient(to bottom, #ffd914 60%, #fffce6 100%);
    border: 3px solid #ffd914;
    font-size: 40rem;
    font-weight: 600;
    line-height: 112rem;
    text-align: center;
    color: #fa1f00;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: ani 2s infinite alternate;
    box-shadow:
      8rem 8rem 20rem 0px #eb380040,
      0 20rem 20rem 0 #ffffff inset;
    position: relative;

    &::before,
    &::after {
      content: '';
      position: absolute;
      background-color: #ffffff;
      box-shadow: 0 0 6rem 6rem #ffffff;
      border-radius: 50%;
    }

    &::before {
      width: 16rem;
      height: 8rem;
      top: 20rem;
      left: 30rem;
      transform: rotate(-30deg);
    }

    &::after {
      width: 3rem;
      height: 3rem;
      top: 45rem;
      left: 20rem;
    }

    @keyframes ani {
      100% {
        transform: scale(0.95);
      }
    }

    .img {
      width: 70rem;
      height: 70rem;
    }
  }

  .overlay-content {
    margin: 0 auto;
    width: 100%;
    max-width: 500px;
    height: 100%;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    position: relative;

    .close {
      padding: 0 80rem 60rem;
      width: 100%;
      display: flex;
      justify-content: flex-end;
    }
  }

  .other-player-withdrawal {
    position: absolute;
    left: 18rem;
    top: 1200rem;
  }
}
</style>
