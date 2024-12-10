<template>
  <div class="bet_record_filter_item">
    <van-button class="filter_button" size="small" color="#ededed" plain round @click="emit('change-active')">
      <img
        class="filter_button_icon"
        :class="{ active: isActive }"
        style="width: 6px; height: 10px"
        src="/static/images/common_left_arrow.png"
        alt=""
        srcset=""
      />
      <span class="filter_button_text">{{ text }}</span>
    </van-button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  text: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: false
    }
})
const emit = defineEmits(['change-active'])
</script>

<style lang="less" scoped>
.bet_record_filter_item {
  width: 100%;
}

.filter_button {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000 !important;
  background-color: #ededed;
  font-size: 24rem;
  border-radius: 40rem;
  width: 100%;

  .filter_button_icon {
    transform: rotate(-90deg);

    &.active {
      transform: rotate(90deg);
    }
  }

  .filter_button_text {
    margin-left: 16rem;
  }
}
</style>
