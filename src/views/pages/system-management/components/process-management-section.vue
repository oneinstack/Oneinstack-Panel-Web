<script setup lang="ts">
import { Search, Refresh, View } from '@element-plus/icons-vue'
import type { ColumnItem } from '@/components/custom-table.vue'
import type { SystemProcessItem } from '@/api/modules'
import type { TagProps } from 'element-plus'

interface OptionItem {
  label: string
  value: string
}

interface ProcessFilters {
  keyword: string
  sort: string
  order: string
  page: number
  pageSize: number
}

interface Props {
  processError: string
  processLoading: boolean
  processFilters: ProcessFilters
  processSortOptions: OptionItem[]
  orderOptions: OptionItem[]
  processColumns: ColumnItem<SystemProcessItem>[]
  processes: SystemProcessItem[]
  processTotal: number
  onQuery: () => void
  onReset: () => void
  onRefresh: () => void
  onOpenDetail: (row: SystemProcessItem) => void
  onPageChange: () => void
  onPageSizeChange: () => void
  processStatusLabel: (status?: string) => string
  processStatusType: (status?: string) => TagProps['type']
  formatPercent: (value?: number, digits?: number) => string
  formatDateTime: (value?: number | string) => string
  formatBytes: (value?: number) => string
}

defineProps<Props>()
</script>

<template>
  <section class="system-card">
    <div class="section-heading">
      <div>
        <h2>{{ $t('systemManagement.processManagement') }}</h2>
        <p>{{ $t('systemManagement.processDescription') }}</p>
      </div>
      <el-button :icon="Refresh" @click="onRefresh">{{ $t('systemManagement.refreshProcesses') }}</el-button>
    </div>

    <el-alert v-if="processError" type="error" :closable="false" show-icon>
      <template #title>{{ processError }}</template>
    </el-alert>

    <div class="process-toolbar">
      <el-input
        v-model="processFilters.keyword"
        :placeholder="$t('systemManagement.processNamePlaceholder')"
        clearable
        @keyup.enter="onQuery"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="processFilters.sort" :placeholder="$t('systemManagement.sortFieldPlaceholder')">
        <el-option v-for="item in processSortOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="processFilters.order" :placeholder="$t('systemManagement.sortOrderPlaceholder')">
        <el-option v-for="item in orderOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" @click="onQuery">{{ $t('common.query') }}</el-button>
      <el-button @click="onReset">{{ $t('common.reset') }}</el-button>
    </div>

    <custom-table
      v-loading="processLoading"
      :data="processes"
      :columns="processColumns"
      :pagination="false"
      :auto-pagination="false"
      class="data-table process-table"
      :empty-text="$t('systemManagement.noProcessData')"
      @row-click="onOpenDetail"
    >
      <template #username="{ row }">{{ row.username || '--' }}</template>
      <template #status="{ row }">
        <el-tag :type="processStatusType(row.status)" effect="light">{{ processStatusLabel(row.status) }}</el-tag>
      </template>
      <template #cpuPercent="{ row }">{{ formatPercent(row.cpuPercent) }}</template>
      <template #memoryRss="{ row }">{{ formatBytes(row.memoryRss) }}</template>
      <template #createTime="{ row }">{{ formatDateTime(row.createTime) }}</template>
      <template #actionColumn="{ row }">
        <el-button plain type="primary" :icon="View" @click.stop="onOpenDetail(row)">{{ $t('common.detail') }}</el-button>
      </template>
    </custom-table>

    <div class="table-footer">
      <span>{{ $t('systemManagement.totalProcesses', { count: processTotal }) }}</span>
      <el-pagination
        v-model:current-page="processFilters.page"
        v-model:page-size="processFilters.pageSize"
        layout="total, sizes, prev, pager, next"
        :page-sizes="[10, 20, 50, 100]"
        :total="processTotal"
        @current-change="onPageChange"
        @size-change="onPageSizeChange"
      />
    </div>
  </section>
</template>

<style scoped lang="less">
.system-card {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: var(--surface-raised);
  box-shadow: var(--shadow-card);
}

.section-heading,
.process-toolbar,
.table-footer {
  display: flex;
  align-items: center;
}

.section-heading {
  justify-content: space-between;
  gap: 16px;

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 18px;
  }

  p {
    margin: 8px 0 0;
    color: var(--text-secondary);
    line-height: 1.7;
  }
}

.process-toolbar {
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.72);
  gap: 12px;
  flex-wrap: wrap;

  .el-input {
    width: 320px;
    max-width: 100%;
  }

  .el-select {
    width: 160px;
  }
}

.data-table {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
}

.process-table :deep(.el-table__row) {
  cursor: pointer;
}

.table-footer {
  padding-top: 2px;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
