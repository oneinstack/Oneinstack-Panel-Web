<script setup lang="ts">
import sapp from '@/sstore/sapp'
import { computed, reactive } from 'vue'

export interface ColumnItem {
  label: string
  prop: string
  width?: string | number
  align?: string
  placeholder?: string
  formatter?: (row: any) => string
  sortable?: boolean
  sortMethod?: (a: any, b: any) => number
}

interface Props {
  loading?: boolean
  selection?: boolean
  selectionChange?: (newSelection: any[]) => void
  pagination?: boolean
  pageSize?: number
  autoPagination?: boolean
  total?: number
  columns: ColumnItem[]
  data: any[]
}

interface Emits {
  (e: 'update:page', page: number): void
  (e: 'selection-change', selection: any[]): void  // 添加多选事件
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selection: true,
  pagination: true,
  pageSize: 10,
  total: 0,
  autoPagination: true,
  data: () => [],
  columns: () => []
})

const emit = defineEmits<Emits>()

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

const collectionHeaderCellClassName = (row:any) => {
  if(row.columnIndex != row.row.length -1){
    return {'border-right':'1px solid #8B8B8B30','text-align':'center'};
  }else{
    return {'text-align':'center'};
  }
}
// 添加处理选择变化的方法
const handleSelectionChange = (selection: any[]) => {
  emit('selection-change', selection)
}
</script>

<template>
  <div v-loading="loading" class="table-content">
    <el-table
      :data="autoPagination ? conf.visibleData : data"

      @selection-change="selectionChange"
	    empty-text="暂无数据"
    >
      <template #empty>
        <slot v-if="$slots.empty" name="empty" />
      </template>
      <el-table-column v-if="selection" type="selection" width="55" align="center"/>
      <el-table-column
        v-for="(item, col) in columns"
        :key="item.prop"
        :prop="item.prop"
        :label="item.label"
        :width="item.width"
        :align="item.align || 'left'"
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
              {{ item.formatter ? item.formatter(row) : row[item.prop] || item?.placeholder }}
            </div>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="pagination" class="pagination">
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
:deep(.hover-row:hover) {
  border-radius: 5px;
  td.el-table__cell {
    border-top: 1px solid var(--el-color-primary);
    border-bottom: 1px solid var(--el-color-primary);
    position: relative;
    z-index: 1;
  }
  td.el-table__cell:first-child {
    border-left: 1px solid var(--el-color-primary);
  }
  td.el-table__cell:last-child {
    border-right: 1px solid var(--el-color-primary);
  }
}
</style>
