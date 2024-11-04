<script setup></script>

<template>
  <div class="home-banner-container">
    <video autoplay loop playsinline src="/media/banner.mp4">
      <source src="/media/banner.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  </div>
</template>

<style scoped lang="scss">
.home-banner-container {
  video {
    width: 100%;
    height: 100%;
    object-fit: fill;
  }
}
</style>
