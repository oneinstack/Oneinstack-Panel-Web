<script setup>
import GameBanner from './components/game-banner.vue'
import GameList from './components/game-list.vue'
import GameCard from './components/game-card.vue'

const games = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: '海皇争霸龙凤传说',
  bg: '/images/cover-bg.jpg',
  logo: '/images/cover-game-log.png',
  link: '',
}))
</script>

<template>
  <div class="base-game-container">
    <game-banner />
    <game-list>
      <div class="game-list-box">
        <game-card v-for="game in games" :key="game.id" :data="game" />
      </div>
    </game-list>
  </div>
</template>

<style scoped lang="scss">
.base-game-container {
  padding-top: var(--nav-heaght);

  .game-list-box {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: auto;
    gap: 1.5em;
  }
}
</style>
