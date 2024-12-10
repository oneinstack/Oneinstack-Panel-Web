<template>
  <div class="bet_record_header">
    <div class="header-left">
      <van-icon name="arrow-left" size="36rem" color="#666666" @click="sutil.pageBack" />
      <span class="u-nav-title">{{ $t('chatRoom.BettingRecord') }}</span>
    </div>
    <div class="right_action">
      <van-button v-if="selectNumber > 0" size="small" @click="conf.handleShare">{{ $t('chatRoom.Share') }}({{ selectNumber
        }})</van-button>
      <van-button v-else size="small" @click="conf.handleChangeMode">{{ actionText }}</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import i18n from '@/lang';
import sutil from '@/sstore/sutil';
import { computed, reactive } from 'vue';


const props = defineProps({
  selectNumber: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['change-select-mode','click-share'])

const conf = reactive({
  currentSelectMode: 'single',

  handleChangeMode() {
    conf.currentSelectMode = conf.currentSelectMode === 'single' ? 'multiple' : 'single'
    emit('change-select-mode', conf.currentSelectMode)
  },

  handleShare() {
    emit('click-share')
  }
})

const actionText = computed(() => {
  return conf.currentSelectMode === 'single' ? i18n.t('chatRoom.MultipleChoice') : i18n.t('chatRoom.SingleChoice')
})
</script>

<style lang="less" scoped>
.bet_record_header {
  width: 100%;
  padding: 0 24rem 0 20rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-left{
    display: flex;
    align-items: center;
  }
  .u-nav-title {
    font-size: 32rem;
    color: #333;
    margin-left: 16rem;
    font-weight: 500;
  }

  .right_action>button {
    background: #0fc05f;
    color: #fff;
    font-size: 24rem;
    border-radius: 4rem;
  }
}
</style>
