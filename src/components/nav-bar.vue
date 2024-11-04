<script setup>
defineProps({
  bg: {
    type: String,
    default: '#080807',
  },
})
</script>

<template>
  <div class="nav-bar-container">
    <div class="left">
      <slot name="left" />
    </div>
    <div class="center">
      <slot name="center" />
    </div>
    <div class="right">
      <slot name="center" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.nav-bar-container {
  padding: 20px 0;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 99;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: var(--nav-heaght);
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.48) 0%,
    rgba(0, 0, 0, 0) 100%
  );
}
</style>
