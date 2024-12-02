<template>
  <van-popup
    class="popup-bottom-center"
    :show="show"
    position="bottom"
    borderRadius="16"
    :round="true"
    @close="conf.closePopup"
  >
    <div class="btn-view">
      <div class="left-btn" @click="conf.closePopup">{{ $t('agencyCenterModule.cancellation') }}</div>
      <div class="right-btn" @click="conf.handleConfirm">{{ $t('agencyCenterModule.determine') }}</div>
    </div>
    <van-date-picker
      v-model="conf.currentDate"
      title=""
      :cancel-button-text="$t('agencyCenterModule.cancellation')"
      :confirm-button-text="$t('agencyCenterModule.determine')"
      :min-date="conf.minDate"
      :max-date="conf.maxDate"
      :columns-type="conf.columnsType"
      :show-toolbar="false"
      :visible-option-num="5"
    />
  </van-popup>
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  selectDate: {
    type: Array,
    default: []
  }
})

watch(
  () => props.selectDate,
  (newVal) => {
    conf.currentDate = newVal
  }
)

const emit = defineEmits(['update:show', 'confirm', 'update:selectDate'])
const minDate = new Date()
minDate.setFullYear(minDate.getFullYear() - 5)
const conf = reactive({
  currentDate: props.selectDate as any,
  minDate: minDate,
  maxDate: new Date(),
  columnsType: ['year', 'month'] as any[],
  closePopup: () => {
    emit('update:show', false)
    conf.currentDate = props.selectDate
  },
  handleConfirm: () => {
    emit('update:show', false)
    emit('confirm', conf.currentDate)
    emit('update:selectDate', conf.currentDate)
  }
})
</script>

<style lang="less" scoped>
.btn-view {
  height: 98rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  font-size: 36rem;
  font-weight: 600;
  background: #fff;

  .left-btn {
    color: #a8a8a8;
  }

  .right-btn {
    background: linear-gradient(#eb602d, #ffa64f);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
</style>
