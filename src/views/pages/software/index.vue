<script setup lang="ts">
import CardTabs from '@/components/card-tabs.vue'
import { computed, markRaw, reactive } from 'vue'
import AllSoft from './components/all.vue'
import SearchInput from '@/components/search-input.vue'
import { TabsPaneContext } from 'element-plus'
import { Api } from '@/api/Api'
import { ElMessage } from 'element-plus'
import i18n from '@/lang'

export interface ChildProps {
  list: any[]
}

export interface ChildEmits {
  (event: 'refresh'): void
}

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
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
    selected: 0,
    list: markRaw([
      {
        name: 'All',
        nameKey: 'software.category.all',
        index: 0
      },
      {
        name: 'Sites',
        nameKey: 'software.category.website',
        tag: '\u5efa\u7ad9',
        index: 1
      },
      {
        name: 'Databases',
        nameKey: 'software.category.database',
        tag: '\u6570\u636e\u5e93',
        index: 2
      },
      {
        name: 'Web server',
        nameKey: 'software.category.webServer',
        tag: 'Web\u670d\u52a1\u5668',
        index: 3
      },
      {
        name: 'Runtime',
        nameKey: 'software.category.runtime',
        tag: '\u8fd0\u884c\u73af\u5883',
        index: 4
      },
      {
        name: 'Utilities',
        nameKey: 'software.category.utility',
        tag: '\u5b9e\u7528\u5de5\u5177',
        index: 5
      },
      {
        name: 'Cloud storage',
        nameKey: 'software.category.cloudStorage',
        tag: '\u4e91\u5b58\u50a8',
        index: 6
      },
      {
        name: 'AI / LLM',
        nameKey: 'software.category.ai',
        tag: 'AI / \u5927\u6a21\u578b',
        index: 7
      }
    ]),
    handleClick: async ({ props }: TabsPaneContext) => {
      const tab = conf.tabs.list.find((item) => item.index === Number(props.name))
      conf.list.params.page = 1
      conf.list.params.tags = tab?.tag
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
          <div class="catalog-source-copy">
            <span class="source-dot" />
            <span>
              <strong>{{ catalogLabel }}</strong>
              <small>{{ catalogDetail }}</small>
              <small v-if="conf.catalog.status?.lastError" class="source-error">
                {{ $t('software.lastSyncFailed', { message: conf.catalog.status.lastError }) }}
              </small>
            </span>
          </div>
          <el-button
            v-if="conf.catalog.status?.enabled"
            :loading="conf.catalog.loading"
            plain
            @click="conf.catalog.sync"
          >
            {{ $t('software.syncNow') }}
          </el-button>
        </div>
        <div class="category flex justify-between items-center" >
          <el-tabs v-model="conf.tabs.selected" @tab-click="conf.tabs.handleClick">
            <el-tab-pane v-for="item in conf.tabs.list" :label="$t(item.nameKey)" :name="item.index" />
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
