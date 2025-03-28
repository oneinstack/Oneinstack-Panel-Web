<template>
  <x-page no-header tabbar no-footer>
    <div class="memo-page">
      <x-statusbar />
      <van-nav-bar left-arrow title="" >
        <template #left>
          <van-icon name="arrow-left" color="#a5a5a5" @click-left="router.back()"/>
        </template>
        <template #right>
          <van-icon class="icon" name="revoke" />
          <van-icon class="icon rotate" name="revoke" />
          <van-icon class="icon save" name="success" />
        </template>
      </van-nav-bar>
      <div class="content">
        <van-field class="title" v-model="memo.title" placeholder="标题" />
        <p class="date">
          1月7日 10:36
          <span>{{ memo.text.length }}字</span>
        </p>
        <van-field class="text" v-model="memo.text" autosize type="textarea" placeholder="开始书写" />
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
interface memo {
  title: string
  text: string
}
const memo = reactive<memo>({
  title: '',
  text: ''
})
</script>
<style lang="less" scoped>
.memo-page {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  height: 100%;
  .content {
    flex: 1;
    padding: 0 32rem;
    .title {
      font-size: 48rem;
      padding: 0;
      margin-top: 56rem;
    }
    .date {
      font-size: 28rem;
      line-height: 24rem;
      color: #b6b6b6;
      margin-top: 52rem;
      span {
        margin-left: 46rem;
      }
    }
    .text {
      padding: 24rem 0;
      font-size: 28rem;
    }
  }
}
:deep(.van-nav-bar__left) {
  font-size: 40rem;
}

.icon {
  font-size: 44rem;
  color: #272636;
}
.rotate {
  transform: rotate(-180deg);
  color: #a5a5a5;
  margin-left: 38rem;
}
.save {
  margin-left: 74rem;
}
.van-cell:after {
  border-bottom: 0;
}
</style>
