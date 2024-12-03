<template>
  <x-page no-header no-footer>
    <div class="content-view">
      <div class="top-view">
        <img src="/static/img/redEnvelope/top.webp" class="top-img" />
      </div>
      <div class="center-view">
        <div class="center-into-view" v-if="!conf.isRedEnvelopeRain">
          <img src="/static/img/redEnvelope/result.webp" class="result-img" />
          <div class="info-view">
            <!-- 活动未开始 -->
            <div class="not-start" v-if="conf.activityProgress == 0">{{ $t('redEnvelopeModule.notStarted') }}</div>
            <!-- 准备抢红包 -->
            <template v-if="conf.activityProgress == 1">
              <div class="start">{{ $t('redEnvelopeModule.Scramble') }}</div>
              <div class="start-btn" @click="conf.handleBtns('start_looting')">
                {{ $t('redEnvelopeModule.StartLooting') }}
              </div>
            </template>
            <!-- 红包已抢完 -->
            <template v-if="conf.activityProgress == 2">
              <!-- 红包已抢完，且金额大于0 -->
              <div class="end" v-if="Number(conf.redAmount) > 0">
                {{ $t('redEnvelopeModule.Whoaa') + ': ' + conf.walletInfo.coinSymbol + conf.redAmount }}
              </div>
              <!-- 红包已抢完，但金额为0 -->
              <div class="end" v-else>
                {{ $t('redEnvelopeModule.Unfortunately') + ' : ' + conf.walletInfo.coinSymbol + conf.redAmount }}
              </div>
              <div class="end-item">{{ $t('redEnvelopeModule.Keep') }}</div>
            </template>
            <!-- 今日红包已抢过 -->
            <template v-if="conf.activityProgress == 3">
              <div class="end">{{ $t('redEnvelopeModule.snatched') }}</div>
            </template>
          </div>
        </div>
      </div>

      <div class="bottom-view">
        <img src="/static/img/redEnvelope/bottom.webp" class="bottom-img" />
        <div class="text-view" v-if="conf.countdown > 0 && conf.isRedEnvelopeRain">
          {{ $t('redEnvelopeModule.RemainingTime') + ': ' + conf.countdown + 's' }}
        </div>
        <div class="btn-view" @click="sutil.pageBack" v-else>{{ $t('redEnvelopeModule.Quit') }}</div>
      </div>

      <!-- 红包雨 -->
      <div v-if="conf.isRedEnvelopeRain">
        <redpacketrain @clickRedPacket="conf.clickRedPacket" :setDataList="conf.redRainList"></redpacketrain>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onBeforeMount, onMounted, onUnmounted, reactive } from 'vue'
import redpacketrain from './redpacketrain.vue'

const timer = Scope.Timer()
const event = Scope.Event()
const conf = reactive({
  serviceHeiht: 300,
  countdown: 0, //抢红包倒计时
  isRedEnvelopeRain: false, //判断是否掉落红包雨
  ws: null! as WebSocketBeanInter,
  wsEventKey: 'wsEventKey_' + StrUtil.getId() + '_',
  userInfo: {} as any,
  redpacketList: [] as any[],
  clickRedIndex: null as any,
  redRainList: [] as any[],
  redAmount: '' as any, //抢到红包金额
  redInfo: {} as any,

  /**
   * 用户默认钱包
   */
  walletInfo: {} as any,
  /**
   * 0:活动未开始
   * 1:准备抢红包
   * 2:红包已抢完
   * 3:今日红包已抢过
   */
  activityProgress: 1,

  //获取红包雨列表
  getList() {
    let obj = Cookie.get('redEnvelopeInfo')

    if (!obj?.redpacketList?.length) {
      System.router.replace('/')
      return
    }

    conf.redpacketList = obj.redpacketList.filter((item: any) => item.states == 0)

    if (!conf.redpacketList.length) {
      conf.activityProgress = 3
      return
    }

    //红包活动开始 -- 未玩
    conf.redInfo = conf.redpacketList[0] || {}
  },

  /**
   * 检查并建立websocket连接
   */
  async checkOpenSocket() {
    let wsurl = System.env.API
    //#ifvar-dev
    if (System.env.API.includes('6521/api')) {
      wsurl = Cookie.get('apiurl')
    }
    //#endvar

    if (wsurl.startsWith('/')) wsurl = location.origin
    wsurl = wsurl.replace('http', 'ws')

    return new Promise((resolve, reject) => {
      System.loading()
      conf.ws = new WebSocketBean({
        url: `${wsurl}/api/mini/games/redPacketRain/${sconfig.userInfo.token}/${conf.redInfo.id}`,
        onopen() {
          System.loading(false)
          conf.activityProgress = 1
          return new Promise((res) => {
            res(true)
          })
        },
        onerror() {
          System.loading(false)
          conf.activityProgress = 0
          conf.isRedEnvelopeRain = false
          conf.ws = null!
          reject(false)
        },
        onmessage(ev) {
          try {
            let _data = JSON.parse(ev.data)
            _data = JSON.parse(_data.data)
            console.log('conf.wsEventKey + _data.data.id', conf.wsEventKey + _data.data.id, _data.data)
            event.emit(conf.wsEventKey + _data.data.id, _data.data)
          } catch (error) {
            console.log(error)
          }
        },
        binaryType: 'arraybuffer'
      })
      conf.ws.start()
    })
  },

  /**
   * 发送数据
   * @param data 数据
   */
  sendData(data: any): Promise<any> {
    return new Promise((res) => {
      const id = StrUtil.getId()
      conf.ws.send(
        JSON.stringify({
          ...data,
          id
        })
      )
      event.once(conf.wsEventKey + id, (data) => {
        res(data)
      })
    })
  },

  /**
   * 点击红包
   * @param item 红包对象
   */
  async clickRedPacket(item: any) {
    const res = await conf.sendData({
      type: 'click'
    })
    console.log('res', res)
    item.amount = res.money
  },

  /**
   * 结束红包雨
   */
  async endRedPacket() {
    conf.isRedEnvelopeRain = false
    conf.activityProgress = 2

    const res = await conf.sendData({
      type: 'expense',
      userCoinCode: conf.walletInfo.walletCoin || ''
    })
    console.log('res1', res)
    conf.redAmount = res.money
  },

  /**
   * 倒计时
   */
  async startDownTime() {
    await Timer.delay(4000)
    conf.countdown = 15
    timer.on(() => {
      conf.countdown--
      if (conf.countdown <= 0) {
        timer.clear()
        conf.endRedPacket()
      }
    }, 1000)
  },

  //btns
  async handleBtns(type: any) {
    await conf.checkOpenSocket()
    conf.startDownTime()
    conf.isRedEnvelopeRain = true
  }
})

const init = async () => {
  conf.walletInfo = await svalue.getDefaultWallet()
}

onBeforeMount(() => {
  conf.userInfo = sconfig.userInfo
  conf.getList()
})

onMounted(() => {
  init()
})

onUnmounted(() => {
  conf.ws?.dispose()
  conf.ws = null!
})
</script>
<style lang="less" scoped>
.content-view {
  height: 100%;
  overflow: hidden;
  background: url(/static/img/redEnvelope/underlay.png);

  .top-view {
    width: 100%;
    height: 172rem;
    position: relative;

    .top-img {
      width: 100%;
      height: 100%;
      position: absolute;
      z-index: 99;
      filter: drop-shadow(0px 10px 20px rgba(0, 0, 0, 0.25));
    }
  }

  .center-view {
    width: 100%;
    height: calc(100% - 172rem - 194rem);
    padding: 30rem;

    .center-into-view {
      position: relative;

      .result-img {
        width: 632rem;
        height: 1048rem;
        margin-left: calc(50% - 316rem);
      }

      .info-view {
        position: absolute;
        top: 30%;
        left: calc(50% - 137rem);
        width: 274rem;
        height: 50%;
        // display: inline-grid;
        display: grid;
        align-items: center;
        text-align: center;

        .not-start {
          color: #524b49;
          font-size: 40rem;
          font-weight: 400;
          line-height: 52rem;
        }

        .start {
          color: #524b49;
          font-size: 40rem;
          font-weight: 400;
          line-height: 52rem;
          margin-top: 60rem;
        }

        .start-btn {
          color: #524b49;
          font-size: 32rem;
          font-weight: 400;
          line-height: 42rem;
          height: 70rem;
          line-height: 70rem;
          width: 276rem;
          background-color: #fde1ab;
          border-radius: 46rem;
        }

        .end {
          color: #524b49;
          font-size: 40rem;
          font-weight: 600;
          line-height: 52rem;
          margin-top: 70rem;
        }

        .end-item {
          color: #484848;
          font-size: 28rem;
          font-weight: 600;
          opacity: 0.8;
          padding: 20rem;
          margin-top: -60rem;
        }

        .end-btn {
          color: #915d4a;
          font-size: 40rem;
          font-weight: 400;
          height: 70rem;
          line-height: 70rem;
          width: 276rem;
          background-color: #fde1ab;
          border-radius: 46rem;
          margin-top: -70rem;
        }
      }
    }
  }

  .bottom-view {
    width: 100%;
    height: 194rem;
    text-align: center;
    position: relative;

    .bottom-img {
      width: 100%;
      height: 100%;
      z-index: 99;
      position: absolute;
      left: 0;
      filter: drop-shadow(0px -10px 20px rgba(0, 0, 0, 0.25));
    }

    .btn-view {
      position: absolute;
      top: calc(50% - 35rem);
      left: calc(50% - 138rem);
      width: 276rem;
      height: 70rem;
      line-height: 70rem;
      color: #915d4a !important;
      font-size: 40rem;
      background: #fde1ab;
      border-radius: 46rem;
      font-size: 600;
      z-index: 99;
    }

    .text-view {
      text-align: center;
      width: 100%;
      height: 68rem;
      line-height: 68rem;
      position: absolute;
      bottom: calc(50% - 34rem);
      color: #ffb69c;
      font-size: 48rem;
      z-index: 99;
    }
  }
}

.redBigMid {
  width: 508rem;
  height: 350rem;
  background-color: #fff;
  border-radius: 24rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ff4545;

  position: absolute;
  z-index: 0;
  margin-top: 260rem;
  opacity: 0;

  .text1 {
    margin-top: 20rem;
    font-size: 32rem;
  }

  .text2 {
    margin-top: 30rem;
    font-size: 70rem;
  }

  .text3 {
    margin-top: 30rem;
  }
}
</style>
