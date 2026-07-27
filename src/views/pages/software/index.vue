<script setup lang="ts">
import CardTabs from '@/components/card-tabs.vue'
import { markRaw, reactive } from 'vue'
import AllSoft from './components/all.vue'
import InstalledSoft from './components/installed.vue'
import UpdateSoft from './components/update.vue'
import SearchInput from '@/components/search-input.vue'
import { TabsPaneContext } from 'element-plus'
import { Api } from '@/api/Api'

export interface ChildProps {
  list: any[]
}

export interface ChildEmits {
  (event: 'refresh'): void
}

const conf = reactive({
  dataTypelist: markRaw([
    {
      name: '全部',
      index: 0,
      component: AllSoft
    },
    {
      name: '已安装',
      index: 1,
      component: InstalledSoft
    },
    {
      name: '可升级',
      index: 2,
      dot: false,
      component: UpdateSoft
    }
  ]),
  activeIndex: 0,
  tabs: {
    selected: 0,
    list: markRaw([
      {
        name: '全部',
        index: 0
      },
      {
        name: '建站',
        index: 1
      },
      {
        name: '数据库',
        index: 2
      },
      {
        name: 'Web服务器',
        index: 3
      },
      {
        name: '运行环境',
        index: 4
      },
      {
        name: '实用工具',
        index: 5
      },
      {
        name: '云存储',
        index: 6
      },
      {
        name: 'AI / 大模型',
        index: 7
      }
    ]),
    handleClick: async ({ props }: TabsPaneContext) => {
      conf.list.params.page = 1
      conf.list.params.tags = props.label === '全部' ? undefined : props.label
      conf.list.getData()
    }
  },
  clickActive: (item: any) => {
    conf.activeIndex = item.index
    conf.list.params.isUpdate = item.index === 2 ? true : undefined
    conf.list.params.installed = item.index === 0 ? undefined : true
    conf.list.params.page = 1
    conf.list.params.name = undefined
    conf.list.params.tags = undefined
    conf.list.getData()
  },
  list: {
    loading: true,
    data: [],
    params: {
      tags: undefined as undefined | string,
      name: undefined,
      isUpdate: undefined as undefined | boolean,
      installed: undefined as undefined | boolean,
      page: 1,
      pageSize: 9
    },
    total: 0,
    getData: async () => {
      conf.list.loading = true
      const { data: res } = await Api.getSoftList(conf.list.params)
      conf.list.loading = false
      conf.list.total = res.total
      conf.list.data = res.data ?? []
    },
    pageChange: (value: number) => {
      conf.list.params.page = value
      conf.list.getData()
    },
    onSearch: () => {
      conf.list.params.page = 1
      conf.list.getData()
    }
  },
  drawer: {
    show: false,
    title: '',
    onClose: () => {
      conf.drawer.show = false
    },
    onConfirm: () => {
      conf.drawer.show = false
    }
  }
})

conf.list.getData()
</script>

<template>
  <div class="software-container relative" >
    <div class="absolute fit-width software-content">
      <card-tabs :list="conf.dataTypelist" :activeIndex="conf.activeIndex" :clickActive="conf.clickActive" />
      <div v-loading="conf.list.loading" class="box2 software-box">
        <div class="category flex justify-between items-center" >
          <el-tabs v-model="conf.tabs.selected" @tab-click="conf.tabs.handleClick">
            <el-tab-pane v-for="item in conf.tabs.list" :label="item.name" :name="item.index" />
          </el-tabs>
          <div class="search-wrap">
            <search-input v-model="conf.list.params.name" placeholder="请输入搜索关键字" @search="conf.list.onSearch" />
          </div>
        </div>
        <component
          :is="conf.dataTypelist[conf.activeIndex].component"
          :list="conf.list.data"
          @refresh="conf.list.getData"
        />
        <div class="pagination">
          <el-pagination
            v-if="conf.list.total"
            background
            layout="prev, pager, next"
            :total="conf.list.total"
            :current-page="conf.list.params.page"
            :page-size="conf.list.params.pageSize"
            @current-change="conf.list.pageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.software-content {
  padding-bottom: 35px;
}

.software-box {
  padding: 20px 22px 24px;
}

.category {
  min-height: 58px;
  padding: 0 10px 0 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  margin-bottom: 24px;
  background: var(--surface-subtle);
}

.search-wrap {
  padding: 6px 0 6px 16px;
}

:deep(.el-tabs__nav-wrap) {
  &::after {
    background: transparent;
  }
}

:deep(.el-tabs__header) {
  margin: 0;
}

@media (max-width: 780px) {
  .software-box {
    padding: 14px;
  }

  .category {
    padding: 10px;
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
  }

  .search-wrap {
    width: 100%;
    padding: 0;
  }
}
</style>
