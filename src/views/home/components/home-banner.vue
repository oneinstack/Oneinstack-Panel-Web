<script setup>
import { ref } from 'vue'
import ArrowdownIcon from '@/components/arrowdown-icon.vue'
import { Scope } from 'tools-vue3'
import { Swiper, SwiperSlide, useSwiper } from 'swiper/vue'
import 'swiper/css'

const mconf = Scope.getConf()

const currentIndex = ref(0)
const onSlideChange = (swiper) => {
  currentIndex.value = swiper.activeIndex
}
</script>

<template>
  <div class="home-banner-container">
    <swiper loop @slideChange="onSlideChange">
      <swiper-slide>
        <video autoplay muted loop playsinline src="/media/banner.mp4">
          <source src="/media/banner.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </swiper-slide>
      <swiper-slide v-for="banner in mconf.banners" :key="banner.id" style="min-height: 100vh">
        <img :src="banner.imgUrl" alt="" />
      </swiper-slide>
    </swiper>
    <div class="swiper-pagination">
      <div class="swiper-pagination-bullet" :class="{ active: currentIndex === 0 }">
        <img src="/images/BG.png" class="img-fluid" alt="" />
      </div>
      <div
        v-for="(banner, index) in mconf.banners"
        :key="banner.id"
        class="swiper-pagination-bullet"
        :class="{ active: currentIndex === index }"
      >
        <img :src="banner.iconUrl" class="img-fluid" alt="" />
      </div>
    </div>
    <arrowdown-icon />
  </div>
</template>

<style scoped lang="scss">
.home-banner-container {
  position: relative;

  video,
  img {
    width: 100%;
    height: 100%;
    object-fit: fill;
  }

  .arrowdown-icon {
    z-index: 1;
    position: absolute;
    right: 6%;
    bottom: 46px;
  }

  .swiper-pagination {
    bottom: 32px;
    width: auto;
    white-space: nowrap;
    padding: 12px 4px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    left: 50%;
    transform: translate(-50%);
    position: absolute;
    text-align: center;
    transition: 0.3s opacity;
    z-index: 10;

    &-bullet {
      filter: grayscale(1);
      width: 48px;
      height: 48px;
      margin: 0 16px;
      cursor: pointer;
      display: inline-block;
      position: relative;

      &.active {
        filter: grayscale(0);
      }

      .img-fluid {
        position: absolute;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
        max-width: 100%;
        height: auto;
        vertical-align: middle;
      }
    }
  }
}
</style>
