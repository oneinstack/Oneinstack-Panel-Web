<template>
  <x-page noHeader noFooter>
    <x-statusbar />
    <Navbar title="传输设置"></Navbar>
    <div class="content">
      <p class="title">传输设置</p>
      <div class="card" @click="picker1 = true">
        <p class="label">同时传输文件数：</p>
        <div class="right">
          <span>{{ text1 }}</span>
          <van-icon class="icon" name="arrow" />
        </div>
      </div>
      <div class="card" @click="picker2 = true">
        <p class="label">传输网络设置：</p>
        <div class="right">
          <span>{{ text2 }}</span>
          <van-icon class="icon" name="arrow" />
        </div>
      </div>
    </div>
    <van-popup v-model:show="picker1" destroy-on-close round position="bottom">
      <van-picker :model-value="pickerValue1" :columns="columns1" @cancel="picker1 = false" @confirm="onConfirm1"/>
    </van-popup>
    <van-popup v-model:show="picker2" destroy-on-close round position="bottom">
      <van-picker :model-value="pickerValue2" :columns="columns2" @cancel="picker2 = false" @confirm="onConfirm2"/>
    </van-popup>
  </x-page>
</template>
<script setup lang="ts">
import { Numeric } from 'vant/lib/utils'
import { ref } from 'vue'

const picker1 = ref<boolean>(false)
const pickerValue1 = ref<Numeric[]>([1])
const text1 = ref()
const columns1 = [
  { text: 1, value: 1 },
  { text: 2, value: 2 },
  { text: 3, value: 3 },
  { text: 4, value: 4 },
  { text: 5, value: 5 }
]
const onConfirm1 = ({ selectedValues, selectedOptions }:any) => {
  picker1.value = false
  pickerValue1.value = selectedValues
  text1.value = selectedOptions[0].text;
}

const picker2 = ref<boolean>(false)
const pickerValue2 = ref<Numeric[]>([])
const text2 = ref()
const columns2 = [
  { text: '仅wifi环境上传/下载', value: 1 },
  { text: '仅流量环境上传/下载', value: 2 },
  { text: '均可下载', value: 3 }
]
const onConfirm2 = ({ selectedValues, selectedOptions }:any) => {
  picker2.value = false
  pickerValue2.value = selectedValues
  text2.value = selectedOptions[0].text;
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
