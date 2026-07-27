<script setup lang="ts">
import CardTabs from '@/components/card-tabs.vue'
import { computed, markRaw, reactive } from 'vue'
import AllSoft from './components/all.vue'
import SearchInput from '@/components/search-input.vue'
import { TabsPaneContext } from 'element-plus'
import { Api } from '@/api/Api'
import { ElMessage } from 'element-plus'

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
      component: AllSoft
    },
    {
      name: '可升级',
      index: 2,
      dot: false,
      component: AllSoft
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
  catalog: {
    loading: false,
    status: null as null | {
      enabled: boolean
      mode: string
      revision?: string
      productCount: number
      versionCount: number
      lastSyncedAt?: string
      lastError?: string
      stale: boolean
      channel: string
    },
    getStatus: async () => {
      const { data } = await Api.getSoftwareCatalogStatus()
      conf.catalog.status = data
    },
    sync: async () => {
      if (conf.catalog.loading) return
      conf.catalog.loading = true
      try {
        const { data } = await Api.syncSoftwareCatalog()
        conf.catalog.status = data
        await conf.list.getData()
        ElMessage.success('软件商城已从 Center 更新')
      } catch (error) {
        await conf.catalog.getStatus().catch(() => {})
        throw error
      } finally {
        conf.catalog.loading = false
      }
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
void conf.catalog.getStatus()

const catalogLabel = computed(() => {
  const status = conf.catalog.status
  if (!status) return '正在读取商城来源'
  if (status.mode === 'center') return `Center 已同步 · ${status.productCount} 个应用`
  if (status.mode === 'center-cache') return `Center 暂不可用 · 正在使用可信缓存`
  if (status.mode === 'center-cache-disabled') return 'Center 同步已关闭 · 正在使用上次缓存'
  if (status.mode === 'local-fallback') return '尚未取得 Center 目录 · 正在使用本地目录'
  return '本地内置目录'
})

const catalogDetail = computed(() => {
  const status = conf.catalog.status
  if (!status) return ''
  if (status.lastSyncedAt) {
    return `通道 ${status.channel} · 最近同步 ${new Date(status.lastSyncedAt).toLocaleString()}`
  }
  return status.enabled ? '等待首次同步' : '可在配置中启用 Script Center'
})
</script>

<template>
  <div class="software-container relative" >
    <div class="absolute fit-width software-content">
      <card-tabs :list="conf.dataTypelist" :activeIndex="conf.activeIndex" :clickActive="conf.clickActive" />
      <div v-loading="conf.list.loading" class="box2 software-box">
        <div
          class="catalog-source"
          :class="{ warning: conf.catalog.status?.stale || !!conf.catalog.status?.lastError }"
        >
          <div class="catalog-source-copy">
            <span class="source-dot" />
            <span>
              <strong>{{ catalogLabel }}</strong>
              <small>{{ catalogDetail }}</small>
              <small v-if="conf.catalog.status?.lastError" class="source-error">
                最近同步失败：{{ conf.catalog.status.lastError }}
              </small>
            </span>
          </div>
          <el-button
            v-if="conf.catalog.status?.enabled"
            :loading="conf.catalog.loading"
            plain
            @click="conf.catalog.sync"
          >
            立即同步
          </el-button>
        </div>
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

.catalog-source {
  display: flex;
  min-height: 66px;
  padding: 12px 14px 12px 16px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  border: 1px solid color-mix(in srgb, var(--el-color-success) 24%, var(--border-subtle));
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-color-success) 5%, var(--surface-card));

  &.warning {
    border-color: color-mix(in srgb, var(--el-color-warning) 30%, var(--border-subtle));
    background: color-mix(in srgb, var(--el-color-warning) 6%, var(--surface-card));

    .source-dot {
      background: var(--el-color-warning);
    }
  }
}

.catalog-source-copy {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;

  > span:last-child {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }

  strong {
    color: var(--text-primary);
    font-size: 13px;
  }

  small {
    margin-top: 3px;
    color: var(--text-tertiary);
    font-size: 11px;
  }

  .source-error {
    overflow: hidden;
    max-width: min(760px, 65vw);
    color: var(--el-color-warning-dark-2);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.source-dot {
  width: 9px;
  height: 9px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--el-color-success);
  box-shadow: 0 0 0 5px color-mix(in srgb, currentColor 10%, transparent);
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

  .catalog-source {
    align-items: stretch;
    flex-direction: column;
  }

  .search-wrap {
    width: 100%;
    padding: 0;
  }
}
</style>
