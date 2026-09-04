<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import { Api } from '@/api/modules'
import i18n from '@/lang'
import CustomDrawer from '@/components/custom-drawer.vue'
import type { ColumnItem } from '@/components/custom-table.vue'
import { formatFileTime } from '@/utils/fileTime'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})
const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const actionKeys = [
  'file.create',
  'file.upload',
  'file.download',
  'file.trash',
  'file.restore',
  'file.delete_permanently',
  'file.empty_trash',
  'file.attributes',
  'file.read',
  'file.save',
  'file.remote_download',
  'file.copy',
  'file.move',
  'file.rename',
  'file.archive',
  'file.extract',
  'file.preview',
  'file.share.create',
  'file.share.revoke',
  'file.share.download',
  'file.favorite.create',
  'file.favorite.cancel'
]
const actionLabels = computed(() =>
  Object.fromEntries(actionKeys.map((key) => [key, t(`file.operations.actions.${key}`, key)]))
)

const state = reactive({
  loading: false,
  items: [] as any[],
  total: 0,
  page: 1,
  pageSize: 20,
  filters: {
    q: '',
    action: '',
    outcome: '' as '' | 'success' | 'failure'
  }
})
const tableRef = ref<any>()

const resetTableScrollTop = async () => {
  await nextTick()
  tableRef.value?.setScrollTop?.(0)
  const bodyWrapper = tableRef.value?.$el?.querySelector('.el-table__body-wrapper .el-scrollbar__wrap')
  if (bodyWrapper) bodyWrapper.scrollTop = 0
}

const load = async (resetScroll = false) => {
  state.loading = true
  try {
    const { data } = await Api.getFileOperations({
      page: state.page,
      pageSize: state.pageSize,
      q: state.filters.q || undefined,
      action: state.filters.action || undefined,
      outcome: state.filters.outcome
    })
    state.items = data?.items ?? []
    state.total = data?.total ?? 0
  } finally {
    state.loading = false
    if (resetScroll) resetTableScrollTop()
  }
}

watch(
  () => props.modelValue,
  (opened) => {
    if (opened) load(true)
  }
)

const applyFilters = () => {
  state.page = 1
  load(true)
}

const handlePageChange = () => {
  load(true)
}

const displayTime = (value: string) => formatFileTime(value)
const columns = computed<ColumnItem[]>(() => [
  { prop: 'createdAt', label: t('common.time', 'Time'), minWidth: 158, slot: 'createdAt' },
  { prop: 'action', label: t('common.action', 'Action'), minWidth: 170, slot: 'action', className: 'operation-action-column' },
  { prop: 'path', label: t('file.operations.filePath', 'File path'), minWidth: 300, showOverflowTooltip: true },
  { prop: 'username', label: t('file.operations.operator', 'Operator'), minWidth: 96, slot: 'username' },
  { prop: 'remoteIp', label: t('file.operations.sourceIp', 'Source IP'), minWidth: 128 },
  { prop: 'outcome', label: t('file.operations.result', 'Result'), minWidth: 80, slot: 'outcome' },
  { prop: 'message', label: t('file.operations.message', 'Description'), minWidth: 220, showOverflowTooltip: true }
])
</script>

<template>
  <custom-drawer
    v-model:visible="visible"
    :title="t('file.operations.title', 'File operation records')"
    size="min(1180px, 94vw)"
    class="file-operation-drawer"
    :destroy-on-close="true"
    :show-footer="false"
    body-mode="compact"
  >
    <div class="drawer-content">
      <div class="filter-bar">
        <el-input
          v-model="state.filters.q"
          clearable
          :placeholder="t('file.operations.searchPlaceholder', 'Search path, account, or source IP')"
          @keyup.enter="applyFilters"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="state.filters.action" clearable :placeholder="t('file.operations.allActions', 'All actions')">
          <el-option v-for="(label, value) in actionLabels" :key="value" :label="label" :value="value" />
        </el-select>
        <el-select v-model="state.filters.outcome" clearable :placeholder="t('file.operations.allResults', 'All results')">
          <el-option :label="t('common.success', 'Success')" value="success" />
          <el-option :label="t('common.failed', 'Failed')" value="failure" />
        </el-select>
        <el-button class="filter-action" type="primary" @click="applyFilters">{{ t('common.query', 'Query') }}</el-button>
        <el-button class="filter-action" :icon="Refresh" @click="load(true)">{{ t('common.refresh', 'Refresh') }}</el-button>
      </div>

      <custom-table
        ref="tableRef"
        v-loading="state.loading"
        :data="state.items"
        :columns="columns"
        :pagination="false"
        :auto-pagination="false"
        height="calc(100vh - 286px)"
        class="operation-table"
      >
        <template #createdAt="{ row }">{{ displayTime(row.createdAt) }}</template>
        <template #action="{ row }"><el-tag class="action-tag" effect="plain">{{ actionLabels[row.action] || row.action }}</el-tag></template>
        <template #username="{ row }">{{ row.username || t('file.operations.system', 'System') }}</template>
        <template #outcome="{ row }">
          <el-tag class="result-tag" :type="row.outcome === 'success' ? 'success' : 'danger'" effect="light">
            {{ row.outcome === 'success' ? t('common.success', 'Success') : t('common.failed', 'Failed') }}
          </el-tag>
        </template>
      </custom-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="state.page"
          v-model:page-size="state.pageSize"
          :total="state.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="applyFilters"
        />
      </div>
    </div>
  </custom-drawer>
</template>

<style scoped lang="less">
.drawer-content {
  display: flex;
  height: 100%;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(150px, max-content) minmax(132px, max-content) max-content max-content;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94)),
    var(--bg-card);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.75),
    0 10px 24px rgba(15, 23, 42, 0.035);

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 38px;
    border-radius: 11px;
    box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.2) inset;
  }

  :deep(.el-button) {
    width: max-content;
    min-height: 38px;
    padding-inline: 18px;
    border-radius: 11px;
    font-weight: 650;
    white-space: nowrap;
  }

  .filter-action {
    margin-left: 0;
  }
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 8px 4px 0;

  :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }
}

:deep(.operation-table) {
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
}

:deep(.operation-table .el-table__header th) {
  height: 46px;
  color: #64748b;
  font-size: 12px;
  font-weight: 750;
  background: linear-gradient(180deg, #fbfcff, #f6f8fb);
}

:deep(.operation-table .el-table__row td) {
  padding: 9px 0;
  color: var(--text-secondary);
}

:deep(.operation-table .el-table__body tr:hover > td) {
  background: rgba(var(--primary-color), 0.035);
}

:deep(.operation-table .cell) {
  line-height: 1.45;
}

:deep(.operation-action-column .cell) {
  overflow: visible;
}

.action-tag {
  width: fit-content;
  max-width: 100%;
  min-height: 28px;
  height: auto;
  padding: 4px 10px;
  border-color: rgba(var(--primary-color), 0.24);
  border-radius: 9px;
  color: rgb(var(--primary-color));
  font-weight: 650;
  background: rgba(var(--primary-color), 0.045);

  :deep(.el-tag__content) {
    min-width: 0;
    overflow-wrap: anywhere;
    white-space: normal;
    line-height: 1.35;
    text-align: center;
  }
}

.result-tag {
  min-width: 44px;
  justify-content: center;
  border-radius: 8px;
  font-weight: 700;
}

@media (max-width: 1080px) {
  .filter-bar {
    grid-template-columns: minmax(220px, 1fr) minmax(150px, 1fr) minmax(132px, 1fr);
  }

  .filter-bar :deep(.el-button) {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .drawer-heading {
    gap: 16px;
  }

  .filter-bar {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .filter-bar :deep(.el-button) {
    width: 100%;
  }

  .pagination {
    justify-content: center;

    :deep(.el-pagination) {
      justify-content: center;
    }
  }
}
</style>
