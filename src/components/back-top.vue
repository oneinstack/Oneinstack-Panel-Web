<script setup>
import { onMounted, ref } from 'vue'

const show = ref(false)
const handleBackTop = () => {
  document.body.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  document.body.addEventListener('scrollend', () => {
    if (document.body.scrollTop > 200) show.value = true
    else show.value = false
  })
})
</script>

<template>
  <transition name="fade">
    <div v-show="show" class="back-top-container" @click="handleBackTop">
      <svg
        data-v-c932e949=""
        class="svg-inline--fa fa-arrow-up"
        aria-hidden="true"
        focusable="false"
        data-prefix="fas"
        data-icon="arrow-up"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 384 512"
      >
        <path
          class=""
          fill="currentColor"
          d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"
        ></path>
      </svg>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.back-top-container {
  display: inline-block;
  width: 56px;
  height: 56px;
  color: #fff;
  position: fixed;
  right: 40px;
  bottom: 20px;
  left: auto;
  cursor: pointer;
  z-index: 1030;
  transition: 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.48);
  border-radius: 50%;
  user-select: none;
  display: grid;
  place-items: center;

  .svg-inline--fa {
    box-sizing: content-box;
    display: inline-block;
    height: 1em;
    overflow: visible;
    vertical-align: -0.125em;
  }
}

@media screen and (max-width: 768px) {
  .back-top-container {
    right: 20px;
  }
}
</style>
