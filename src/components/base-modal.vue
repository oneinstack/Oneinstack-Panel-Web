<script setup>
const props = defineProps({
  title: String,
  header: Boolean,
  footer: Boolean,
  overlayClose: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click-overlay'])

const show = defineModel({
  default: false,
  get: (value) => {
    document.body.style.overflow = value ? 'hidden' : 'auto'
    return value
  }
})

const handleClickOverlay = () => {
  emit('click-overlay')
  if (props.overlayClose) show.value = false
}
</script>

<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="show" class="base-modal-container">
        <div class="modal-content">
          <div v-if="header" class="modal-header">
            <h2>{{ title }}</h2>
            <button @click="closemodal">Close</button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div v-if="footer" class="modal-footer">
            <slot name="footer">
              <button @click="closeModal">Cancel</button>
              <button @click="confirm">Confirm</button>
            </slot>
          </div>
        </div>
        <div v-if="show" class="overlay" @click="handleClickOverlay"></div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped lang="scss">
.base-modal-container {
  width: 100%;
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 999;

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    will-change: backdrop-filter;
    z-index: 1000;
  }

  .modal-body {
    width: 800px;
    box-shadow:
      0 0 2px #ffffff3d,
      0 0 16px #0000007a;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    pointer-events: auto;
    background-color: var(--bs-body-bg);
    border-radius: 0.5rem;
    z-index: 1001;
  }
}
</style>
