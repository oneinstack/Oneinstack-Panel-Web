<template>
  <x-page headerBgColor="transparent" :topfill="false">
    <template #right>
      <div class="flex flex-center" @click="toPage('/user/luckybox/record')">
        <img src="/static/img/luckybox/open-record.png" style="width: 30rem; height: 30rem; margin-right: 28rem" />
      </div>
      <div class="flex items-center" style="padding-right: 30rem">
        <div class="row justify-end" @click="toPage('/user/luckybox/detail')">
          <img src="/static/img/luckybox/rule.png" style="width: 30rem; height: 30rem" />
        </div>
      </div>
    </template>
    <div class="lucky-page-box">
      <x-statusbar header />
      <div class="col relative">
        <div class="column items-center" style="margin: 0rem 30rem">
          <div class="title">{{ $t('promotions.luckyBox') }}</div>
          <!-- 余额显示 -->
          <div class="row flex justify-between fit-width" style="margin-top: 32rem">
            <div class="row items-center add-money">
              <div class="gap">{{ $t('luckyBox.draws') }}:</div>
              <div class="col">{{ conf.boxtype.item.count || 0 }}</div>
              <img class="gap img" src="/static/img/luckybox/plus.png" @click="toPage('/user/tasks/tasks')" />
            </div>
          </div>
          <!-- 滚动提示中奖信息 -->
          <div class="scroll-list row items-center">
            <img class="item" src="/static/img/luckybox/laba.png" />
            <div class="col text">
              <template v-if="conf.scroll.item">
                <div
                  :style="{ '--anitime': `${conf.scroll.item.time}ms` }"
                  class="leftAni1 row no-wrap items-center"
                  style="width: max-content"
                >
                  <div class="text-color-1">{{ $t('luckyBox.congratulationsTo') }}</div>
                  <div style="color: #fff; margin: 0 5rem">[ {{ conf.scroll.item.userName }} ]</div>
                  <div class="text-color-1">{{ $t('luckyBox.forObtaining') }}</div>
                  <div class="row items-center" style="color: #fff; margin: 0 6rem">
                    [
                    <img
                      mode="heightFix"
                      style="height: 26rem; margin: 0 4rem"
                      :src="`/static/img/luckybox/scroll/${conf.scroll.item.imgurl}.png`"
                    />
                    {{ conf.scroll.item.type + ' x ' + conf.scroll.item.number }} ]
                  </div>
                  <div class="text-color-1">{{ $t('luckyBox.throughTheLuckyBox') }}</div>
                </div>
              </template>
            </div>
            <div class="item"></div>
          </div>
          <!-- 宝箱动画 -->
          <div
            class="ani-box relative flex flex-center"
            @touchstart.passive="conf.touch.touchdown"
            @touchmove.passive="conf.touch.obj.move"
            @touchend.passive="conf.touch.touchup"
            @mousedown.passive="conf.touch.touchdown"
            @mousemove.passive="conf.touch.obj.move"
            @mouseup.passive="conf.touch.touchup"
          >
            <div class="absolute ani-1"></div>
            <div class="absolute bg"></div>

            <div
              class="flex flex-center"
              style="width: 320rem; height: 300rem; transform: translateY(-80rem); overflow: hidden"
            >
              <div class="absolute">
                <x-imgAni
                  ref="wait"
                  :show="conf.ani.wait.show"
                  :scale="0.65"
                  :width="600"
                  :height="600"
                  :len="30"
                  :time="2000"
                  :url="`/static/img/luckybox/boxani/ani-${conf.boxtype.item.boxType}-wait.png`"
                />
              </div>
              <div class="absolute">
                <x-imgAni
                  ref="openRef"
                  :show="conf.ani.open.show"
                  :scale="0.65"
                  :width="600"
                  :height="600"
                  :len="33"
                  :time="2000"
                  :url="`/static/img/luckybox/boxani/ani-${conf.boxtype.item.boxType}-open.png`"
                />
              </div>
            </div>
            <div class="absolute text-color-1" style="color: #fd1e30; font-size: 28rem; font-weight: 600; top: -20rem">
              {{ conf.boxtype.item.boxName }}
            </div>
            <div class="absolute flex justify-between" style="width: 480rem; transform: translateY(-80rem)">
              <div class="flex flex-center" style="width: 80rem; height: 80rem" @click="conf.boxtype.toItem(-1)">
                <img :src="`/static/img/luckybox/left.png`" style="width: 12rem; height: 26rem" />
              </div>
              <div class="flex flex-center" style="width: 80rem; height: 80rem" @click="conf.boxtype.toItem(1)">
                <img :src="`/static/img/luckybox/right.png`" style="width: 12rem; height: 26rem" />
              </div>
            </div>
          </div>

          <!-- 奖励列表 -->
          <div class="award-list flex justify-center">
            <div class="award-list-title">{{ $t('luckyBox.rewards') }}</div>
            <div
              class="award-list-box relative"
              style="overflow: hidden"
              :style="{ '--anitime-scroll': `${conf.reward.time}ms` }"
            >
              <div
                class="row no-wrap absolute"
                :class="[conf.reward.list.length > 8 ? 'leftAni' : 'fit-width justify-around']"
              >
                <template v-for="item in conf.reward.list">
                  <div class="award-item column items-center relative">
                    <div class="relative" style="width: 64rem; height: 64rem">
                      <img
                        v-if="item.coinCode !== 'USDT'"
                        :src="`/static/img/luckybox/${item.imgurl}.png`"
                        class="award-item-img"
                      />
                      <img v-else src="/static/img/luckybox/cash-usdt.png" class="award-item-img" />
                      <div
                        v-if="item.rewardType === 0 && item.coinCode !== 'USDT'"
                        class="award-item-unit"
                        :class="{ small: item.coinSymbol?.length > 1 }"
                      >
                        {{ item.coinSymbol }}
                      </div>
                    </div>
                    <div class="award-item-num">x{{ item.amount }}</div>
                    <div class="award-item-text">{{ item.label }}</div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- 开奖按钮 -->
          <div class="btn-list row items-center" style="gap: 0 12rem">
            <active-button type="orange" :text="$t('luckyBox.draw1Times')" @click="conf.box.open(1)" />
            <active-button type="pink" :text="$t('luckyBox.draw5Times')" @click="conf.box.open(5)" />
            <active-button type="purple" :text="$t('luckyBox.draw10Times')" @click="conf.box.open(10)" />
          </div>
        </div>
      </div>
    </div>
    <luckyboxRes ref="luckyboxResRef" @close="conf.ani.startWait" />
  </x-page>
</template>

<script lang="ts" setup>
import { apis } from '@/api/index'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { reactive, ref } from 'vue'
import activeButton from './components/active-button.vue'
import luckyboxRes from './components/luckyboxRes.vue'

const timer = Scope.Timer()
const toPage = System.router.push
const luckyboxResRef = ref<any>(null)
const openRef = ref<any>(null)
const conf = reactive({
  touch: {
    obj: DomUtil.useTouch(),
    starttime: 0,
    touchdown: (e: any) => {
      conf.touch.obj.start(e)
      conf.touch.starttime = Date.now()
    },
    touchup: (e: any) => {
      const { deltaX, deltaY } = conf.touch.obj.conf
      const time = Date.now() - conf.touch.starttime
      conf.touch.obj.reset()
      if (time > 200 || (deltaX < 10 && deltaX > -10) || Math.abs(deltaY) > 100) return
      conf.boxtype.toItem(deltaX > 0 ? 1 : -1)
    }
  },

  boxtype: {
    itemIndex: 0,
    item: {} as any,
    list: [] as any[],
    //选择宝箱
    chooseItem: (itemIndex: number) => {
      conf.boxtype.itemIndex = itemIndex
      const item = conf.boxtype.list[itemIndex]
      if (item.id === conf.boxtype.item.id) {
        conf.boxtype.item = {
          ...item
        }
        return
      }
      conf.boxtype.item = item
      conf.reward.getList(item.boxType)
    },
    //跳转指定类型宝箱
    toItem: (num: number) => {
      const itemIndex = conf.boxtype.itemIndex
      const listlen = conf.boxtype.list.length
      num += itemIndex
      if (num > listlen - 1) num = 0
      else if (num < 0) num = listlen - 1
      conf.boxtype.chooseItem(num)
    },
    //获取宝箱类型列表
    getList: async () => {
      System.loading()
      const { data } = await apis.boxReadyList({
        final: () => {
          System.loading(false)
        }
      })
      conf.boxtype.list = data.sort((a: any, b: any) => b.count - a.count)
      let citemIndex = 0
      if (conf.boxtype.item.id) {
        citemIndex = data.findIndex((v: any) => v.id === conf.boxtype.item.id)
      }
      conf.boxtype.chooseItem(citemIndex)
    }
  },
  box: {
    //当前是否正在开奖
    isOpen: false,
    //开启指定数量宝箱
    open: async (num: number) => {
      if (conf.box.isOpen) return
      conf.box.isOpen = true
      if (conf.boxtype.item.count < num) {
        System.toast(i18n.t('luckyBox.insufficientQuantity'))
        return
      }
      System.loading()
      let { data } = await apis.openTreasureBox({
        boxSize: num,
        boxId: conf.boxtype.item.id,
        final: (status, res) => {
          System.loading(false)
          if (!status) {
            conf.box.isOpen = false
            return
          }
          conf.boxtype.getList()
        }
      })
      JSONUtil.strToObject(data)
      await conf.ani.play()
      data = data.map((item: any) => {
        const _item = conf.getWinItem(item)
        return {
          ...item,
          ...conf.reward.imgUrlObj[item.rewardType],
          ..._item
        }
      })
      //开启奖励列表弹框显示
      luckyboxResRef.value.open(data)
      conf.box.isOpen = false
    }
  },
  getWinItem: (b: any) => {
    const item: any = { rewardType: b.rewardType, type: b.rewardType, userName: b.userName, number: b.number }

    item.type = conf.reward.imgUrlObj[b.rewardType].label

    if (typeof b.reward === 'object') {
      b.rewardContent = {
        ...b.rewardContent,
        ...b.reward
      }
    }

    if (item.rewardType === 0) {
      item.amount = Number(b.rewardContent?.amount) * item.number
      item.coinCode = b.rewardContent?.coinCode
      item.coinSymbol = conf.coin.getSymbol(item.coinCode)
    } else if (item.rewardType === 1) {
      item.amount = Number(b?.rewardContent ?? b.reward) * item.number
    } else if (item.rewardType === 2) {
      item.amount = item.number
      item.type = b.reward
    } else if (item.rewardType === 4) {
      item.amount = Number(b?.rewardContent ?? b.reward) * item.number
    }

    if (item.amount) item.amount = sutil.dataHandling(item.amount, 0)

    return item
  },
  scroll: {
    time: 10,
    item: null as any,
    list: [] as any[],
    start: (index: number) => {
      if (!conf.scroll.list.length) return
      const item = conf.scroll.list[index]
      conf.scroll.item = item
      timer.once(async () => {
        let nextindex = index + 1
        if (nextindex > conf.scroll.list.length - 1) nextindex = 0

        conf.scroll.item = null
        conf.scroll.start(nextindex)
      }, item.time)
    },
    getList: async () => {
      let { data } = await apis.getStatistics({
        dataType: '21',
        size: 10,
        current: 1
      })
      data = data['21']
      JSONUtil.strToObject(data)
      data = data.map((item: any) => {
        const sp = item.customMessage.substring(item.customMessage.lastIndexOf('-') + 1).split('_')
        return {
          userName: item.userName,
          number: 1,
          reward: item.amount,
          rewardType: sp[0]
        }
      })
      const list = data.reduce((a: any, b: any) => {
        const item = conf.getWinItem(b)
        a.push(item)
        return a
      }, [])
      conf.scroll.list = list.map((item: any) => {
        item.time = (String(item.userName).length + String(item.number).length) * 1000 + 10000
        return { ...item, ...conf.reward.imgUrlObj[item.rewardType] }
      })

      conf.scroll.start(0)
    }
  },
  ani: {
    wait: {
      show: true
    },
    open: {
      show: false
    },
    //播放开奖动画
    play: async () => {
      conf.ani.wait.show = false
      conf.ani.open.show = true
      await openRef.value.start({
        num: 1
      })
    },
    startWait: async () => {
      conf.ani.wait.show = true
      await openRef.value.init()
      conf.ani.open.show = false
    }
  },
  reward: {
    list: [] as any[],
    time: 10000,
    imgUrlObj: {
      0: {
        label: i18n.t('luckyBox.cash'),
        imgurl: 'cash'
      },
      4: {
        label: i18n.t('luckyBox.memberExp'),
        imgurl: 'jifen'
      },
      2: {
        label: i18n.t('luckyBox.entity'),
        imgurl: 'entity'
      },
      1: {
        label: i18n.t('luckyBox.memberPoints'),
        imgurl: 'points'
      }
    } as any,
    listObj: {} as any,
    //获取指定宝箱类型的奖励列表
    getList: async (boxType: number) => {
      let data = conf.reward.listObj[boxType]
      if (!data) {
        System.loading()
        const res = await apis.getBoxRewardList({
          boxType,
          final: () => {
            System.loading(false)
          }
        })
        conf.reward.listObj[boxType] = res.data
        data = res.data
      }
      JSONUtil.strToObject(data)
      conf.reward.list = data.map((item: any) => {
        const _item = conf.getWinItem(item)
        return {
          ...item,
          ...conf.reward.imgUrlObj[item.rewardType],
          ..._item
        }
      })
      const len = conf.reward.list.length
      if (len > 4) {
        conf.reward.list = conf.reward.list.concat(conf.reward.list)
        conf.reward.time = len * 1500
      }
      if (len == 4) {
        const _list = [...conf.reward.list]
        conf.reward.list = _list.concat(_list).concat(_list).concat(_list)
        conf.reward.time = len * 1500 * 2
      }
    }
  },
  coin: {
    list: [] as any[],
    getSymbol: (coinCode: string) => {
      return conf.coin.list.find((it: any) => it.coinCode === coinCode)?.coinSymbol
    }
  }
})

const init = async () => {
  await svalue.isOpen('activity_treasure_box')
  await svalue.getCoinlist()
  conf.coin.list = svalue.coinlist
  await conf.boxtype.getList()
  await conf.scroll.getList()
}
init()
</script>

<style lang="less" scoped>
.text-color-1 {
  color: #fd172d;
}

.lucky-page-box {
  background: linear-gradient(180.23deg, #ff7ebc 0.2%, #fe8049 55.76%, rgba(255, 166, 79, 0) 99.8%);
  .title {
    font-size: 64rem;
    font-weight: 400;
    text-shadow: 6rem 4rem #ed4427;
    color: #fff;
    font-family: RammettoOne;
  }
  .add-money {
    height: 40rem;
    background: #ffffff33;
    border-radius: 20rem;
    color: #fff;
    font-size: 20rem;
    min-width: 140rem;
    .gap {
      margin-left: 16rem;
      margin-right: 12rem;
    }
    .img {
      width: 24rem;
      height: 24rem;
    }
  }
  .record-btn {
    width: 88rem;
    height: 88rem;
    box-shadow: 0 0 4px 4px #ffffff33 inset;
    border-radius: 50%;
    position: relative;
    .gap {
      position: absolute;
      bottom: -24rem;
      width: 88rem;
      height: 32rem;
      border-radius: 4rem;
      background: linear-gradient(293.08deg, #ff8d5c 14.94%, #fc112a 85.06%);
      border: 1px solid #fffdf1;
      font-size: 18rem;
      font-weight: 500;
      color: #fff;
      text-align: center;
      line-height: 32rem;
    }
  }
  .scroll-list {
    width: 450rem;
    height: 38rem;
    margin-top: 26rem;
    background-color: #ffffff33;
    border-radius: 20rem;
    z-index: 1;
    .text {
      font-size: 20rem;
      overflow: hidden;
    }
    .item {
      margin-left: 12rem;
      margin-right: 12rem;
      width: 28rem;
      height: 28rem;
    }
  }
}

@keyframes leftAni1 {
  0% {
    transform: translateX(348rem);
  }

  100% {
    transform: translateX(-101%);
  }
}
.leftAni1 {
  animation: leftAni1 var(--anitime) infinite linear;
}

.leftAni {
  animation: leftAni var(--anitime-scroll) infinite linear;
}

@keyframes leftAni {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}
.ani-box {
  width: 692rem;
  height: 482rem;
  margin-top: 92rem;
  .bg {
    width: 100%;
    height: 100%;
    background-size: 100% 100%;
    background-image: url('/static/img/luckybox/dizuo.webp');
  }
  .ani-1 {
    box-shadow: #ffeeb2cc 2px -1px 20px 20px;
    transform: scale(7, 6) translateY(-10rem);
  }
}

.award-list {
  width: 618rem;
  height: 280rem;
  background-size: 100% 100%;
  margin-top: 48rem;
  background-image: url('/static/img/luckybox/box-list.png');
  color: #fff;
  position: relative;
  &-title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 24rem;
    font-weight: 500;
    line-height: 52rem;
    text-align: center;
  }
  &-box {
    font-size: 16rem;
    width: 560rem;
    margin-top: 80rem;
    overflow: hidden;
  }
  .q-num {
    margin-top: 22rem;
    margin-left: 10rem;
    font-size: 16rem;
  }
  .award-item {
    font-family: PingFang SC;
    padding-top: 12rem;
    box-sizing: border-box;
    margin: 0rem 24rem;
    width: 112rem;
    height: 112rem;
    border-radius: 6rem;
    border: 1px solid #ffffff;

    &-unit {
      font-size: 28rem;
      font-weight: 600;
      position: absolute;
      top: 0;
      left: 0;
      color: #fa9e3e;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      line-height: 60rem;

      &.small {
        font-size: 20rem;
      }
    }

    &-img {
      width: 100%;
      height: 100%;
    }

    &-num {
      font-size: 20rem;
      font-weight: 600;
      line-height: 28rem;
      text-align: center;
    }

    &-text {
      width: 100%;
      height: 28rem;
      font-size: 20rem;
      line-height: 28rem;
      position: absolute;
      bottom: -40rem;
      text-align: center;
      color: #fffce8;
    }
  }
}

.btn-list {
  margin-top: 60rem;
  .btn-item {
    width: 190rem;
    height: 98rem;
    margin: 0 10rem;
    font-size: 24rem;
    color: #ffffff;
  }
  .t-box {
    transform: rotateZ(10deg) skewY(350deg);
    box-shadow: inset -4px -4px 2px #ffffff40;
    border-radius: 6rem;
  }
  .t1 {
    background: linear-gradient(180deg, #ff5b50 0%, #fe9c65 160%);
  }
  .t2 {
    background: linear-gradient(180deg, #ff3a96 0%, #ff77b6 160%);
  }
  .t3 {
    background: linear-gradient(180deg, #7330ff 0%, #c954ff 160%);
  }
}
</style>
