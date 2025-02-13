<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  bg: {
    type: String,
    default: '#080807'
  }
})

const show = ref(true)
const handleToggleShow = () => {
  show.value = !(document.body.scrollTop > 0)
}

onMounted(() => document.body.addEventListener('scroll', handleToggleShow))

onBeforeUnmount(() => document.body.removeEventListener('scroll', handleToggleShow))
</script>

<template>
  <transition name="slide-bottom">
    <div v-show="show" class="nav-bar-container">
      <div class="left">
        <slot name="left" />
      </div>
      <div class="center">
        <slot name="center" />
      </div>
      <div class="right">
        <slot name="right" />
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.nav-bar-container {
  padding: 20px 300px;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 99;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: var(--nav-heaght);
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.48) 0%, rgba(0, 0, 0, 0) 100%);
}

@media screen and (max-width: 768px) {
  .nav-bar-container {
    background: #080807;
    padding: 0 5%;
  }
}
</style>
