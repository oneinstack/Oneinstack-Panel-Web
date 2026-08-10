<script setup lang="ts">
import sapp from '@/sstore/sapp'
import { computed, reactive } from 'vue'
import i18n from '@/lang'

export interface ColumnItem {
  label: string
  prop: string
  width?: string | number
  minWidth?: string | number
  placeholder?: string
  formatter?: (row: any) => string
  sortable?: boolean
  sortMethod?: (a: any, b: any) => number
}

interface Props {
  loading?: boolean
  selection?: boolean
  selectionChange?: (newSelection: any[]) => void
  pageSize?: number
  autoPagination?: boolean
  total?: number
  emptyText?: string
  columns: ColumnItem[]
  data: any[]
}

interface Emits {
  (e: 'update:page', page: number): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selection: false,
  pageSize: 10,
  total: 0,
  autoPagination: true,
  data: () => [],
  columns: () => []
})

const emit = defineEmits<Emits>()

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}

const conf = reactive({
  total: computed(() => (props.autoPagination ? props.data.length : props.total)),
  page: 1,
  pageSize: props.pageSize,
  visibleData: computed<any>(() => props.data.slice((conf.page - 1) * conf.pageSize, conf.page * conf.pageSize)),
  handleCurrentChange: (page: number) => {
    conf.page = page
    emit('update:page', page)
  },
  contentRefs: [] as { [index: number]: HTMLElement }
})

</script>

<template>
  <div v-loading="loading" class="table-content">
    <el-table
      :data="autoPagination ? conf.visibleData : data"
      class="smart-table"
      style="width: 100%"
      @selection-change="selectionChange"
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
      <el-table-column v-if="selection" type="selection" width="55"/>
      <el-table-column
        v-for="(item, col) in columns"
        :key="item.prop"
        :prop="item.prop"
        :label="item.label"
        :width="item.width"
        :min-width="item.minWidth"
        :sortable="item.sortable"
        :sort-method="item.sortMethod"
      >
        <template #default="{ row, $index }">
          <slot v-if="$slots[item.prop]" :name="item.prop" :row="row" :index="$index" />
          <el-tooltip
            v-else
            :disabled="
              !(
                conf.contentRefs[$index * columns.length + col]?.scrollWidth >
                conf.contentRefs[$index * columns.length + col]?.offsetWidth
              )
            "
            :effect="sapp.theme === 'light' ? 'dark' : 'light'"
            :content="row[item.prop]?.toString()"
            placement="bottom"
          >
            <div
              :ref="(el) => (conf.contentRefs[$index * columns.length + col] = el as HTMLElement)"
              class="ellipsis"
              :style="{ width: item.width }"
            >
              {{ item.formatter ? item.formatter(row) : row[item.prop] ?? item?.placeholder }}
            </div>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination" :class="{ 'has-summary': Boolean($slots.summary) }">
      <div v-if="$slots.summary" class="pagination__summary">
        <slot name="summary" />
      </div>
      <el-pagination
        background
        layout="prev, pager, next"
        :total="conf.total"
        :page-size="conf.pageSize"
        @current-change="conf.handleCurrentChange"
      />
    </div>
  </div>
</template>

<style scoped lang="less">
.table-content {
  width: 100%;
}

.ellipsis {
  max-width: 100%;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
