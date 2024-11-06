<script setup>
import ArrowdownIcon from '@/components/arrowdown-icon.vue'
</script>

<template>
  <div class="home-banner-container">
    <video autoplay muted loop playsinline src="/media/banner.mp4">
      <source src="/media/banner.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
    <arrowdown-icon />
  </div>
</template>

<style scoped lang="scss">
.home-banner-container {
  position: relative;

  video {
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
}
</style>
