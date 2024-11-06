<script setup>
import HomeBanner from './components/home-banner.vue'
import NewGames from './components/new-games.vue'
import TypeGames from './components/type-games.vue'
</script>

<template>
  <div class="base-home-container">
    <home-banner />
    <new-games />
    <type-games />
  </div>
</template>

<style scoped lang="scss">
.base-home-container {
}
</style>
