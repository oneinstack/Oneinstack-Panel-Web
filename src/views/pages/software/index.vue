<script setup lang="ts">
import CardTabs from '@/components/card-tabs.vue'
import { computed, markRaw, reactive, watch } from 'vue'
import AllSoft from './components/all.vue'
import SearchInput from '@/components/search-input.vue'
import { TabsPaneContext } from 'element-plus'
import { Api } from '@/api/modules'
import { ElMessage } from 'element-plus'
import i18n from '@/lang'
import System from '@/utils/System'

export interface ChildProps {
  list: any[]
}

export interface ChildEmits {
  (event: 'refresh'): void
}

interface SoftwareCategory {
  name: string
  value: string
  count: number
}

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const showCatalogSyncButton = !import.meta.env.PROD

const buildCategoryQuery = () => {
  if (conf.activeIndex === 1) return { installed: true }
  if (conf.activeIndex === 2) return { isUpdate: true }
  return undefined
}

const conf = reactive({
  dataTypelist: markRaw([
    {
      name: 'All',
      nameKey: 'software.tabs.all',
      index: 0,
      component: AllSoft
    },
    {
      name: 'Installed',
      nameKey: 'software.tabs.installed',
      index: 1,
      component: AllSoft
    },
    {
      name: 'Upgradeable',
      nameKey: 'software.tabs.upgradeable',
      index: 2,
      dot: false,
      component: AllSoft
    }
  ]),
  activeIndex: 0,
  tabs: {
    selected: '',
    list: [] as SoftwareCategory[],
    getLabel: (item: SoftwareCategory) => {
      return `${item.name}${typeof item.count === 'number' ? ` (${item.count})` : ''}`
    },
    handleClick: async ({ props }: TabsPaneContext) => {
      const tab = conf.tabs.list.find((item) => item.value === String(props.name))
      conf.list.params.page = 1
      conf.list.params.tags = tab?.value || undefined
      await conf.list.getData()
    },
    getData: async (query?: { installed?: boolean; isUpdate?: boolean }) => {
      const { data } = await Api.getSoftCategories(query)
      const categories = Array.isArray(data) ? data : []
      conf.tabs.list = categories
      const current = categories.find((item) => item.value === conf.list.params.tags)
      const fallback = categories[0]
      conf.tabs.selected = (current || fallback)?.value || ''
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
        await conf.tabs.getData(buildCategoryQuery())
        await conf.list.getData()
        ElMessage.success(t('software.syncSuccess', 'Software store updated from Center'))
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
    conf.tabs.selected = ''
    void Promise.all([
      conf.tabs.getData(buildCategoryQuery()),
      conf.list.getData()
    ])
  },
  list: {
    loading: true,
    data: [],
    params: {
      tags: undefined as undefined | string,
      name: undefined as string | undefined,
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
      conf.list.data = (res.data ?? []).map((item: Record<string, any>) => {
        const port = item?.http_port ?? item?.httpPort
        if (port === undefined || port === null || port === '') return item
        return {
          ...item,
          port
        }
      })
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

const reloadSoftwarePageData = async () => {
  await Promise.all([
    conf.catalog.getStatus(),
    conf.tabs.getData(buildCategoryQuery()),
    conf.list.getData()
  ])
}

const requestedComponent = String(System.getRouterParams().component || '').toLowerCase()
const componentSearchNames: Record<string, string> = {
  mysql: 'MySQL',
  redis: 'Redis',
  php: 'PHP',
  phpmyadmin: 'phpMyAdmin',
  nginx: 'Nginx'
}
if (componentSearchNames[requestedComponent]) {
  conf.list.params.name = componentSearchNames[requestedComponent]
}

void reloadSoftwarePageData()

watch(
  () => i18n.locale,
  () => {
    void reloadSoftwarePageData()
  }
)

const catalogLabel = computed(() => {
  const status = conf.catalog.status
  if (!status) return t('software.catalogReading', 'Reading store source')
  if (status.mode === 'center') return t('software.catalogCenterSynced', 'Center synced · {count} apps', { count: status.productCount })
  if (status.mode === 'center-cache') return t('software.catalogCenterCache', 'Center unavailable · using trusted cache')
  if (status.mode === 'center-cache-disabled') return t('software.catalogCenterCacheDisabled', 'Center sync disabled · using last cache')
  if (status.mode === 'local-fallback') return t('software.catalogLocalFallback', 'Center catalog unavailable · using local catalog')
  return t('software.catalogBuiltin', 'Built-in local catalog')
})

const catalogDetail = computed(() => {
  const status = conf.catalog.status
  if (!status) return ''
  if (status.lastSyncedAt) {
    return t('software.catalogDetail', 'Channel {channel} · last synced {time}', {
      channel: status.channel,
      time: new Date(status.lastSyncedAt).toLocaleString()
    })
  }
  return status.enabled ? t('software.catalogWaitingFirstSync', 'Waiting for first sync') : t('software.catalogEnableHint', 'Enable Script Center in settings')
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
          <el-button
            v-if="showCatalogSyncButton && conf.catalog.status"
            :loading="conf.catalog.loading"
            :disabled="!conf.catalog.status?.enabled"
            plain
            @click="conf.catalog.sync"
          >
            {{ $t('software.syncNow') }}
          </el-button>
        </div>
        <div class="category flex justify-between items-center" >
          <el-tabs v-model="conf.tabs.selected" @tab-click="conf.tabs.handleClick">
            <el-tab-pane
              v-for="item in conf.tabs.list"
              :key="item.value || item.name"
              :label="conf.tabs.getLabel(item)"
              :name="item.value"
            />
          </el-tabs>
          <div class="search-wrap">
            <search-input v-model="conf.list.params.name" :placeholder="$t('common.searchKeywordPlaceholder')" @search="conf.list.onSearch" />
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
  width: 100%;
  min-width: 0;
  padding-bottom: 35px;
}

.software-box {
  padding: clamp(16px, 2vw, 22px) clamp(14px, 2vw, 22px) 24px;
}

.catalog-source {
  display: flex;
  justify-content: end;
  // min-height: 66px;
  // padding: 12px 14px 12px 16px;
  // align-items: center;
  // justify-content: space-between;
  // gap: 16px;
  margin-bottom: 14px;
  // border: 1px solid color-mix(in srgb, var(--el-color-success) 24%, var(--border-subtle));
  // border-radius: 12px;
  // background: color-mix(in srgb, var(--el-color-success) 5%, var(--surface-card));

  // &.warning {
  //   border-color: color-mix(in srgb, var(--el-color-warning) 30%, var(--border-subtle));
  //   background: color-mix(in srgb, var(--el-color-warning) 6%, var(--surface-card));

  //   .source-dot {
  //     background: var(--el-color-warning);
  //   }
  // }
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
  display: flex;
  min-height: 58px;
  padding: 0 10px 0 14px;
  align-items: center;
  gap: 16px;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  margin-bottom: 24px;
  background: var(--surface-subtle);
}

.category :deep(.el-tabs) {
  min-width: 0;
  flex: 1 1 auto;
}

.search-wrap {
  flex: 0 0 auto;
  width: min(320px, 100%);
  padding: 6px 0 6px 16px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

:deep(.el-tabs__nav-wrap) {
  &::after {
    background: transparent;
  }

  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

:deep(.el-tabs__header) {
  margin: 0;
  min-width: 0;
}

:deep(.el-tabs__nav-scroll) {
  min-width: 0;
}

:deep(.el-tabs__nav-prev),
:deep(.el-tabs__nav-next) {
  width: 30px !important;
  height: 30px !important;
  top: 50% !important;
  bottom: auto !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%) !important;
  border-radius: 9px;
  color: var(--text-tertiary);
  line-height: 30px !important;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    color: rgb(var(--primary-color)) !important;
    background: rgba(var(--primary-color), 0.1) !important;
    box-shadow: inset 0 0 0 1px rgba(var(--primary-color), 0.12);
  }
}

:deep(.el-tabs__nav-prev i),
:deep(.el-tabs__nav-next i) {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: 14px;
}

:deep(.el-tabs__nav) {
  display: flex;
  flex-wrap: nowrap;
  gap: 0;
  min-width: max-content;
}

:deep(.el-tabs__active-bar) {
  max-width: none;
}

:deep(.el-tabs__item) {
  flex: 0 0 auto;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .catalog-source {
    align-items: stretch;
    flex-direction: column;
  }

  .catalog-source :deep(.el-button) {
    align-self: flex-start;
  }

  .category {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
    padding: 12px 14px;
    overflow: visible;
  }

  .search-wrap {
    flex: 1 1 auto;
    width: 100%;
    padding: 0;
  }

  :deep(.el-tabs) {
    width: 100%;
  }

  :deep(.el-tabs__nav-prev),
  :deep(.el-tabs__nav-next) {
    top: 50% !important;
    transform: translateY(-50%) !important;
  }

  :deep(.el-tabs__nav-prev:hover),
  :deep(.el-tabs__nav-next:hover) {
    background: rgba(var(--primary-color), 0.12) !important;
  }
}

@media (max-width: 780px) {
  .software-box {
    padding: 14px;
  }

  .category {
    padding: 10px 12px;
  }

  .catalog-source-copy .source-error {
    max-width: 100%;
  }

  .pagination {
    justify-content: center;
  }

  :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 560px) {
  .software-content {
    padding-bottom: 24px;
  }

  .catalog-source {
    padding: 12px;
    gap: 12px;
  }

  .catalog-source :deep(.el-button) {
    width: 100%;
  }

  :deep(.el-tabs__item) {
    padding: 0 14px;
    font-size: 13px;
  }

  :deep(.el-tabs__header) {
    width: 100%;
  }
}
</style>
