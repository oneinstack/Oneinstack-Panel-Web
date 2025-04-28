<template>
  <x-page no-header tabbar no-footer>
    <div class="memo-list-page">
      <x-statusbar />
      <van-nav-bar left-arrow :title="$t('home.memo')" @click-left="router.back()"></van-nav-bar>
      <div class="content">
        <div class="column">
          <div class="card" v-for="(item, index) in leftList" :key="index" @click="goPage(item)">
            <van-text-ellipsis class="text" :content="item.content" />
            <van-text-ellipsis class="text" rows="3" :content="item.content" />
            <p class="date">{{ item.date }}</p>
          </div>
        </div>
        <div class="column">
          <div class="card" v-for="(item, index) in rightList" :key="index" @click="goPage(item)">
            <van-text-ellipsis class="text" :content="item.content" />
            <van-text-ellipsis class="text" rows="3" :content="item.content" />
            <p class="date">{{ item.date }}</p>
          </div>
        </div>
      </div>
      <div class="float-btn">
        <van-icon class="icon" name="plus" @click="goPage({})"/>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { apis } from '@/api'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const goPage = (item:any) => {
  router.push({
    path: '/memo',
    query: {
      id: item.id,
    }
  })
}
const list = ref<any>([])
const leftList = computed(() => list.value.filter((_:any, index:number) => index % 2 === 0))
const rightList = computed(() => list.value.filter((_:any, index:number) => index % 2 === 1))
const getList = () => {
  apis.getRemarkList().then((res: any) => {
    list.value = res.data;
  })
}
onMounted(() => {
  getList()
})
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
      background: var(--card-bg-color);
      border-radius: 12rem;
      padding: 16rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      .text {
        font-size: 28rem;
        line-height: 1.5;
        color: var(--font-dark-color);
      }

      .date {
        margin-top: 16rem;
        font-size: 24rem;
        color: var(--font-gray-color);
      }
    }
  }
}
.float-btn {
  position: fixed;
  right: 32rem;
  bottom: 144rem;
  width: 100rem;
  height: 100rem;
  border-radius: 50%;
  background: var(--primary-color);
  display: flex;
  justify-content: center;
  align-items: center;
  .icon {
    color: var(--card-bg-color);
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
