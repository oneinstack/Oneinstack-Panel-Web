<template>
  <x-page noHeader noFooter>
    <x-statusbar />
    <Navbar :title="t('file.transferSetting')"></Navbar>
    <div class="content">
      <p class="title">{{ $t("file.transferSetting") }}</p>
      <div class="card" @click="transferNumPicker = true">
        <p class="label">{{ $t("file.transferNum") }}：</p>
        <div class="right">
          <span>{{ transferNumText }}</span>
          <van-icon class="icon" name="arrow" />
        </div>
      </div>
      <div class="card" @click="transferNetwordPicker = true">
        <p class="label">{{ $t("file.transferNetword") }}：</p>
        <div class="right">
          <span>{{ transferNetwordText }}</span>
          <van-icon class="icon" name="arrow" />
        </div>
      </div>
    </div>
    <van-popup v-model:show="transferNumPicker" destroy-on-close round position="bottom">
      <van-picker :model-value="transferNum" :columns="transferNumList" @cancel="transferNumPicker = false" @confirm="onTransferNumConfirm"/>
    </van-popup>
    <van-popup v-model:show="transferNetwordPicker" destroy-on-close round position="bottom">
      <van-picker :model-value="transferNetword" :columns="transferNetwordList" @cancel="transferNetwordPicker = false" @confirm="onConfirm2"/>
    </van-popup>
  </x-page>
</template>
<script setup lang="ts">
import { Numeric } from 'vant/lib/utils'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const transferNumList = [
  { text: 1, value: 1 },
  { text: 2, value: 2 },
  { text: 3, value: 3 },
  { text: 4, value: 4 },
  { text: 5, value: 5 }
]
const transferNumPicker = ref<boolean>(false)
const transferNum = ref<Numeric[]>([1]) // 传输数量
const transferNumText = computed(() => {
  const text = transferNumList.find((item:any) => item.value === transferNum.value[0])
  return text?.text || transferNumList[0]?.text
})
const onTransferNumConfirm = ({ selectedValues, selectedOptions }:any) => {
  transferNumPicker.value = false
  transferNum.value = selectedValues
}

const transferNetwordList = [
  { text: t("file.onlyWifi"), value: 1 },
  { text: t("file.onlyMobile"), value: 2 },
  { text: t("file.noLimit"), value: 3 }
]
const transferNetwordPicker = ref<boolean>(false)
const transferNetword = ref<Numeric[]>([1]) // 传输网络
const transferNetwordText = computed(() => {
  const text = transferNetwordList.find((item:any) => item.value === transferNetword.value[0])
  return text?.text || ''
})
const onConfirm2 = ({ selectedValues, selectedOptions }:any) => {
  transferNetwordPicker.value = false
  transferNetword.value = selectedValues
}
</script>
<style lang="less" scoped>
.content {
  height: 100%;
  padding: 32rem;
  .title {
    font-size: 28rem;
    color: #9c9c9c;
    margin-top: 32rem;
  }
  .card {
    padding: 32rem;
    background: #ffffff;
    height: 104rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .label {
      font-size: 28rem;
      color: #9c9c9c;
    }
    .right {
      span {
        font-size: 28rem;
      }
      .icon {
        margin-left: 24rem;
        font-size: 28rem;
        color: #50555c;
      }
    }
  }
  .card:nth-of-type(1) {
    margin-top: 32rem;
  }
}
</style>
