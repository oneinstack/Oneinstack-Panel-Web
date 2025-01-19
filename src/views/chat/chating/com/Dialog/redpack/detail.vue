<template>
  <div>
    <div v-if="conf.show" class="redpack-detail-pop" :style="{ zIndex: conf.item.zIndex }">
      <div class="content-box boom-once">
        <img class="close" src="/static/images/icon_close.svg" @click="conf.close" />
        <div class="content-box1">
          <div class="content-bg1"></div>
          <div class="content-bg2"></div>
          <div class="content-btn" :class="[conf.loading ? 'rotateY' : '']" v-if="conf.status === 35">
            <div class="content-btn-bg" @click="conf.receiveRedPack"></div>
            <div class="content-btn-text" @click="conf.receiveRedPack"
              :style="{ fontSize: $t('chatRoom.Open').length > 1 ? '46rem' : '60rem' }">{{ $t('chatRoom.Open') }}</div>
          </div>
          <div class="content-look column items-center fit-width" @click="conf.toRedPackList"
            v-if="(conf.isGroup && conf.isSelf) || conf.status === 30">{{ conf.status === 30 ? $t('chatRoom.view_receipt') :
              $t('chatRoom.see_luck') }} ></div>
          <div class="content-desc column items-center fit-width">
            <div class="column items-center" style="padding: 0px 30rem">
              <div class="row flex-center" style="gap: 15rem">
                <img :src="conf.getFace(conf.item.data.senderFaceUrl)" />
                <div>{{ conf.item.data.senderNickname }} {{ $t('chatRoom.rpkt_info') }}</div>
              </div>
              <div style="font-size: 34rem; font-weight: bold" v-if="conf.status === 30">{{ $t('chatRoom.rpkt_exceeded') }}
              </div>
              <div style="font-size: 40rem; font-weight: bold;text-align: center;" v-else>
                {{ conf.status === 35 ? conf.item.data.data : RedPackReceiveCode[conf.item.data.status]() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RedPackReceiveCode, sim } from '@/sstore/sim'
import { DialogName, simdl } from '@/sstore/simdl'
import Config from '@/utils/Config'
import { Scope } from 'tools-vue3';
import { onMounted, reactive } from 'vue';

const timer = Scope.Timer()

const conf = reactive({
  show: true,
  RedPackReceiveCode,
  item: {} as any,
  loading: false,
  isSelf: false,
  status: 0,
  isGroup: false,
  async receiveRedPack() {
    if (conf.loading) return
    conf.loading = true
    const res = await sim.receiveRedPack(conf.item.data)
    if (!res) {
      timer.once(() => {
        conf.toRedPackList()
      }, 500)
    } else {
      conf.toRedPackList()
    }
  },
  close() {
    simdl.close(DialogName.RedPackDetail)
  },
  toRedPackList() {
    sim.toRedPackList(conf.item, conf.close)
  },
  getFace(url:any) {
    if (url.startsWith('http')) return url
    return '/static/img/headimg/' + url
  }
})
onMounted(() => {
  conf.item = simdl.getItem(DialogName.RedPackDetail)
  console.log('conf.item.data', conf.item.data)
  conf.status = conf.item.data.status
  const selfInfo = sim.getSelfInfo()
  conf.isGroup = sim.isGroup()
  conf.isSelf = selfInfo.userID === conf.item.data.sendUserId

  //判断是不是过期
  if (Date.now() - conf.item.data.sendTime > 24 * 60 * 60 * 1000) {
    conf.status = 30
    sim.setRedPacketStatus(conf.item.data.id, 30)
  }

  if (conf.status == 30) {
  } else if ((selfInfo.userID === conf.item.data.sendUserId && !conf.isGroup) || conf.status !== 35) {
    conf.show = false
    conf.toRedPackList()
  }
})
</script>

<style lang="less" scoped>
.redpack-detail-pop {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  left: 0;
  top: 0;
  height: 100vh;
  width: 100vw;
  background-color: #ffffff9e;

  .content-box {
    position: relative;
    width: 504rem;
    height: 835rem;

    .close {
      position: absolute;
      bottom: -150rem;
      left: 50%;
      transform: translateX(-50%);
      width: 50rem;
      height: 50rem;
    }
  }

  .content-box1 {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    border-radius: 20rem;
    background: #f35f4d;
    overflow: hidden;

    .content-bg1 {
      position: absolute;
      bottom: 0rem;
      height: 300rem;
      width: 100%;
      background-color: #f25642;
      z-index: 1;
      pointer-events: none;
    }

    .content-bg2 {
      position: absolute;
      top: calc(-50% + 90rem);
      left: -50%;
      height: 1000rem;
      width: 200%;
      background-color: #f35f4d;
      box-shadow: 0px 2px 9px 0px #00000038;
      border-radius: 50%;
      z-index: 2;
      pointer-events: none;
    }

    .content-btn {
      position: absolute;
      bottom: 170rem;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 3;

      .content-btn-bg {
        position: absolute;
        width: 150rem;
        height: 150rem;
        background-color: #ead0a0;
        border-radius: 50%;
        z-index: 1;
        box-shadow: 0px 0px 9px 0px #00000038;
      }

      .content-btn-text {
        position: absolute;
        z-index: 2;
        color: #4d4a43;
        font-weight: bold;
      }
    }

    .content-look {
      position: absolute;
      z-index: 4;
      color: #fde2b2;
      bottom: 30rem;
      font-size: 21rem;
      padding: 10rem 0rem;
    }

    .content-desc {
      position: absolute;
      z-index: 2;
      color: #fde2b2;
      top: 200rem;
      gap: 30rem;

      img {
        width: 54rem;
        height: 54rem;
        border-radius: 10rem;
      }
    }
  }
}
</style>
