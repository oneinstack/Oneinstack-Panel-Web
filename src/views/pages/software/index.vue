<script setup lang="ts">
import CardTabs from '@/components/card-tabs.vue'
import { computed, markRaw, onUnmounted, reactive, ref, watch } from 'vue'
import AllSoft from './components/all.vue'
import SearchInput from '@/components/search-input.vue'
import { TabsPaneContext } from 'element-plus'
import { Api } from '@/api/modules'
import { ElMessage } from 'element-plus'
import i18n from '@/lang'
import System from '@/utils/System'
import { hasSoftwareButtonAccess } from './access'

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

const pageLoading = ref(true)
const canReadSoftware = computed(() => hasSoftwareButtonAccess('read'))
let latestListRequest = 0
let initialCatalogPollTimer: number | undefined
let initialCatalogPollAttempts = 0

const stopInitialCatalogPolling = () => {
  if (initialCatalogPollTimer !== undefined) {
    window.clearTimeout(initialCatalogPollTimer)
    initialCatalogPollTimer = undefined
  }
}

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
      if (!canReadSoftware.value) return
      const tab = conf.tabs.list.find((item) => item.value === String(props.name))
      conf.list.params.page = 1
      conf.list.params.tags = tab?.value || undefined
      await conf.list.getData()
    },
    getData: async (query?: { installed?: boolean; isUpdate?: boolean }) => {
      if (!canReadSoftware.value) {
        conf.tabs.list = []
        conf.tabs.selected = ''
        return
      }
      const { data } = await Api.getSoftCategories(query)
      const categories = Array.isArray(data) ? data : []
      conf.tabs.list = categories
      const current = categories.find((item) => item.value === conf.list.params.tags)
      const fallback = categories[0]
      conf.tabs.selected = (current || fallback)?.value || ''
    }
  },
  catalog: {
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
  },
  clickActive: (item: any) => {
    if (!canReadSoftware.value) return
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
      const requestId = ++latestListRequest
      if (!canReadSoftware.value) {
        conf.list.loading = false
        conf.list.data = []
        conf.list.total = 0
        return
      }
      conf.list.loading = true
      const params = { ...conf.list.params }
      try {
        const { data: res } = await Api.getSoftList(params)
        if (requestId !== latestListRequest) return
        conf.list.total = res.total
        conf.list.data = (res.data ?? []).map((item: Record<string, any>) => {
          const port = item?.http_port ?? item?.httpPort
          if (port === undefined || port === null || port === '') return item
          return {
            ...item,
            port
          }
        })
      } finally {
        if (requestId === latestListRequest) {
          conf.list.loading = false
        }
      }
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
  stopInitialCatalogPolling()
  initialCatalogPollAttempts = 0
  if (!canReadSoftware.value) {
    conf.catalog.status = null
    conf.tabs.list = []
    conf.tabs.selected = ''
    conf.list.data = []
    conf.list.total = 0
    pageLoading.value = false
    return
  }
  pageLoading.value = true
  try {
    await conf.catalog.getStatus()
    await Promise.all([
      conf.tabs.getData(buildCategoryQuery()),
      conf.list.getData()
    ])
  } finally {
    pageLoading.value = false
    pollForInitialCatalogSync()
  }
}

const pollForInitialCatalogSync = () => {
  const status = conf.catalog.status
  if (!status?.enabled || status.mode !== 'local-fallback' || status.lastError || initialCatalogPollAttempts >= 75) return
  stopInitialCatalogPolling()
  initialCatalogPollTimer = window.setTimeout(async () => {
    initialCatalogPollTimer = undefined
    initialCatalogPollAttempts += 1
    try {
      await conf.catalog.getStatus()
      if (conf.catalog.status?.mode === 'center') {
        await Promise.all([
          conf.tabs.getData(buildCategoryQuery()),
          conf.list.getData()
        ])
        return
      }
    } catch {
      stopInitialCatalogPolling()
      return
    }
    pollForInitialCatalogSync()
  }, 2000)
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

onUnmounted(stopInitialCatalogPolling)

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
  if (status.lastError) {
    return t('software.lastSyncFailed', '最近同步失败：{message}', { message: status.lastError })
  }
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
      <div
        v-loading="pageLoading || conf.list.loading"
        :element-loading-text="t('software.loading', 'Loading software data...')"
        class="box2 software-box"
        :aria-busy="pageLoading || conf.list.loading"
      >
        <div
          class="catalog-source"
          :class="{ warning: conf.catalog.status?.stale || !!conf.catalog.status?.lastError }"
        >
          <div class="catalog-source-copy">
            <span class="source-dot" :class="{ warning: conf.catalog.status?.stale || !!conf.catalog.status?.lastError }" />
            <span>
              <strong>{{ catalogLabel }}</strong>
              <small :class="{ 'source-error': !!conf.catalog.status?.lastError }">{{ catalogDetail }}</small>
            </span>
          </div>
        </div>
        <div class="category">
          <el-tabs class="category-tabs" v-model="conf.tabs.selected" @tab-click="conf.tabs.handleClick">
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
  display: none;
}

.category {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 300px);
  min-height: 62px;
  padding: 0 12px;
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
}

.category :deep(.el-tabs__content) {
  display: none;
}

.search-wrap {
  min-width: 0;
  width: 100%;
  padding: 0;
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
  height: 62px;
  min-width: 0;
}

:deep(.el-tabs__nav-scroll) {
  min-width: 0;
}

:deep(.el-tabs__nav-wrap) {
  height: 62px;
  margin-bottom: 0;
}

.category :deep(.el-tabs__nav-wrap.is-scrollable) {
  box-sizing: border-box;
  padding: 0 44px !important;
}

.category :deep(.el-tabs__nav-prev),
.category :deep(.el-tabs__nav-next) {
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
  background: var(--surface-subtle);
  line-height: 30px !important;
  z-index: 2;
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
  padding: 0;
}

:deep(.el-tabs__active-bar) {
  display: block;
  bottom: 0;
  height: 3px;
  border-radius: 999px 999px 0 0;
  background: rgb(var(--primary-color));
}

:deep(.el-tabs__item) {
  flex: 0 0 auto;
  height: 62px;
  margin: 0;
  padding: 0 16px;
  color: var(--text-secondary) !important;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transition:
    color 0.18s ease;

  &:hover {
    color: var(--text-primary) !important;
  }
}

:deep(.el-tabs__item.is-active) {
  color: rgb(var(--primary-color)) !important;
}

@media (max-width: 960px) {
  .category {
    display: flex;
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

  :deep(.el-tabs__item) {
    padding: 0 14px;
    font-size: 13px;
  }

  :deep(.el-tabs__header) {
    width: 100%;
  }
}
</style>
