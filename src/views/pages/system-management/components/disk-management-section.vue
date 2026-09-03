<script setup lang="ts">
import { computed, ref } from 'vue'
import { Refresh, View } from '@element-plus/icons-vue'
import type { ColumnItem } from '@/components/custom-table.vue'
import type { SystemDiskDevice } from '@/api/modules'

interface Props {
  diskError: string
  diskLoading: boolean
  disks: SystemDiskDevice[]
  diskColumns: ColumnItem<SystemDiskDevice>[]
  rootMounts: SystemDiskDevice[]
  onRefresh: () => void
  onOpenDetail: (row: SystemDiskDevice) => void
  usagePercent: (row: SystemDiskDevice) => number
  formatBytes: (value?: number) => string
}

const props = defineProps<Props>()

const diskPage = ref(1)
const diskPageSize = ref(10)

const pagedDisks = computed(() => {
  const start = (diskPage.value - 1) * diskPageSize.value
  return props.disks.slice(start, start + diskPageSize.value)
})

const handleDiskPageSizeChange = (size: number) => {
  diskPageSize.value = size
  diskPage.value = 1
}

const handleDiskPageChange = (page: number) => {
  diskPage.value = page
}

const handleDiskRefresh = () => {
  diskPage.value = 1
  props.onRefresh()
}
</script>

<template>
  <article class="system-card">
    <div class="section-heading">
      <div>
        <h2>{{ $t('systemManagement.diskManagement') }}</h2>
        <p>{{ $t('systemManagement.diskDescription') }}</p>
      </div>
      <el-button :icon="Refresh" @click="handleDiskRefresh">{{ $t('systemManagement.refreshDisks') }}</el-button>
    </div>

    <el-alert v-if="diskError" type="error" :closable="false" show-icon>
      <template #title>{{ diskError }}</template>
    </el-alert>

    <div class="disk-protection">
      <span class="disk-protection__title">{{ $t('systemManagement.protectedMounts') }}</span>
      <div class="disk-protection__list">
        <el-tag v-for="item in rootMounts" :key="`${item.device}-${item.mountpoint}`" effect="light" type="warning">
          {{ item.mountpoint }}
        </el-tag>
        <span v-if="!rootMounts.length">{{ $t('systemManagement.noKeyMounts') }}</span>
      </div>
      <small>{{ $t('systemManagement.protectedMountsHint') }}</small>
    </div>

    <custom-table
      v-loading="diskLoading"
      :data="pagedDisks"
      :columns="diskColumns"
      :pagination="false"
      :auto-pagination="false"
      class="data-table"
      :empty-text="$t('systemManagement.noDiskData')"
    >
      <template #capacityUsage="{ row }">
        <div class="usage-cell">
          <el-progress :percentage="usagePercent(row)" :stroke-width="8" />
          <span>{{ formatBytes(row.usedBytes) }} / {{ formatBytes(row.totalBytes) }}</span>
        </div>
      </template>
      <template #persistent="{ row }">
        <el-tag :type="row.persistent ? 'success' : 'info'" effect="light">
          {{ row.persistent ? $t('systemManagement.writtenFstab') : $t('systemManagement.unmatchedFstab') }}
        </el-tag>
      </template>
      <template #actionColumn="{ row }">
        <el-button link type="primary" :icon="View" @click="onOpenDetail(row)">{{ $t('common.detail') }}</el-button>
      </template>
    </custom-table>

    <div v-if="disks.length" class="table-footer">
      <span>{{ $t('systemManagement.totalDisks', { count: disks.length }) }}</span>
      <el-pagination
        v-model:current-page="diskPage"
        v-model:page-size="diskPageSize"
        layout="total, sizes, prev, pager, next"
        :total="disks.length"
        :page-sizes="[10, 20, 50]"
        @current-change="handleDiskPageChange"
        @size-change="handleDiskPageSizeChange"
      />
    </div>
  </article>
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
.usage-cell {
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

.disk-protection {
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--surface-base);
  border: 1px solid var(--border-subtle);
}

.disk-protection__title {
  display: block;
  margin-bottom: 10px;
  color: var(--text-primary);
  font-weight: 600;
}

.disk-protection__list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--text-secondary);
}

.disk-protection small {
  display: block;
  margin-top: 10px;
  color: var(--text-tertiary);
  line-height: 1.6;
}

.data-table {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 18px;
  min-height: 34px;
}

.table-footer :deep(.el-pagination) {
  --el-pagination-bg-color: transparent;
  --el-pagination-button-bg-color: rgba(255, 255, 255, 0.03);
  --el-pagination-button-disabled-bg-color: rgba(255, 255, 255, 0.02);
  --el-pagination-hover-color: rgb(var(--primary-color));
  --el-pagination-text-color: var(--text-secondary);
}

.usage-cell {
  flex-direction: column;
  gap: 8px;

  span {
    color: var(--text-secondary);
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
