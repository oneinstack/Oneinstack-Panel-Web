<script setup lang="ts">
import i18n from '@/lang'

const props = withDefaults(defineProps<{
  currentPage: number
  pageSize: number
  total: number
  pageSizes?: number[]
}>(), { pageSizes: () => [10, 20, 50] })

const emit = defineEmits<{
  (event: 'update:currentPage', value: number): void
  (event: 'update:pageSize', value: number): void
  (event: 'current-change', value: number): void
  (event: 'size-change', value: number): void
}>()

const t = (key: string, params?: Record<string, unknown>) => (i18n.t as any)(`cluster.${key}`, params)

const changePage = (value: number) => {
  if (value === props.currentPage) return
  emit('update:currentPage', value)
  emit('current-change', value)
}

const changeSize = (value: number | string) => {
  const size = Number(value)
  if (!props.pageSizes.includes(size) || size === props.pageSize) return
  emit('update:currentPage', 1)
  emit('update:pageSize', size)
  emit('size-change', size)
}
</script>

<template>
  <div class="cluster-pagination">
    <span class="cluster-pagination-total">{{ t('totalItems', { count: total }) }}</span>
    <el-pagination class="cluster-pagination-pages" :current-page="currentPage" :page-size="pageSize" :total="total" :pager-count="5" layout="prev, pager, next" @current-change="changePage" />
    <el-select class="cluster-pagination-size" :model-value="pageSize" :aria-label="t('pageSize')" @change="changeSize">
      <el-option v-for="size in pageSizes" :key="size" :label="t('pageSizeOption', { count: size })" :value="size" />
    </el-select>
  </div>
</template>

<style scoped>
.cluster-pagination { display: grid; grid-template-columns: max-content max-content max-content; justify-content: end; align-items: center; gap: 12px; min-width: 0; padding-top: 12px; color: var(--text-tertiary); font-size: 13px; }
.cluster-pagination-total { white-space: nowrap; }
.cluster-pagination-pages { margin: 0; }
.cluster-pagination-size { width: 128px; }
@container cluster-content (max-width: 640px) {
  .cluster-pagination { grid-template-columns: max-content max-content; }
  .cluster-pagination-pages { grid-column: 1 / -1; grid-row: 2; justify-self: end; }
}
</style>
