<template>
  <x-page no-header tabbar>
    <div class="header">
      <x-statusbar />
      <van-nav-bar title="应用">
        <template #right>
          <div class="icon-item" v-for="item in iconList">
            <van-badge :content="item.num" color="#FF5805">
              <v-s-icon :name="item.icon" :size="40" />
            </van-badge>
          </div>
        </template>
      </van-nav-bar>
      <div class="search">
        <input class="search_input" @focus="" placeholder="请输入搜索关键词" />
        <div class="search_icon">
          <van-icon name="search" size="32rem" />
        </div>
      </div>
      <tabs v-model="activeTab" @change="onTab"/>
    </div>
    <div class="content">
      <template v-if="list && list.length > 0">
        <div class="app_status_card" v-for="item in list">
          <app-card :item="item" />
        </div>
      </template>
      <van-empty v-else :image="`/static/img/application/notData.png`" image-size="562rem" description="暂无程序" />
    </div>
  </x-page>
</template>
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { index } from './app'
import appCard from './components/app-card.vue'
import tabs from './components/tabs.vue'
import { apis } from '@/api'
const conf = index()
const iconList = reactive([
  { icon: 'download', num: '0' },
  { icon: 'upload', num: '0' }
])
const activeTab = ref('')

const onTab = (item: any) => {
  activeTab.value = item.value
  getList()
}

const list = ref<any[]>([])
const parmas = reactive({
  installed: true,
  page: 1,
  pageSize: 10
})
const getList = () => {
  apis.getSoftList({ ...parmas, tags: activeTab.value }).then((res: any) => {
    list.value = res.data?.data || []
  })
}
onMounted(() => {
  getList()
})
</script>

<style lang="less" scoped>
:deep(.van-nav-bar__right) {
  padding-right: 8rem;
}
.header {
  padding: 0 32rem 18rem 32rem;
  background: var(--card-bg-color);
  width: 100%;
  position: fixed;
  .icon-item {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 32rem;
  }
  .search {
    margin-top: 32rem;
    position: relative;
    input {
      background: var(--bg-color);
      height: 64rem;
      width: 100%;
      border-radius: 46rem;
      padding: 0 32rem;
    }
    .search_icon {
      position: absolute;
      right: 32rem;
      top: 16rem;
    }
  }
  .tabs-content {
    display: flex;
    align-items: center;
    margin-top: 44rem;
    .left {
      margin-right: 20rem;
    }
    .tabs {
      display: flex;
      background: var(--card-bg-color);
      overflow-x: scroll;
      .tab {
        margin-left: 40rem;
        font-size: 28rem;
        white-space: nowrap;
        text-align: center;
      }
      .tab:first-child {
        margin-left: 0;
      }

      .active {
        font-weight: 800;
      }
    }
    .right {
      margin-left: 20rem;
    }
  }
}

.content {
  padding: 0 32rem;
  background: var(--bg-color);
  height: 100%;
  overflow-y: scroll;
  padding-bottom: 32rem;
  margin-top: calc(148rem + 44rem + 64rem + 64rem);
  .app_status_card {
    padding: 32rem;
    background: var(--card-bg-color);
    margin-top: 20rem;
    border-radius: 12rem;
  }
}
</style>
