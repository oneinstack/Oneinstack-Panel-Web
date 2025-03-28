<template>
  <x-page no-header tabbar no-footer>
    <div class="memo-list-page">
      <x-statusbar />
      <van-nav-bar left-arrow title="备忘录" @click-left="router.back()"></van-nav-bar>
      <div class="content">
    <div class="column">
      <div class="card" v-for="(item, index) in leftList" :key="index">
        <van-text-ellipsis class="text" :content="item.title" />
        <van-text-ellipsis class="text" rows="3" :content="item.content" />
        <p class="date">{{ item.date }}</p>
      </div>
    </div>
    <div class="column">
      <div class="card" v-for="(item, index) in rightList" :key="index">
        <van-text-ellipsis class="text" :content="item.title" />
        <van-text-ellipsis class="text" rows="3" :content="item.content" />
        <p class="date">{{ item.date }}</p>
      </div>
    </div>
  </div>
      <div class="float-btn">
        <van-icon class="icon" name="plus" />
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router';
const router = useRouter();
const list = reactive([
  {
    title: '这是标题111111111111111',
    content: '这是内容222222222',
    date: '2024年12月11日'
  },
  {
    title: '这是标题11111111',
    content: '这是内容这是内容是大啊是的测试的这是内容这是内容是大啊是的测试的这是内容这是内容是大啊是的测试的',
    date: '2024年12月11日'
  },
  {
    title: '这是标题11111111',
    content: '这是内容这是内容是大啊是的',
    date: '2024年12月11日'
  },
  {
    title: '这是标题111111111111111',
    content: '这是内容222222222',
    date: '2024年12月11日'
  },
  {
    title: '这是标题11111111',
    content: '这是内容这是内容是大啊是的测试的这是内容这是内容是大啊是',
    date: '2024年12月11日'
  },
  {
    title: '这是标题11111111',
    content: '这是内容这是内容是大啊是多少发多少事的',
    date: '2024年12月11日'
  }
])
const leftList = computed(() => list.filter((_, index) => index % 2 === 0))
const rightList = computed(() => list.filter((_, index) => index % 2 === 1))
</script>
<style lang="less" scoped>
.memo-list-page {
  display: flex;
  flex-direction: column;
  .content {
  display: flex;
  padding: 16rem;
  gap: 16rem;
  
  .column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16rem;
  }
  
  .card {
    background: #ffffff;
    border-radius: 12rem;
    padding: 16rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    
    .text {
      font-size: 28rem;
      line-height: 1.5;
      color: #333333;
    }
    
    .date {
      margin-top: 16rem;
      font-size: 24rem;
      color: #999999;
    }
  }
}
}
.float-btn{
    position: fixed;
    right: 32rem;
    bottom: 144rem;
    width: 100rem;
    height: 100rem;
    border-radius: 50%;
    background: #F98F18;
    display: flex;
    justify-content: center;
    align-items: center;
    .icon{
        color: #ffffff;
        font-size: 48rem;
    }
}
.van-nav-bar {
  height: 120rem;
  :deep(.van-nav-bar__content) {
    height: 100%;
  }
}
</style>
