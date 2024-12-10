<template>
  <x-page headerBgColor="#fff" :showBack="false">
    <template #title>
      <div class="head-search">
        <van-icon name="arrow-left" size="34rem" color="#666666" @click="sutil.pageBack" />
        <input ref="inputRef" class="input" placeholder="Search for friends/keywords" />
        <div class="btn flex flex-center">Search</div>
      </div>
    </template>
  </x-page>
</template>
<script setup lang="ts">
import sutil from '@/sstore/sutil';
import { nextTick, onMounted, reactive, ref } from 'vue'

const inputRef = ref<any>()
const conf = reactive({

})

onMounted(() => {
  console.log(inputRef.value);

  // 如果是移动端，可能还需要触发输入法打开
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value.setSelectionRange(0, 0); // 如果需要将光标置于输入框开始位置

    // 调用原生软键盘
    if (window.cordova && window.cordova.plugins.Keyboard) {
      window.cordova.plugins.Keyboard.show();
    }

  })
});
</script>
<style lang="less" scoped>
.head-search {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0 24rem 0 20rem;
  height: 60rem;

  .input {
    height: 100%;
    flex: 1;
    font-size: 24rem;
    border: 2rem solid #f1f1f1;
    padding: 0 20rem;
    margin-left: 10rem;
    border-radius: 5rem 0rem 0rem 5rem;
    color: #000000;
  }

  .input::placeholder {
    color: #808080;
  }

  .btn {
    background: #07c261;
    height: 100%;
    padding: 0 20rem;
    font-size: 24rem;
    border-radius: 0 5rem 5rem 0;
  }
}
</style>
