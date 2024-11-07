<script setup>
import BaseModal from '@/components/base-modal.vue'

defineProps({
  gameLink: String
})

const show = defineModel({
  default: false,
  get: (value) => {
    return value
  }
})

const handleClickOverlay = () => {}
</script>

<template>
  <base-modal v-model="show" :overlayClose="false">
    <div class="close-btn" @click="show = false">
      <svg
        data-v-7f111901=""
        class="svg-inline--fa fa-xmark fa-2x"
        aria-hidden="true"
        focusable="false"
        data-prefix="fas"
        data-icon="xmark"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 384 512"
      >
        <path
          class=""
          fill="currentColor"
          d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
        ></path>
      </svg>
    </div>
    <div class="game-modal-content">
      <iframe :src="gameLink" frameborder="0"></iframe>
    </div>
  </base-modal>
</template>

<style scoped lang="scss">
.game-modal-content {
  width: 1320px;
  padding: 16px;

  iframe {
    width: 100%;
    height: 89vh;
    border: 0;
  }
}

.close-btn {
  position: absolute;
  right: -24px;
  top: -24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid #fff;
  background-color: #ffffff3d;
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  cursor: pointer;

  svg {
    font-size: 2em;
    display: inline-block;
    height: 1em;
    vertical-align: -0.125em;
  }
}

:global(.modal-body) {
  width: auto !important;
}
</style>
