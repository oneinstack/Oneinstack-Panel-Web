<script setup lang="ts">
import { computed, ref } from 'vue'
import i18n from '@/lang'
import type { TableColumnCtx } from 'element-plus'
import CustomTableColumn from '@/components/custom-table-column.vue'

defineOptions({ inheritAttrs: false })

export interface ColumnItem<T = any> {
  label?: string
  prop?: string
  type?: 'selection' | 'index' | 'expand'
  width?: string | number
  minWidth?: string | number
  placeholder?: string
  align?: 'left' | 'center' | 'right'
  fixed?: boolean | 'left' | 'right'
  className?: string
  showOverflowTooltip?: boolean
  sortable?: boolean
  sortMethod?: (a: any, b: any) => number
  formatter?: (row: T, column?: TableColumnCtx<T>, cellValue?: any, index?: number) => any
  slot?: string
  headerSlot?: string
  isShow?: boolean
  tag?: boolean
  enum?: Array<Record<string, any>>
  fieldNames?: { label?: string; value?: string }
  children?: ColumnItem<T>[]
  _children?: ColumnItem<T>[]
  selectable?: (row: T, index: number) => boolean
  reserveSelection?: boolean
  [key: string]: any
}

interface Props {
  loading?: boolean
  selection?: boolean
  selectionChange?: (newSelection: any[]) => void
  page?: number
  pageSize?: number
  pageSizes?: number[]
  pagination?: boolean
  autoPagination?: boolean
  total?: number
  emptyText?: string
  columns?: ColumnItem[]
  data?: any[]
}

interface Emits {
  (e: 'update:page', page: number): void
  (e: 'update:pageSize', pageSize: number): void
  (e: 'selection-change', selection: any[]): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selection: false,
  page: 1,
  pageSize: 10,
  pageSizes: () => [10, 20, 50, 100],
  pagination: true,
  total: 0,
  autoPagination: true,
  data: () => [],
  columns: () => []
})

const emit = defineEmits<Emits>()
const actionColumnProps = new Set(['action', 'actions', 'actionColumn', 'operation', 'operations'])
const tableRef = ref<any>()
const schemaMode = computed(() => props.columns.length > 0)

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}

const handleSelectionChange = (selection: any[]) => {
  props.selectionChange?.(selection)
  emit('selection-change', selection)
}

const pageModel = computed({
  get: () => props.page,
  set: (page: number) => emit('update:page', page)
})
const pageSizeModel = computed({
  get: () => props.pageSize,
  set: (pageSize: number) => emit('update:pageSize', pageSize)
})
const paginationTotal = computed(() => (props.autoPagination ? props.data.length : props.total))
const visibleData = computed(() => {
  if (!schemaMode.value || !props.autoPagination) return props.data
  const start = (pageModel.value - 1) * pageSizeModel.value
  return props.data.slice(start, start + pageSizeModel.value)
})

defineExpose({
  clearSelection: () => tableRef.value?.clearSelection(),
  getSelectionRows: () => tableRef.value?.getSelectionRows?.() || [],
  scrollTo: (...args: any[]) => tableRef.value?.scrollTo?.(...args),
  setCurrentRow: (...args: any[]) => tableRef.value?.setCurrentRow?.(...args),
  setScrollLeft: (left: number) => tableRef.value?.setScrollLeft?.(left),
  setScrollTop: (top: number) => tableRef.value?.setScrollTop?.(top),
  toggleAllSelection: () => tableRef.value?.toggleAllSelection?.(),
  toggleRowExpansion: (...args: any[]) => tableRef.value?.toggleRowExpansion?.(...args),
  toggleRowSelection: (...args: any[]) => tableRef.value?.toggleRowSelection?.(...args),
  get $el() {
    return tableRef.value?.$el
  }
})
</script>

<template>
  <div v-loading="loading" class="table-content">
    <el-table
      ref="tableRef"
      v-bind="$attrs"
      :data="visibleData"
      class="smart-table"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      :empty-text="props.emptyText || t('common.noData', 'No data')"
    >
      <template #empty>
        <slot v-if="$slots.empty" name="empty" />
        <div v-else class="table-empty">
          <div class="table-empty__icon">[]</div>
          <strong>{{ props.emptyText || t('common.noData', 'No data') }}</strong>
          <p>{{ t('common.noDataDescription', 'No records match the current filters. Try adjusting search or filters.') }}</p>
        </div>
      </template>
      <slot v-if="!schemaMode" />
      <template v-else>
        <el-table-column v-if="selection" type="selection" width="55" />
        <custom-table-column
          v-for="(item, index) in columns"
          :key="item.prop || item.type || index"
          :column="item"
          :action-column-props="actionColumnProps"
        >
          <template v-for="(_, slotName) in $slots" #[slotName]="scope">
            <slot :name="slotName" v-bind="scope" />
          </template>
        </custom-table-column>
      </template>
    </el-table>
    <div v-if="schemaMode && pagination" class="pagination" :class="{ 'has-summary': Boolean($slots.summary) }">
      <div v-if="$slots.summary" class="pagination__summary">
        <slot name="summary" />
      </div>
      <el-pagination
        v-model:current-page="pageModel"
        v-model:page-size="pageSizeModel"
        background
        layout="total, sizes, prev, pager, next"
        :total="paginationTotal"
        :page-sizes="pageSizes"
      />
    </div>
  </div>
</template>

<style scoped lang="less">
.table-content {
  width: 100%;
}

.pagination {
  padding-top: 16px;
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.pagination.has-summary {
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.pagination__summary {
  min-width: 0;
  color: var(--text-tertiary);
  font-size: 12px;
}

.table-empty {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
}

.table-empty__icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  color: rgb(var(--primary-color));
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(var(--primary-color), 0.12), rgba(var(--primary-color), 0.04));
}

.table-empty strong {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 680;
}

.table-empty p {
  margin: 0;
  font-size: 13px;
}

:deep(.smart-table) {
  --el-table-border-color: transparent;
  --el-table-row-hover-bg-color: rgba(var(--primary-color), 0.045);
  --el-table-header-bg-color: #f7f9fc;
  --el-table-bg-color: transparent;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(251, 252, 255, 0.98));
  box-shadow:
    inset 0 0 0 1px rgba(148, 163, 184, 0.14),
    0 10px 26px rgba(15, 23, 42, 0.04);
}

:deep(.smart-table th.el-table__cell) {
  height: 52px;
  padding: 0;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: linear-gradient(180deg, #f8fafc, #f5f7fb);
}

:deep(.smart-table td.el-table__cell) {
  height: 58px;
  padding: 0;
  border-bottom: 1px solid rgba(241, 245, 249, 0.95);
}

:deep(.smart-table .cell) {
  padding: 0 16px;
}

:deep(.smart-table .el-table__inner-wrapper::before) {
  display: none;
}

:deep(.smart-table .el-table__body tr:last-child td.el-table__cell) {
  border-bottom: none;
}

:deep(.smart-table .el-table__empty-block) {
  min-height: 240px;
  background: transparent;
}

:deep(.pagination .el-pagination.is-background .btn-next),
:deep(.pagination .el-pagination.is-background .btn-prev),
:deep(.pagination .el-pagination.is-background .el-pager li) {
  min-width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.95);
}

:deep(.pagination .el-pagination.is-background .el-pager li.is-active) {
  color: #fff;
  background: linear-gradient(135deg, rgb(var(--primary-color)), var(--primary-color-light));
  box-shadow: 0 10px 20px rgba(var(--primary-color), 0.2);
}

@media (max-width: 768px) {
  :deep(.smart-table .cell) {
    padding: 0 12px;
  }

  .table-empty {
    min-height: 180px;
  }

  .pagination {
    justify-content: center;
  }

  .pagination.has-summary {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
