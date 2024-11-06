<script setup>
defineProps({
  type: {
    type: String,
    default: 'default',
  },
  bg: {
    type: String,
  },
  borderColor: {
    type: String,
  },
})
</script>

<template>
  <button class="base-button" :class="[type]" :style="{ background: bg }">
    <span>
      <slot />
    </span>
  </button>
</template>

<style scoped lang="scss">
.base-button {
  display: inline-block;
  padding: 16px 58px;
  font-size: 1.2rem;
  position: relative;
  border: none;
  outline: none;
  transition: all ease-in-out 0.3s;
  border-radius: var(--bs-btn-border-radius);
  cursor: pointer;
  color: #fff;
  font-weight: 700;

  &.default {
    background-color: transparent;
    border: 1px solid rgba(255, 255, 255, 0.48);
    transition: all ease-in-out 0.3s;

    &:hover {
      background-color: #ffffff7a;
    }
  }

  &.primary {
    // background:
    //   linear-gradient(#1f1f1d 0 0) padding-box,
    //   linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%) border-box;
    background: linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%);

    span {
      position: relative;
      z-index: 2;
    }

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background:
        linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%) padding-box,
        linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%) border-box;
      border-radius: var(--bs-btn-border-radius);
      opacity: 0;
      transition: all ease-in-out 0.3s;
    }

    &:hover {
      box-shadow: 0 0 16px #ff8708;
      &::after {
        opacity: 1;
      }
    }
  }
}
</style>
