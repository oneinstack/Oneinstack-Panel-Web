<script setup>
import AboutDesc from './components/about-desc.vue'
import AboutGame from './components/about-game.vue'
import AboutMission from './components/about-mission.vue'
import AboutWhy from './components/about-why.vue'
</script>

<template>
  <div class="base-about-container">
    <about-desc />
    <about-game />
    <about-mission />
    <about-why />
  </div>
</template>

<style scoped lang="scss">
.base-about-container {
  font-size: 18px;
  --gradient-color: linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%);
}
</style>
