<script setup></script>

<template>
  <div class="arrowdown-icon">
    <img src="/svg/arrow-down.svg" class="arrowdown-icon-img" alt="" />
  </div>
</template>

<style scoped lang="scss">
.arrowdown-icon {
  width: 38px;
  height: 60px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.48);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 99rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &-img {
    width: 13px;
    height: 32px;
  }
}
</style>
