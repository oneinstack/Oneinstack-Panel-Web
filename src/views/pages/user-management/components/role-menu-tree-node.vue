<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, Document, Folder, Operation } from '@element-plus/icons-vue'
import type { AccessMenuNode } from '@/api/modules/access'

const props = withDefaults(defineProps<{
  nodes: AccessMenuNode[]
  selectedCodes: string[]
  availableCodes?: Set<string>
  expandedKeys?: Set<string>
}>(), {
  expandedKeys: () => new Set<string>()
})

const emit = defineEmits<{
  (event: 'toggle', node: AccessMenuNode): void
  (event: 'toggle-expand', key: string): void
}>()

const selectedCodeSet = computed(() => new Set(props.selectedCodes))

const nodePermissionCodes = (node: AccessMenuNode) => {
  const buttonCode = node.type === 'button' && node.key.startsWith('button.')
    ? node.key.slice('button.'.length)
    : ''
  if (buttonCode && (!props.availableCodes || props.availableCodes.has(buttonCode))) return [buttonCode]

  return Array.from(new Set([
    ...(node.permissionCodes || []),
    ...(node.permissions || []).map((permission) => permission.code)
  ].filter((code) => Boolean(code) && (!props.availableCodes || props.availableCodes.has(code)))))
}

const descendantPermissionCodes = (node: AccessMenuNode): string[] => Array.from(new Set([
  ...nodePermissionCodes(node),
  ...(node.children || []).flatMap((child) => descendantPermissionCodes(child))
]))

const nodeState = (node: AccessMenuNode) => {
  const codes = node.type === 'directory'
    ? descendantPermissionCodes(node)
    : nodePermissionCodes(node)
  const selectedCount = codes.filter((code) => selectedCodeSet.value.has(code)).length
  return {
    checked: codes.length > 0 && selectedCount === codes.length,
    indeterminate: selectedCount > 0 && selectedCount < codes.length,
    disabled: codes.length === 0,
    codes
  }
}

const nodeIcon = (node: AccessMenuNode) => {
  if (node.type === 'directory') return Folder
  if (node.type === 'button') return Operation
  return Document
}

const isExpanded = (node: AccessMenuNode) => props.expandedKeys.has(node.key)
const nodeDisplayCode = (node: AccessMenuNode) =>
  node.type === 'button' ? nodePermissionCodes(node)[0] || node.key : node.key
</script>

<template>
  <div v-for="node in nodes" :key="node.key" class="role-menu-node" :data-menu-key="node.key">
    <div
      class="role-menu-node__row"
      :class="{
        'is-checked': nodeState(node).checked,
        'is-indeterminate': nodeState(node).indeterminate,
        'is-disabled': nodeState(node).disabled,
        'is-builtin': node.builtin
      }"
      @click="nodeState(node).disabled ? undefined : emit('toggle', node)"
    >
      <button
        v-if="node.children?.length"
        type="button"
        class="role-menu-node__expand"
        :class="{ 'is-expanded': isExpanded(node) }"
        :aria-label="isExpanded(node) ? 'Collapse menu' : 'Expand menu'"
        :aria-expanded="isExpanded(node)"
        @click.stop="emit('toggle-expand', node.key)"
      >
        <el-icon><ArrowRight /></el-icon>
      </button>
      <span v-else class="role-menu-node__expand-placeholder" aria-hidden="true" />

      <el-checkbox
        :model-value="nodeState(node).checked"
        :indeterminate="nodeState(node).indeterminate"
        :disabled="nodeState(node).disabled"
        @click.stop
        @change="emit('toggle', node)"
      />

      <el-icon class="role-menu-node__icon" :class="`is-${node.type}`" aria-hidden="true">
        <component :is="nodeIcon(node)" />
      </el-icon>

      <div class="role-menu-node__content">
        <div class="role-menu-node__title">
          <strong>{{ node.name }}</strong>
          <code>{{ nodeDisplayCode(node) }}</code>
        </div>
      </div>

    </div>

    <div v-if="node.children?.length && isExpanded(node)" class="role-menu-node__children">
      <role-menu-tree-node
        :nodes="node.children"
        :selected-codes="selectedCodes"
        :available-codes="availableCodes"
        :expanded-keys="expandedKeys"
        @toggle="emit('toggle', $event)"
        @toggle-expand="emit('toggle-expand', $event)"
      />
    </div>
  </div>
</template>

<style lang="less">
.role-menu-node__row {
  display: flex;
  align-items: center;
  min-height: 48px;
  gap: 9px;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.role-menu-node__row:hover {
  border-color: rgba(var(--primary-color), 0.22);
  background: color-mix(in srgb, var(--surface-hover) 82%, rgba(var(--primary-color), 0.08));
}

.role-menu-node__row.is-checked {
  border-color: rgba(var(--primary-color), 0.34);
  background: rgba(var(--primary-color), 0.09);
}

.role-menu-node__row.is-indeterminate {
  border-color: rgba(var(--warning-color), 0.3);
  background: rgba(var(--warning-color), 0.06);
}

.role-menu-node__row.is-disabled {
  cursor: default;
  opacity: 0.55;
}

.role-menu-node.is-located > .role-menu-node__row {
  border-color: rgb(var(--primary-color));
  box-shadow: 0 0 0 3px rgba(var(--primary-color), 0.14);
}

.role-menu-node__expand,
.role-menu-node__expand-placeholder {
  display: inline-flex;
  flex: 0 0 20px;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 24px;
}

.role-menu-node__expand {
  padding: 0;
  border: 0;
  color: var(--text-tertiary);
  background: transparent;
  cursor: pointer;
  transition: color 0.18s ease, transform 0.18s ease;
}

.role-menu-node__expand:hover {
  color: rgb(var(--primary-color));
}

.role-menu-node__expand .el-icon {
  transition: transform 0.18s ease;
}

.role-menu-node__expand.is-expanded .el-icon {
  transform: rotate(90deg);
}

.role-menu-node__row .el-checkbox {
  flex: 0 0 auto;
  height: auto;
  margin-right: 0;
}

.role-menu-node__row .el-checkbox__label {
  display: none;
}

.role-menu-node__icon {
  flex: 0 0 auto;
  color: rgb(var(--primary-color));
  font-size: 17px;
}

.role-menu-node__icon.is-directory {
  color: rgb(var(--warning-color));
}

.role-menu-node__icon.is-button {
  color: rgb(var(--success-color));
}

.role-menu-node__content {
  min-width: 0;
  flex: 1;
}

.role-menu-node__title {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.role-menu-node__title strong {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-menu-node__title code {
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-menu-node__children {
  margin-left: 29px;
  padding-left: 12px;
  border-left: 1px solid var(--border-subtle);
}
</style>
