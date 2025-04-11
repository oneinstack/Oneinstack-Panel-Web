<template>
  <x-page no-header tabbar>
    <div class="header">
      <x-statusbar />
      <van-nav-bar title="应用">
        <template #right>
          <div class="icon-item" v-for="item in iconList">
            <van-badge :content="item.num" color="#FF5805">
              <!-- <van-image class="icon" width="40rem" height="40rem" :src="item.icon" /> -->
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
      <div class="tabs">
        <div class="tab" :class="activeTab == item.value ? 'active' : ''" v-for="item in tabList" @click="onTab(item)">
          <p>{{ item.label }}</p>
          <van-image
            v-if="activeTab == item.value"
            class="icon"
            width="30rem"
            height="16rem"
            :src="'/static/img/application/tab-active.png'"
          />
        </div>
      </div>
    </div>
    <div class="content">
      <template v-if="list && list.length > 0">
        <div class="app_status_card" v-for="item in list">
          <div class="top">
            <div class="left">
              <van-image width="72rem" height="72rem" :src="item.icon" />
              <div class="info">
                <p class="name">{{item.name}}</p>
                <p class="introduce">{{item.describe}}</p>
              </div>
            </div>
            <div :class="item.status == 1 ? 'run' : 'stop'">{{ item.status == 1 ? '运行中' : '停止中' }}</div>
          </div>
          <van-divider />
          <div class="footer">
            <span @click="openLog(item)">日志</span>
            <div class="btns">
              <div class="btn restart">重启</div>
              <div class="btn stop" @click="openStop">停止</div>
            </div>
          </div>
        </div>
      </template>

      <van-empty v-else :image="`/static/img/application/notData.png`" image-size="562rem" description="暂无程序" />
    </div>
    <logDialog ref="logRef" />
    <stopDialog ref="stopRef" />
  </x-page>
</template>
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { index } from './app'
import logDialog from './components/log.vue'
import stopDialog from './components/stop.vue'
import { apis } from '@/api'
const conf = index()
const iconList = reactive([
  { icon: 'download', num: '0' },
  { icon: 'upload', num: '0' }
])
const activeTab = ref('');
const tabList = reactive([
  {
    label: '全部',
    value: '',
    key: '1'
  },
  {
    label: '建站',
    value: '建站',
    key: '2'
  },
  {
    label: '数据库',
    value: '数据库',
    key: '3'
  },
  {
    label: 'Web服务器',
    value: 'Web服务器',
    key: '4'
  },
  {
    label: '运行环境',
    value: '运行环境',
    key: '5'
  },
  {
    label: '实用工具',
    value: '实用工具',
    key: '6'
  },
  {
    label: '云存储',
    value: '云存储',
    key: '7'
  },
  {
    label: 'AI/大模型',
    value: 'AI/大模型',
    key: '8'
  }
])
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
  apis.getSoftList({...parmas,tags:activeTab.value}).then((res: any) => {
    list.value = res.data?.data || [];
  })
}
onMounted(() => {
  getList();
})
const logRef = ref()
const openLog = (item:any) => {
  logRef.value.open(item)
}
const stopRef = ref()
const openStop = () => {
  stopRef.value.open()
}
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

  // .van-nav-bar {
  //   margin-top: 118rem;
  // }
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
  .tabs {
    display: flex;
    background: var(--card-bg-color);
    margin-top: 44rem;
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
    .top {
      display: flex;
      justify-content: space-between;
      .left {
        display: flex;
        .info {
          margin-left: 28rem;
          .name {
            font-size: 32rem;
            font-weight: 700;
          }
          .introduce {
            width: 272rem;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
        }
      }
      .run {
        color: var(--success-color);
      }
      .stop {
        color: var(--warning-color);
      }
    }
    .van-divider {
      margin: 0;
      margin-top: 36rem;
      margin-bottom: 28rem;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      span {
        color: var(--font-gray-color);
        border-bottom: 1px solid var(--font-gray-color);
      }
      .btns {
        display: flex;
        .btn {
          width: 108rem;
          height: 52rem;
          line-height: 52rem;
          text-align: center;
          margin-left: 32rem;
          border-radius: 12rem;
        }
        .restart {
          border: 1px solid var(--font-gray-color);
          color: var(--font-gray-color);
        }
        .stop {
          border: 1px solid var(--primary-color);
          color: var(--primary-color);
        }
      }
    }
  }
}
</style>
