<script setup>
import { Scope } from 'tools-vue3'

const conf = Scope.getConf()
</script>

<template>
  <div class="game-list-container">
    <div class="container">
      <div class="game-list-info">
        <h4 class="game-list-title">{{ conf.currentActive.name }}</h4>
        <div class="game-list-count">{{ conf.currentActive.number }}</div>
      </div>
      <div class="row">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.game-list-container {
  position: relative;
  padding: 80px 0;

  .container {
    max-width: 1320px;
    position: relative;
    z-index: 1;

    .game-list-info {
      margin: 0 0 64px;
      display: flex;
      align-items: center;

      .game-list-title {
        font-size: 40px;
        margin-top: 0;
        margin-bottom: 0;
        margin-right: 1.5rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .game-list-count {
        background: rgba(255, 255, 255, 0.2);
        padding: 8px 16px;
        font-size: 24px;
        border-radius: 9999px;
        font-weight: 700;
      }
    }
  }
}
</style>
