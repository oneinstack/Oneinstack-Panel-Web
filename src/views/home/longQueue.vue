<template>
  <x-page :showBack="false" tabbar class="longQueue-page-box column">
    <template #title>
      <div class="row items-center">
        <div>{{ $t('LongQueue.title') }}</div>
        <img @click="conf.toPage('/home/long/detail')" class="rule-icon" src="/static/img/luckybox/rule.png" />
      </div>
    </template>
    <template #right>
      <div class="row justify-end" style="width: 100rem">
        <img class="list-icon" src="/static/img/icons/order.png" @click="conf.toPage('/user/myBet/index')" />
      </div>
    </template>

    <!-- 列表 -->
    <div class="flex items-center relative" style="margin: 0rem 32rem">
      <template v-for="item in conf.list">
        <div class="list-item column items-center no-wrap relative">
          <div style="height: 44rem"></div>
          <div class="relative row items-center" style="height: 108rem; width: 100%; font-size: 20rem">
            <!-- 彩种图标 -->
            <img class="logo-img" :src="'/static/img/long/' + item.lotteryTypeCode + '.png'" />
            <!-- 有效信息 -->
            <div class="col column" style="font-weight: 500">
              <div style="font-size: 32rem; font-weight: 600">{{ item.lotteryName }}</div>
              <div class="row no-wrap">
                <div style="color: #999999">{{ item.betExpect }}</div>
                <div style="color: #fc9b01; margin-left: 20rem">
                  {{
                    item.countDown[3] > 0 ? `${item.countDown[0]}:${item.countDown[1]}:${item.countDown[2]}` : 'Drawing'
                  }}
                </div>
              </div>
              <div class="row text-1">
                <div class="border-4" style="background: #d9d9d9">
                  <div style="margin: 0 8rem">{{ item.playName }}</div>
                </div>
                <div class="border-4" :class="[`${item.betConent}`]">
                  <div style="margin: 0 8rem">{{ item.betConent }}</div>
                </div>
                <div class="border-4" style="background: linear-gradient(180deg, #ff7502 0%, #fc9b01 160%)">
                  <div style="margin: 0 8rem">{{ $t('LongQueue.Issue') }} {{ item.longCount }}</div>
                </div>
              </div>
            </div>
            <!-- 下注按钮 -->
            <div class="row flex-center no-wrap" style="width: 280rem">
              <div
                v-for="btn in item.oddsArray"
                class="column items-center relative no-wrap"
                :class="[
                  item.oddsArray.length > 2 ? 'choose-item-color' : 'choose-item',
                  btn.id === conf.bet.item.id ? 'active' : ''
                ]"
                @click="conf.bet.choose(btn)"
                :style="{ pointerEvents: item.needStop ? 'none' : 'all' }"
              >
                <div><img class="img" :src="'/static/img/long/' + btn.betConent + '.png'" /></div>
                <div class="text">{{ btn.odds }}</div>
                <div v-if="item.needStop" class="absolute fit" style="background-color: #eee; opacity: 0.7"></div>
              </div>
            </div>
            <div style="width: 12rem"></div>
          </div>
          <div style="height: 44rem"></div>
        </div>
      </template>
    </div>

    <bet-popup :showShare="false" :betShow="conf.bet.show" @submit="conf.bet.submit">
      <img
        v-if="conf.bet.item.betConent"
        style="width: 124rem; height: 124rem"
        :src="'/static/img/long/' + conf.bet.item.betConent + '.png'"
      />
    </bet-popup>
  </x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'
import betPopup from '../game/components/betPopup.vue'

const timer = Scope.Timer()
const conf = reactive({
  list: [] as any[],
  loading: false,
  lastTime: 0,
  toPage: (path: string) => {
    System.router.push(path)
  },
  getList: async () => {
    const ttime = Date.now() - conf.lastTime
    if (conf.loading || ttime < 3000) return
    conf.loading = true
    conf.lastTime = Date.now()
    const res = await apis.changLong({
      final: () => {
        conf.loading = false
      }
    })
    if (!res.data.length) {
      timer.once(() => {
        conf.getList()
      }, 3500)
      return
    }

    // 处理赔率和按钮列表排序
    const getSort = (resArr: any[]) => {
      const arr = [
        ['big', 'small'],
        ['odd', 'even'],
        ['red', 'green', 'violet']
      ]
      interface Obj {
        [key: string]: any
      }
      const obj: Obj = {
        big: 0,
        small: 0,
        odd: 1,
        even: 1,
        red: 2,
        green: 2,
        violet: 2
      }
      return resArr.sort((a, b) => {
        const to = arr[obj[b.betConent]]
        return to.indexOf(a.betConent) - to.indexOf(b.betConent)
      })
    }

    res.data = res.data.map((item: any, index: any) => {
      item.id = item.lotteryId + item.oddsArray[0].lotteryOddsId
      item.oddsObj = item.oddsArray.reduce((a: any, b: any) => {
        b.id = item.id + b.lotteryOddsId
        b.pid = item.id
        b.odds = Number(b.odds).toFixed(2)
        const spIndex = b.betCodes.lastIndexOf('_')
        const plname = b.betCodes.substring(0, spIndex)
        // 处理多个下划特殊5D
        const playName = plname.indexOf('_') !== -1 ? plname.split('_')[1] : plname
        const betConent = b.betCodes.substring(spIndex + 1)
        // 处理有效内容
        if (b.count > 0) {
          // 处理多个下划特殊5D
          item.playName = playName
          item.betConent = betConent
          item.longCount = b.count
          item.betCodes = b.betCodes
        }
        //对选中数据赋值，优化数据传输
        b.betConent = betConent
        ;(b.betExpect = item.betExpect),
          (b.betOpenId = item.betOpenId),
          (b.lotteryId = item.lotteryId),
          (a[betConent] = b)
        a[b.betCodes] = b
        return a
      }, {})
      item.oddsArray = getSort(item.oddsArray)
      item.countDown = ['00', '00', '00']
      return item
    })
    conf.list = res.data
    conf.time.run()
  },
  bet: {
    show: false,
    item: {} as any,
    close: () => {
      conf.bet.item = {}
      conf.bet.show = false
    },
    choose: (item: any) => {
      conf.bet.item = item
      conf.bet.show = true
    },

    submit: (e: any) => {
      FunUtil.throttle(() => {
        conf.bet.submitFun(e)
      })
    },
    //下注提交
    submitFun: async (e: any) => {
      if (!e) {
        conf.bet.close()
        return
      }
      const betItem = conf.bet.item

      const winfo = await svalue.getDefaultWallet()
      const obj = {
        money: e,
        betCodes: betItem.betCodes,
        betExpect: betItem.betExpect,
        betOpenId: betItem.betOpenId,
        lotteryId: betItem.lotteryId,
        multiple: 1,
        nums: 1,
        supplement: 0,
        walletCoinCode: winfo.walletCoin
      }
      System.loading()
      await apis.lotteryUserBets({
        ...obj,
        final: async () => {
          System.loading(false)
          conf.bet.close()
        }
      })
      System.toast(i18n.t('game.betSuccess'), 'success')
    }
  },
  time: {
    getStatus: false,
    run: () => {
      timer.clear()
      timer.on(
        async () => {
          if (!conf.list.length) return
          const stime = sconfig.nowTime()
          conf.list.forEach((item) => {
            item.countDown = sutil.getCountDown(item.openTime - stime)
            if (item.countDown[3] <= 0) {
              conf.getList()
            }
            if (item.stopTime - stime <= 0) {
              item.needStop = true
              if (conf.bet.item?.pid === item.id) {
                conf.bet.close()
              }
            }
          })
        },
        1000,
        true
      )
    }
  }
})
onMounted(() => {
  System.loading(false)
  timer.on(
    () => {
      conf.getList()
    },
    60000,
    true
  )
})
</script>

<style lang="less" scoped>
.rule-icon {
  width: 20rem;
  height: 20rem;
  margin-left: 10rem;
}

.list-icon {
  width: 40rem;
  height: 40rem;
  margin-right: 28rem;
}

.longQueue-page-box {
  height: 100vh;
  background: #f5f5fa;

  .list-item {
    margin-top: 20rem;
    border-radius: 10rem;
    box-shadow: 0px 0px 14rem 0px #a8a8a8;
    background: #fff;
    width: 100%;

    .big {
      background: linear-gradient(180deg, #cf0001 0%, #ee4343 160%);
    }

    .small {
      background: linear-gradient(180deg, #00c4fe 0%, #59cbff 160%);
    }

    .even {
      background: linear-gradient(180deg, #72d614 0%, #92df03 160%);
    }

    .odd {
      background: linear-gradient(180deg, #f80760 0%, #ff8293 160%);
    }

    .red {
      background: linear-gradient(180deg, #f80760 0%, #ff8293 160%);
    }

    .green {
      background: linear-gradient(180deg, #12c52e 0%, #45e858 160%);
    }

    .violet {
      background: linear-gradient(180deg, #8c4ee8 0%, #621ec9 160%);
    }
  }

  .logo-img {
    width: 108rem;
    height: 108rem;
    margin: 0 20rem;
  }

  .text-1 {
    color: #ffffff;
    gap: 8rem;
    margin-top: 8rem;
  }

  .active {
    background: linear-gradient(180deg, #ffa54f 0%, #ec622e 160%);

    .text {
      color: #ffffff;
    }
  }

  .choose-item {
    width: 108rem;
    height: 108rem;
    margin: 0 6rem;
    color: #c0c0c0;
    border: 1rem solid #d6d6d6;
    border-radius: 8rem;

    .img {
      width: 64rem;
      height: 64rem;
      margin-top: 7rem;
    }
  }

  .choose-item-color {
    width: 84rem;
    height: 84rem;
    margin: 0 4rem;
    color: #c0c0c0;
    border: 1rem solid #d6d6d6;
    border-radius: 8rem;

    .img {
      width: 46rem;
      height: 46rem;
      margin-top: 4rem;
    }
  }
}

.border-4 {
  border-radius: 4rem;
}
</style>
