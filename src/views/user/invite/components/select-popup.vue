<template>
  <div class="select-popup">
    <div class="label" :class="{ open }" @click="$emit('update:open', !open)">
      {{ currentSelected && currentSelected.label }}
    </div>
    <transition name="fade">
      <div class="popup-panel" v-if="open">
        <div
          v-for="option in options"
          :key="option.label"
          class="select-item"
          :class="{ selected: currentSelected === option }"
          @click="hanldeSelect(option)"
        >
          {{ option.label }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  model: {
    prop: 'open',
    event: 'update:open'
  },

  props: {
    options: {
      type: Array,
      default: () => []
    },
    currentSelected: {
      type: Object,
      default: () => ({})
    },
    open: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    hanldeSelect(option) {
      this.$emit('select', option)
    }
  }
}
</script>

<style scoped lang="less">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.select-popup {
  width: 100%;
  padding: 0 24rem;
  position: relative;
  font-family: PingFang SC;

  .label {
    display: flex;
    align-items: center;
    opacity: 0.8;
    font-size: 24rem;

    &::after {
      content: '';
      border-left: 12rem solid transparent;
      border-right: 12rem solid transparent;
      border-top: 12rem solid #fff;
      margin-left: 16rem;
      transition: transform 0.25s;
    }

    &.open {
      opacity: 1;

      &::after {
        content: '';
        transform: rotate(180deg);
      }
    }
  }

  .popup-panel {
    position: absolute;
    right: 24rem;
    width: 184rem;
    border-radius: 4rem;
    box-shadow: 0rem 0rem 20rem 0rem #00000026;
    background: #ffffff;
    top: 68rem;

    .select-item {
      padding: 12rem 0;
      margin: 4rem 0;
      width: 100%;
      color: #000000;
      text-align: center;
      font-size: 28rem;

      &.selected {
        background-color: #fff2e9;
      }
    }
  }
}
</style>
