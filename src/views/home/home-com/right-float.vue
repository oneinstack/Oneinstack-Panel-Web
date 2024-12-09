<template>
  <div class="right-fixed">
    <div class="fiexd-list">
      <!-- 红包 -->
      <div
        class="fixed-item"
        :class="{ 'hide': conf.isScroll }"
        @click="conf.handleClickRedEnvelopeImg"
        v-if="svalue.showRedBag"
      >
        <div class="redImg">
          <x-img src="/static/img/redEnvelope/home-red.gif"></x-img>
        </div>
        <div class="name" v-if="conf.showTitle.Redpayout">{{ $t('home.RedEnvelopeRain') }}</div>
        <div class="close-img">
          <x-img src="/static/img/download-close.png" @click.stop="svalue.showRedBag = false"></x-img>
        </div>
      </div>
      <!-- 聊天室 -->
      <div
        class="fixed-item"
        :class="{ 'hide': conf.isScroll }"
        style="transition-delay: 0.2s"
        v-if="sconfig.userInfo && svalue.configv1['im_open']"
        @click="conf.toChat()"
      >
        <x-img src="/static/images/wx.png"></x-img>
      </div>
      <!-- 客服 -->
      <div
        class="fixed-item"
        :class="{ 'hide': conf.isScroll }"
        style="transition-delay: 0.4s"
        @click="conf.handleClickServiceImg()"
        v-if="svalue.showServer"
      >
        <x-img src="/static/img/service.png"></x-img>
        <div class="name" v-if="conf.showTitle.Servicing">{{ $t('home.Servicing') }}</div>
        <div class="close-img">
          <x-img src="/static/img/download-close.png" @click.stop="svalue.showServer = false"></x-img>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { apis } from '@/api'
import { EPage } from '@/enum/Enum'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import { svalue } from '@/sstore/svalue'
import sweb from '@/sstore/sweb'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

const event = Scope.Event()
const timer = Scope.Timer()

const conf = reactive({
  isScroll: false,
  redpacketList: [],
  showTitle: {
    Redpayout: false,
    Chatroom: false,
    Servicing: false
  },
  //红包雨img => click => 获取红包雨列表
  async handleClickRedEnvelopeImg() {
    System.loading()
    const res = await apis.getPacketRainList({
      final(status, config, xhr) {
        System.loading(false)
      }
    })
    conf.redpacketList = res.data || []

    if (conf.redpacketList.length) {
      Cookie.set('redEnvelopeInfo', {
        redpacketList: conf.redpacketList
      })
      System.router.push('/user/redEnvelope/index')
    } else {
      System.toast(i18n.t('redEnvelopeModule.notStarted'))
    }
  },
  async toChat() {
    System.router.push(`/chat`)
    // sconfig.toChat()
  },
  // 客服
  async handleClickServiceImg() {
    let currentLan = await svalue.currentLanguage()
    const res = await apis.getCustomerUrl({
      userCountry: sconfig.userInfo?.userCountry || currentLan.areaCode
    })

    if (res.data.url.indexOf('http') != -1) {
      sweb.open(res.data.url)
    } else if (res.data.states == 'true') {
      System.router.push('/user/service/service')
    }
  }
})

onMounted(() => {
  event.on(EPage.scroll, () => {
    timer.clear()
    conf.isScroll = true
    timer.once(() => {
      conf.isScroll = false
    }, 1000)
  })
})
</script>
<style lang="less" scoped>
.right-fixed {
  position: fixed;
  bottom: 0rem;
  width: 100%;
  z-index: 99;
  max-width: 500px;
  .fiexd-list {
    position: absolute;
    right: 24rem;
    bottom: 280rem;
    .fixed-item {
      position: relative;
      width: 110rem;
      height: 110rem;
      // background: rgba(0, 0, 0, 0.4);
      margin-bottom: 20rem;
      border-radius: 60rem;
      transition: transform 0.3s;

      &.hide {
        transform: translateX(75%);
      }

      .r-img {
        width: 100%;
        height: 100%;
      }

      .redImg {
        border-radius: 50%;
        background: #00000008;
      }

      .close-img {
        position: absolute;
        top: -5rem;
        right: -19rem;
        width: 35rem;
        height: 35rem;
        background: rgba(0, 0, 0, 0.08);
        border-radius: 50%;
      }
    }
  }
}
</style>
