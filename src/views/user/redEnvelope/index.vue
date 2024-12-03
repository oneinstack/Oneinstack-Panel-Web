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
              <div class="end" v-if="Number(conf.redAmount) > 0">
                {{ $t('redEnvelopeModule.Whoaa') + ': ' + conf.coinMark + conf.redAmount }}
              </div>
              <div class="end" v-else>
                {{ $t('redEnvelopeModule.Unfortunately') + ' : ' + conf.coinMark + conf.redAmount }}
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
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
import redpacketrain from './redpacketrain.vue'
const conf = reactive({
  serviceHeiht: 300,
  countdown: 0, //抢红包倒计时
  isRedEnvelopeRain: false, //判断是否掉落红包雨
  timer: null, //定时器
  ws: null! as WebSocketBeanInter,
  userInfo: {} as any,
  redpacketList: [] as any[],
  animationData: {} as any,
  clickRedIndex: null as any,
  redRainList: [] as any[],
  redAmount: '' as any, //抢到红包金额
  coinMark: '' as any,
  redInfo: {} as any,
  defaultCoin: {} as any, //接口返回默认币种钱包

  /**
   * 0:活动未开始
   * 1:准备抢红包
   * 2:红包已抢完
   * 3:今日红包已抢过
   */
  activityProgress: 0,

  //获取红包雨列表
  getList() {
    let obj = Cookie.get('redEnvelopeInfo')

    if (!obj?.redpacketList?.length) {
      System.router.replace('/')
      return
    }

    conf.redpacketList = obj.redpacketList.filter((item: any) => item.states == 0)

    if (!obj.redpacketList.length) {
      conf.activityProgress = 3
      return
    }

    //红包活动开始 -- 未玩
    conf.redInfo = conf.redpacketList[0] || {}
    conf.checkOpenSocket()
  },

  //建立websocket连接
  checkOpenSocket() {
    System.loading()
    conf.ws = new WebSocketBean({
      url: `ws://192.168.31.50/api/mini/games/${sconfig.userInfo.token}/RedPacketRain`,
      onopen() {
        console.log('连接成功')
        System.loading(false)
        conf.activityProgress = 1
        return new Promise((resolve) => {
          resolve(true)
        })
      },
      onerror() {
        System.loading(false)
        conf.activityProgress = 0
      },
      binaryType: 'arraybuffer'
    })
    conf.ws.start()
  },

  clickRedPacket(item: any, index: any, arr: any) {
    let obj = {
      miniGame: conf.redInfo.id || '',
      uid: conf.userInfo.uid || '',
      userId: conf.userInfo.userId || '',
      contentType: 'MINI_GAME',
      content: {
        gameName: 'redPacketRain',
        operateType: 'GAME_INFO',
        data: {
          rainId: conf.redInfo.id || '',
          uid: conf.userInfo.uid || '',
          userId: conf.userInfo.userId || '',
          type: 'click'
        }
      }
    }
    conf.ws.send(obj)
  },

  //btns
  handleBtns(type: any) {
    conf.isRedEnvelopeRain = true
  }
})

const init = async () => {
  conf.userInfo = sconfig.userInfo
  conf.getList()
  // conf.getWalletMoney(1)
  // await svalue.getCoinlist()
  // conf.defaultCoin = svalue.coinlist.find((item) => item.isDefault)
}

onMounted(() => {
  init()
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
