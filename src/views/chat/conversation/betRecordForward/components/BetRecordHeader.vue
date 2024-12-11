<template>
  <div class="right_action">
    <van-button v-if="selectTotal > 0 && !isSingleSelection" size="small" @click="emit('click-send')">{{
      $t('chatRoom.send') }}({{ selectTotal }})</van-button>
    <span v-else size="small" @click="emit('change-select-mode', !isSingleSelection)">{{ actionText }}</span>
  </div>
</template>

<script setup lang="ts">
import i18n from '@/lang';
import { computed } from 'vue';

const props = defineProps({
  isSingleSelection: {
    default: true
  },
  selectTotal: {
    default: 0
  }
})
const emit = defineEmits(['click-send','change-select-mode'])
const actionText = computed(() => {
  return props.isSingleSelection ? i18n.t('chatRoom.selectAny') : i18n.t('chatRoom.selecOne')
})
</script>

<style lang="less" scoped>
span {
  font-size: 28rem;
  color: #333;
  margin-right: 20rem;
  font-weight: 500;
}

.right_action>button {
  background: #0fc05f;
  color: #fff;
  font-size: 24rem;
  border-radius: 4rem;
}
</style>
