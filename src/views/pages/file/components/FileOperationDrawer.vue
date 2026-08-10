<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ArrowLeft, Refresh, Search } from '@element-plus/icons-vue'
import { Api } from '@/api/Api'
import i18n from '@/lang'

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

const displayTime = (value: string) =>
  value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-'
</script>

<template>
  <el-drawer
    v-model="visible"
    size="min(1180px, 94vw)"
    class="file-operation-drawer"
    destroy-on-close
    :show-close="false"
  >
    <template #header>
      <div class="drawer-heading">
        <button type="button" class="drawer-back" @click="visible = false">
          <el-icon><ArrowLeft /></el-icon>
          <span>{{ t('common.back', 'Back') }}</span>
        </button>
        <h3>{{ t('file.operations.title', 'File operation records') }}</h3>
      </div>
    </template>

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
        height="calc(100vh - 286px)"
        class="operation-table"
      >
        <el-table-column :label="t('common.time', 'Time')" min-width="158">
          <template #default="{ row }">{{ displayTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('common.action', 'Action')" min-width="170" class-name="operation-action-column">
          <template #default="{ row }">
            <el-tag class="action-tag" effect="plain">{{ actionLabels[row.action] || row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('file.operations.filePath', 'File path')" min-width="300" show-overflow-tooltip prop="path" />
        <el-table-column :label="t('file.operations.operator', 'Operator')" min-width="96">
          <template #default="{ row }">{{ row.username || t('file.operations.system', 'System') }}</template>
        </el-table-column>
        <el-table-column :label="t('file.operations.sourceIp', 'Source IP')" min-width="128" prop="remoteIp" />
        <el-table-column :label="t('file.operations.result', 'Result')" min-width="80">
          <template #default="{ row }">
            <el-tag class="result-tag" :type="row.outcome === 'success' ? 'success' : 'danger'" effect="light">
              {{ row.outcome === 'success' ? t('common.success', 'Success') : t('common.failed', 'Failed') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('file.operations.message', 'Description')" min-width="220" show-overflow-tooltip prop="message" />
      </custom-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="state.page"
          v-model:page-size="state.pageSize"
          :total="state.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="applyFilters"
        />
      </div>
    </div>
  </el-drawer>
</template>

<style scoped lang="less">
.drawer-heading {
  display: flex;
  align-items: center;
  gap: 24px;

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 20px;
    font-weight: 760;
    line-height: 1.2;
  }
}

.drawer-back {
  flex: 0 0 auto;
  min-height: 38px;
  padding: 0 20px 0 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-right: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  background: transparent;
  cursor: pointer;
  transition: color 0.18s ease;

  &:hover {
    color: rgb(var(--primary-color));
  }

  .el-icon {
    font-size: 18px;
  }

  span {
    font-size: 15px;
  }
}

.drawer-content {
  display: flex;
  height: 100%;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

:global(.file-operation-drawer .el-drawer__header) {
  min-height: 88px;
  margin: 0;
  padding: 0 36px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-card);
}

:global(.file-operation-drawer .el-drawer__body) {
  padding: 24px 28px 28px;
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
