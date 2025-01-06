<template>
  <x-page :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>
      {{ $t('tabble.invite') }}
    </template>
    <div class="container" id="container">
      <swiper
        ref="swiperInstance"
        :effect="'coverflow'"
        :centeredSlides="true"
        :slidesPerView="'auto'"
        :loop="true"
        :modules="[EffectCoverflow]"
        @swiper="conf.onSwiper"
      >
        <template v-for="(l, index) in 2">
          <swiper-slide>
            <div :id="'card' + 2 * index" class="swiper_item">
              <img src="/static/img/swiperImage1.png" class="swiper_imge" />
              <span class="website">{{ conf.hrefUrl }}</span>
              <div class="qrdowndir">
                <div class="qrcode-icon">
                  <qrcode-vue :value="conf.qrcode" :size="conf.size" />
                </div>
              </div>
            </div>
          </swiper-slide>
          <swiper-slide>
            <div :id="'card' + (2 * index + 1)" class="swiper_item">
              <img src="/static/img/swiperImage2.png" class="swiper_imge" />
              <span class="website">{{ conf.hrefUrl }}</span>
              <div class="qrdowndir">
                <div class="qrcode-icon">
                  <qrcode-vue :value="conf.qrcode" :size="conf.size" />
                </div>
              </div>
            </div>
          </swiper-slide>
        </template>
      </swiper>
    </div>
    <div class="btn-view" @click="conf.exportCardAsImage">
      <div>{{ $t('invite.InvitationLink') }}</div>
    </div>
    <div class="btn-view2" @click="conf.handleCopyLink">
      <div>{{ $t('invite.CopyInvitationLink') }}</div>
    </div>
    <div class="bottom-code"></div>
  </x-page>
</template>
<script lang="ts" setup>
import QrcodeVue from 'qrcode.vue'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import { EffectCoverflow } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { ref } from 'vue'
import { index } from './toImg'
import stheme from '@/sstore/stheme'

const swiperInstance = ref(null as any)
const conf = index({ swiperInstance })
</script>

<style lang="less" scoped>
.container {
  position: relative;
}

.swiper {
  width: 100%;
  padding-top: 60rem;
  padding-bottom: 60rem;
}

.swiper-slide {
  background-position: center;
  background-size: cover;
  width: 560rem;
  height: 1000rem;
  border-radius: 40rem;
  overflow: hidden;
}

.swiper_box {
  margin-top: 30rem;
}

.swiper_item {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 40rem;
  width: 560rem;
  min-width: 560rem;
  height: 1000rem;
  overflow: hidden;
  position: relative;
}

.swiper_imge {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #ffffff;
}

.qrdowndir {
  padding: 20rem;
  background: #fff;
  -webkit-transform: scale(0.9);
  transform: scale(0.9);
  // border-radius: 20rem;
  width: 256rem;
  position: absolute;
  bottom: 15rem;
  // margin-left: calc(50% - 60px - 20rem);
}

.website {
  position: absolute;
  top: 15rem;
  font-size: 32rem;
  color: #fff;
}

.btn-view {
  margin-top: 30rem;
  width: calc(100% - 60rem);
  background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
  border-radius: 82rem;
  text-align: center;
  color: #fff;
  font-weight: 500;
  font-size: 40rem;
  height: 100rem;
  line-height: 100rem;
  margin-left: 30rem;
}

.btn-view2 {
  margin-top: 30rem;
  width: calc(100% - 60rem);
  background: #fff;
  border-radius: 82rem;
  text-align: center;
  color: #006fff;
  font-weight: 500;
  font-size: 40rem;
  height: 100rem;
  line-height: 100rem;
  margin-left: 30rem;
  border: 2rem solid #006fff;
}

.bottom-code {
  position: absolute;
  top: -100vh;
}
</style>
