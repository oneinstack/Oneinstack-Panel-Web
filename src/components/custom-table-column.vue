<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { ColumnItem } from '@/components/custom-table.vue'

defineOptions({ name: 'CustomTableColumn' })

const props = defineProps<{
  column: ColumnItem
  actionColumnProps: Set<string>
}>()

const slots = useSlots()

const childColumns = computed(() => props.column.children || props.column._children || [])
const slotName = computed(() => {
  if (props.column.slot) return props.column.slot
  const segments = props.column.prop?.split('.')
  return segments?.[segments.length - 1] || props.column.type || ''
})
const headerSlotName = computed(() => props.column.headerSlot || (slotName.value ? `${slotName.value}Header` : ''))
const resolvedClassName = computed(() => {
  const actionClass = props.column.prop && props.actionColumnProps.has(props.column.prop)
    ? 'table-action-column'
    : ''
  return [props.column.className, actionClass].filter(Boolean).join(' ')
})
const usesNativeCell = computed(() =>
  ['selection', 'index'].includes(props.column.type || '') &&
  !props.column.slot &&
  !props.column.formatter &&
  !props.column.tag &&
  childColumns.value.length === 0
)
const tableColumnProps = computed(() => {
  const {
    children,
    _children,
    enum: enumOptions,
    fieldNames,
    headerSlot,
    isShow,
    placeholder,
    slot,
    tag,
    ...columnProps
  } = props.column
  return columnProps
})

const getValue = (row: Record<string, any>, prop?: string) => {
  if (!prop) return undefined
  return prop.split('.').reduce((value, key) => value?.[key], row)
}

const formatValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') return props.column.placeholder ?? '--'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const cellValue = (scope: any) => {
  const value = getValue(scope.row, props.column.prop)
  return props.column.formatter
    ? props.column.formatter(scope.row, scope.column, value, scope.$index)
    : formatValue(value)
}

const tagLabel = (scope: any) => {
  const value = getValue(scope.row, props.column.prop)
  const labelKey = props.column.fieldNames?.label || 'label'
  const valueKey = props.column.fieldNames?.value || 'value'
  const option = props.column.enum?.find((item) => item[valueKey] === value)
  return option?.[labelKey] ?? formatValue(value)
}

const tagType = (scope: any) => {
  const value = getValue(scope.row, props.column.prop)
  const valueKey = props.column.fieldNames?.value || 'value'
  return props.column.enum?.find((item) => item[valueKey] === value)?.tagType
}
</script>

<template>
  <el-table-column
    v-if="column.isShow !== false && usesNativeCell"
    v-bind="tableColumnProps"
    :class-name="resolvedClassName"
    :show-overflow-tooltip="false"
  />

  <el-table-column
    v-else-if="column.isShow !== false && childColumns.length"
    v-bind="tableColumnProps"
    :class-name="resolvedClassName"
  >
    <template v-if="headerSlotName && slots[headerSlotName]" #header="scope">
      <slot :name="headerSlotName" v-bind="scope" />
    </template>
    <custom-table-column
      v-for="(child, index) in childColumns"
      :key="child.prop || child.type || index"
      :column="child"
      :action-column-props="actionColumnProps"
    />
  </el-table-column>

  <el-table-column
    v-else-if="column.isShow !== false"
    v-bind="tableColumnProps"
    :class-name="resolvedClassName"
    :show-overflow-tooltip="column.showOverflowTooltip ?? !column.slot"
  >
    <template v-if="headerSlotName && slots[headerSlotName]" #header="scope">
      <slot :name="headerSlotName" v-bind="scope" />
    </template>
    <template #default="scope">
      <slot v-if="slotName && slots[slotName]" :name="slotName" v-bind="scope" />
      <el-tag v-else-if="column.tag" :type="tagType(scope)">{{ tagLabel(scope) }}</el-tag>
      <div v-else class="custom-table-cell-ellipsis">{{ cellValue(scope) }}</div>
    </template>
  </el-table-column>
</template>

<style lang="less">
.custom-table-cell-ellipsis {
  max-width: 100%;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
