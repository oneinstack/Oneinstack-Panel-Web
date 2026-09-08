<script setup lang="ts">
import CustomDrawer from '@/components/custom-drawer.vue'
import CustomTable, { type ColumnItem } from '@/components/custom-table.vue'
import {
  Api,
  type AccessMenuFeatureKey,
  type AccessMenuNode,
  type AccessMenuPayload,
  type AccessMenuTargetType,
  type AccessMenuType
} from '@/api/modules'
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, Delete, Edit, Plus } from '@element-plus/icons-vue'
import i18n from '@/lang'
import { useConfigStore } from '@/stores/modules/config'
import { hasOperationAccess, menuPathKeyMap } from '@/utils/access'

interface MenuEditorForm {
  key: string
  parentKey: string
  type: AccessMenuType
  name: string
  nameEn: string
  targetType: AccessMenuTargetType | ''
  targetKey: string
  iconKey: string
  sort: number
  enabled: boolean
  superAdminOnly: boolean
  featureKey: AccessMenuFeatureKey | ''
  permissionCodes: string[]
}

interface MenuTargetOption {
  label: string
  value: string
}

type MenuRow = AccessMenuNode & {
  depth: number
  hasChildren: boolean
}

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const sconfig = useConfigStore()
const loading = reactive({
  bootstrap: false,
  menuStatusKey: ''
})
const menus = ref<AccessMenuNode[]>([])
const expandedMenuKeys = ref<string[]>([])

const menuEditorDialog = reactive({
  show: false,
  loading: false,
  mode: 'create' as 'create' | 'edit',
  form: {
    key: '',
    parentKey: '',
    type: 'page' as AccessMenuType,
    name: '',
    nameEn: '',
    targetType: 'route' as AccessMenuTargetType | '',
    targetKey: '',
    iconKey: '',
    sort: 0,
    enabled: true,
    superAdminOnly: false,
    featureKey: '' as AccessMenuFeatureKey | '',
    permissionCodes: [] as string[]
  } as MenuEditorForm
})

const canManageMenus = computed(() => hasOperationAccess('userManagement', 'write', {
  actions: ['userManagement.write', 'menu.write', 'menu.status.write']
}))

const flattenMenuNodes = (nodes: AccessMenuNode[] = [], depth = 0): Array<AccessMenuNode & { depth: number }> =>
  nodes.flatMap((node) => {
    if (!node) return []
    const current = { ...node, depth }
    const children = node.children?.length ? flattenMenuNodes(node.children, depth + 1) : []
    return [current, ...children]
  })

const findMenuByKey = (nodes: AccessMenuNode[], key: string): AccessMenuNode | null => {
  for (const node of nodes || []) {
    if (node.key === key) return node
    if (node.children?.length) {
      const child = findMenuByKey(node.children, key)
      if (child) return child
    }
  }
  return null
}

const buildMenuTree = (nodes: AccessMenuNode[]) => {
  const flatNodes: AccessMenuNode[] = []
  const collectNodes = (items: AccessMenuNode[], inheritedParentKey?: string) => {
    items.forEach((node) => {
      if (!node?.key) return
      const { children, ...menu } = node
      flatNodes.push({
        ...menu,
        parentKey: menu.parentKey || inheritedParentKey,
        children: []
      })
      if (children?.length) collectNodes(children, node.key)
    })
  }

  collectNodes(nodes)
  const nodeMap = new Map(flatNodes.map((node) => [node.key, node]))
  const roots: AccessMenuNode[] = []
  flatNodes.forEach((node) => {
    const parent = node.parentKey && node.parentKey !== node.key ? nodeMap.get(node.parentKey) : undefined
    if (parent) parent.children!.push(node)
    else roots.push(node)
  })
  return roots
}

const menuTree = computed(() => buildMenuTree(menus.value || []))
const menuRows = computed(() => flattenMenuNodes(menuTree.value))
const visibleMenuRows = computed<MenuRow[]>(() => {
  const rows: MenuRow[] = []
  const appendVisibleRows = (nodes: AccessMenuNode[], depth = 0) => {
    nodes.forEach((node) => {
      if (!node) return
      const hasChildren = Boolean(node.children?.length)
      const { children, ...menu } = node
      rows.push({ ...menu, depth, hasChildren })
      if (children?.length && expandedMenuKeys.value.includes(node.key)) {
        appendVisibleRows(children, depth + 1)
      }
    })
  }
  appendVisibleRows(menuTree.value)
  return rows
})

const menuParentOptions = computed(() =>
  menuRows.value
    .filter((item) => item.type !== 'button' && item.key !== menuEditorDialog.form.key)
    .map((item) => ({
      label: `${'  '.repeat(item.depth)}${item.name}`,
      value: item.key
    }))
)
const menuTargetTypeOptions = computed<MenuTargetOption[]>(() => {
  if (menuEditorDialog.form.type === 'page') {
    return [{ label: t('userManagement.targetTypes.route', 'Route'), value: 'route' }]
  }
  if (menuEditorDialog.form.type === 'button') {
    return [{ label: t('userManagement.targetTypes.action', 'Action'), value: 'action' }]
  }
  return []
})
const routeTargetOptions = computed<MenuTargetOption[]>(() =>
  menuPathKeyMap.map((item) => ({
    label: `${item.path} - ${item.key}`,
    value: item.path
  }))
)
const actionTargetOptions = computed<MenuTargetOption[]>(() => {
  const parentKey = menuEditorDialog.form.parentKey.trim()
  const parent = parentKey ? findMenuByKey(menus.value, parentKey) : null
  const seen = new Set<string>()
  const options: MenuTargetOption[] = []
  ;(parent?.permissions || []).forEach((permission) => {
    const value = String(permission.code || permission.action || '').trim()
    if (!value || seen.has(value)) return
    seen.add(value)
    options.push({
      label: `${value} - ${permission.name || value}`,
      value
    })
  })
  return options.sort((left, right) => left.value.localeCompare(right.value))
})
const currentTargetOptions = computed(() => {
  const options = menuEditorDialog.form.targetType === 'route'
    ? routeTargetOptions.value
    : actionTargetOptions.value
  const current = menuEditorDialog.form.targetKey.trim()
  if (!current || options.some((option) => option.value === current)) return options
  return [{ label: `${current} - ${t('userManagement.currentTarget', 'Current value')}`, value: current }, ...options]
})

const menuColumns = computed<ColumnItem[]>(() => [
  { prop: 'key', label: t('userManagement.menuKey', 'Menu key'), minWidth: 240, className: 'menu-key-column' },
  { prop: 'name', label: t('userManagement.menuName', 'Menu name'), minWidth: 210, className: 'menu-name-column' },
  { prop: 'type', label: t('userManagement.menuType', 'Type'), width: 126, slot: 'type', align: 'center', className: 'menu-type-column' },
  { prop: 'target', label: t('userManagement.menuTarget', 'Target'), minWidth: 220, slot: 'target', className: 'menu-target-column' },
  { prop: 'permissionCodes', label: t('userManagement.menuPermissions', 'Permissions'), width: 140, slot: 'permissionCount', align: 'center' },
  { prop: 'enabled', label: t('common.status', 'Status'), width: 150, slot: 'enabled', align: 'center' },
  { prop: 'action', label: t('common.action', 'Action'), width: 230, fixed: 'right', slot: 'action' }
])

const menuTypeTagType = (type?: AccessMenuNode['type']) => {
  if (type === 'directory') return 'warning'
  if (type === 'button') return 'info'
  return 'primary'
}
const menuPermissionCount = (row: AccessMenuNode) => row.permissionCodes?.length || row.permissions?.length || 0
const canToggleMenuStatus = (menu?: AccessMenuNode | null) =>
  menu?.type === 'page' || menu?.type === 'directory'
const menuCellStyle = ({ column }: { column?: { property?: string } }) => {
  if (column?.property !== 'action') return undefined
  return { background: 'var(--surface-card)', backgroundColor: 'var(--surface-card)' }
}
const getMenuDescendantKeys = (menu: AccessMenuNode): string[] =>
  (menu.children || []).flatMap((child) => [child.key, ...getMenuDescendantKeys(child)])
const isMenuExpanded = (key: string) => expandedMenuKeys.value.includes(key)
const toggleMenuExpanded = (key: string) => {
  if (isMenuExpanded(key)) {
    const menu = findMenuByKey(menuTree.value, key)
    const keysToCollapse = new Set([key, ...(menu ? getMenuDescendantKeys(menu) : [])])
    expandedMenuKeys.value = expandedMenuKeys.value.filter((expandedKey) => !keysToCollapse.has(expandedKey))
    return
  }
  expandedMenuKeys.value = [...expandedMenuKeys.value, key]
}

const loadMenus = async () => {
  loading.bootstrap = true
  try {
    const response = await Api.getAccessMenus()
    menus.value = Array.isArray(response.data) ? response.data : []
  } finally {
    loading.bootstrap = false
  }
}
const refreshAccessMatrix = async () => {
  try {
    const response = await Api.getAccessMatrix()
    sconfig.setAccessMatrix(response?.data || {})
  } catch {
    // The next session refresh will rebuild the matrix if this request fails.
  }
}

const confirmMenuStatusChange = async (menu: AccessMenuNode) => {
  const key = String(menu?.key || '').trim()
  if (!key || !canToggleMenuStatus(menu) || !canManageMenus.value || loading.menuStatusKey) return false

  const enabled = menu.enabled === false
  try {
    await ElMessageBox.confirm(
      t(
        enabled ? 'userManagement.enableMenuConfirm' : 'userManagement.disableMenuConfirm',
        enabled ? 'Enable menu "{name}"?' : 'Disable menu "{name}"?',
        { name: menu.name || key }
      ),
      t(enabled ? 'userManagement.enableMenu' : 'userManagement.disableMenu', enabled ? 'Enable menu' : 'Disable menu'),
      {
        type: 'warning',
        confirmButtonText: t('common.confirm', 'Confirm'),
        cancelButtonText: t('common.cancel', 'Cancel')
      }
    )
    return true
  } catch {
    return false
  }
}
const updateMenuStatus = async (menu: AccessMenuNode, value: boolean | string | number) => {
  const key = String(menu?.key || '').trim()
  if (!key || !canToggleMenuStatus(menu) || !canManageMenus.value || loading.menuStatusKey) return

  const enabled = value === true || value === 'true' || value === 1 || value === '1'
  loading.menuStatusKey = key
  try {
    await Api.setAccessMenuStatus(key, enabled)
    ElMessage.success(enabled
      ? t('userManagement.enableMenuSuccess', 'Menu enabled')
      : t('userManagement.disableMenuSuccess', 'Menu disabled'))
    await Promise.all([loadMenus(), refreshAccessMatrix()])
  } catch (error: any) {
    // ElMessage.error(error?.message || t('userManagement.updateMenuStatusFailed', 'Failed to update menu status'))
    await loadMenus()
  } finally {
    loading.menuStatusKey = ''
  }
}

const resetMenuEditorForm = () => {
  menuEditorDialog.form.key = ''
  menuEditorDialog.form.parentKey = ''
  menuEditorDialog.form.type = 'page'
  menuEditorDialog.form.name = ''
  menuEditorDialog.form.nameEn = ''
  menuEditorDialog.form.targetType = 'route'
  menuEditorDialog.form.targetKey = ''
  menuEditorDialog.form.iconKey = ''
  menuEditorDialog.form.sort = 0
  menuEditorDialog.form.enabled = true
  menuEditorDialog.form.superAdminOnly = false
  menuEditorDialog.form.featureKey = ''
  menuEditorDialog.form.permissionCodes = []
}
const openMenuEditor = (menu?: AccessMenuNode | null) => {
  resetMenuEditorForm()
  menuEditorDialog.mode = menu ? 'edit' : 'create'
  menuEditorDialog.form.key = String(menu?.key || '').trim()
  menuEditorDialog.form.parentKey = String(menu?.parentKey || '').trim()
  menuEditorDialog.form.type = (menu?.type as AccessMenuType) || 'page'
  menuEditorDialog.form.name = menu?.name || ''
  menuEditorDialog.form.nameEn = menu?.nameEn || ''
  menuEditorDialog.form.targetType = (menu?.targetType as AccessMenuTargetType | '') || ''
  menuEditorDialog.form.targetKey = menu?.targetKey || ''
  menuEditorDialog.form.iconKey = menu?.iconKey || ''
  menuEditorDialog.form.sort = typeof menu?.sort === 'number' ? menu.sort : Number(menu?.sort || 0)
  menuEditorDialog.form.enabled = menu?.enabled !== false
  menuEditorDialog.form.superAdminOnly = Boolean(menu?.superAdminOnly)
  menuEditorDialog.form.featureKey = (menu?.featureKey as AccessMenuFeatureKey | '') || ''
  menuEditorDialog.form.permissionCodes = [
    ...(menu?.permissionCodes || menu?.permissions?.map((item) => item.code) || [])
  ]
  menuEditorDialog.show = true
}
const handleMenuTypeChange = (value: AccessMenuType) => {
  if (value === 'directory') {
    menuEditorDialog.form.targetType = ''
    menuEditorDialog.form.targetKey = ''
    menuEditorDialog.form.permissionCodes = []
    return
  }
  menuEditorDialog.form.targetType = value === 'button' ? 'action' : 'route'
  menuEditorDialog.form.targetKey = ''
}
const handleMenuParentChange = () => {
  if (menuEditorDialog.form.type === 'button') menuEditorDialog.form.targetKey = ''
}
const menuKeyPattern = /^[a-z][a-z0-9._-]*$/

const submitMenuEditor = async () => {
  if (!canManageMenus.value) return
  const key = menuEditorDialog.form.key.trim()
  const name = menuEditorDialog.form.name.trim()
  const nameEn = menuEditorDialog.form.nameEn.trim()
  const parentKey = menuEditorDialog.form.parentKey.trim()
  const targetKey = menuEditorDialog.form.targetKey.trim()
  const type = menuEditorDialog.form.type
  const targetType = menuEditorDialog.form.targetType
  const permissionCodes = [...new Set(menuEditorDialog.form.permissionCodes.map((item) => String(item).trim()).filter(Boolean))]

  if (menuEditorDialog.mode === 'create' && !key) {
    ElMessage.warning(t('userManagement.inputMenuKey', 'Enter a menu key'))
    return
  }
  if (key && !menuKeyPattern.test(key)) {
    ElMessage.warning(t('userManagement.menuKeyFormatError', 'Menu key must start with a lowercase letter and may contain lowercase letters, numbers, ".", "_" or "-"'))
    return
  }
  if (!name) {
    ElMessage.warning(t('userManagement.inputMenuName', 'Enter a menu name'))
    return
  }
  if (name.length > 96 || nameEn.length > 96) {
    ElMessage.warning(t('userManagement.menuNameMaxLength', 'Menu name cannot exceed 96 characters'))
    return
  }

  const parentNode = parentKey ? findMenuByKey(menus.value, parentKey) : null
  if (type === 'button' && !parentKey) {
    ElMessage.warning(t('userManagement.buttonParentRequired', 'Button nodes must be attached to a parent menu'))
    return
  }
  if (parentKey && (!parentNode || !['directory', 'page'].includes(parentNode.type))) {
    ElMessage.warning(t('userManagement.invalidMenuParent', 'Parent menu must be an existing directory or page'))
    return
  }

  if (type !== 'directory') {
    const expectedTargetType: AccessMenuTargetType = type === 'page' ? 'route' : 'action'
    if (targetType !== expectedTargetType || !targetKey) {
      ElMessage.warning(t('userManagement.inputMenuTargetKey', 'Enter a target key'))
      return
    }
    const allowedOptions = targetType === 'route' ? routeTargetOptions.value : actionTargetOptions.value
    if (!allowedOptions.some((option) => option.value === targetKey)) {
      ElMessage.warning(t('userManagement.menuTargetNotRegistered', 'Target must be selected from the backend registered targets'))
      return
    }
  }

  menuEditorDialog.loading = true
  try {
    const payload: AccessMenuPayload = {
      key,
      parentKey: parentKey || undefined,
      type,
      name,
      nameEn: nameEn || undefined,
      targetType: type === 'directory' ? undefined : targetType as AccessMenuTargetType,
      targetKey: type === 'directory' ? undefined : targetKey,
      iconKey: menuEditorDialog.form.iconKey || undefined,
      sort: Number(menuEditorDialog.form.sort || 0),
      enabled: type === 'button' ? true : menuEditorDialog.form.enabled,
      superAdminOnly: menuEditorDialog.form.superAdminOnly,
      featureKey: menuEditorDialog.form.featureKey || undefined,
      permissionCodes: type === 'directory' || !permissionCodes.length ? undefined : permissionCodes
    }
    if (menuEditorDialog.mode === 'create') {
      await Api.createAccessMenu(payload as AccessMenuPayload & { key: string })
      ElMessage.success(t('userManagement.createMenuSuccess', 'Menu created'))
    } else {
      await Api.updateAccessMenu(key, payload)
      ElMessage.success(t('userManagement.updateMenuSuccess', 'Menu updated'))
    }
    menuEditorDialog.show = false
    await Promise.all([loadMenus(), refreshAccessMatrix()])
  } finally {
    menuEditorDialog.loading = false
  }
}

const deleteMenu = async (menu: AccessMenuNode) => {
  const key = String(menu?.key || '').trim()
  if (!key) {
    ElMessage.warning(t('userManagement.invalidMenuKey', 'Invalid menu key'))
    return
  }
  if (menu.builtin) {
    ElMessage.warning(t('userManagement.cannotDeleteBuiltinMenu', 'Built-in menus cannot be deleted'))
    return
  }
  if (menu.children?.length) {
    ElMessage.warning(t('userManagement.menuHasChildren', 'Delete child menus first'))
    return
  }
  try {
    await ElMessageBox.confirm(
      t('userManagement.deleteMenuConfirm', 'Delete menu "{name}"? This action cannot be undone.', { name: menu.name || key }),
      t('userManagement.deleteMenu', 'Delete menu'),
      {
        type: 'warning',
        confirmButtonText: t('common.delete', 'Delete'),
        cancelButtonText: t('common.cancel', 'Cancel')
      }
    )
  } catch {
    return
  }
  await Api.deleteAccessMenu(key)
  ElMessage.success(t('userManagement.deleteMenuSuccess', 'Menu deleted'))
  await Promise.all([loadMenus(), refreshAccessMatrix()])
}

onMounted(() => {
  void loadMenus()
})
</script>

<template>
  <div v-loading="loading.bootstrap" class="menu-page">
    <section class="panel-card">
      <div class="panel-head">
        <div>
          <h2>{{ t('userManagement.menuRepositoryTitle', 'Menu repository') }}</h2>
          <p>{{ t('userManagement.menuRepositoryHint', 'Manage backend menu nodes and the permissions attached to them') }}</p>
        </div>
        <el-button type="primary" :icon="Plus" :disabled="!canManageMenus" @click="openMenuEditor()">
          {{ t('userManagement.createMenu', 'Create menu') }}
        </el-button>
      </div>

      <custom-table
        :data="visibleMenuRows"
        :columns="menuColumns"
        :pagination="false"
        :auto-pagination="false"
        border
        row-key="key"
        :tree-props="{ children: '__menuChildren__' }"
        :cell-style="menuCellStyle"
        class="menu-table"
        :empty-text="t('common.noData', 'No menus')"
      >
        <template #key="{ row }">
          <div
            class="menu-key-cell"
            :class="{ 'is-expandable': row.hasChildren }"
            :style="{ paddingLeft: `${row.depth * 24}px`, cursor: row.hasChildren ? 'pointer' : 'default' }"
            @click.stop="row.hasChildren && toggleMenuExpanded(row.key)"
          >
            <span class="menu-key-value" style="display: inline-flex; align-items: center; line-height: 24px;">
              <span class="menu-key-text" style="display: inline-flex; align-items: center; line-height: 24px;">{{ row.key }}</span>
              <button
                v-if="row.hasChildren"
                class="menu-expand-button"
                :class="{ 'is-expanded': isMenuExpanded(row.key) }"
                type="button"
                :aria-label="isMenuExpanded(row.key) ? 'Collapse menu' : 'Expand menu'"
                :aria-expanded="isMenuExpanded(row.key)"
                style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 24px; margin-left: 14px; padding: 0; line-height: 0;"
                @click.stop="toggleMenuExpanded(row.key)"
              >
                <el-icon
                  class="menu-expand-icon"
                  :style="{ transform: isMenuExpanded(row.key) ? 'rotate(90deg)' : 'rotate(0deg)' }"
                ><ArrowRight /></el-icon>
              </button>
            </span>
          </div>
        </template>
        <template #type="{ row }">
          <el-tag class="menu-type-tag" :type="menuTypeTagType(row.type)" effect="light" round>
            {{ t(`userManagement.menuTypes.${row.type}`, row.type) }}
          </el-tag>
        </template>
        <template #target="{ row }">
          <div class="menu-target">
            <span>{{ row.targetKey || '-' }}</span>
            <small v-if="row.targetType">{{ row.targetType }}</small>
          </div>
        </template>
        <template #permissionCount="{ row }">
          <el-tag class="permission-count-tag" type="primary" effect="light" round>
            {{ menuPermissionCount(row) }}
          </el-tag>
        </template>
        <template #enabled="{ row }">
          <el-switch
            v-if="canToggleMenuStatus(row)"
            :model-value="row.enabled !== false"
            :loading="loading.menuStatusKey === row.key"
            :disabled="!canManageMenus || Boolean(loading.menuStatusKey && loading.menuStatusKey !== row.key)"
            :before-change="() => confirmMenuStatusChange(row)"
            :aria-label="row.enabled === false ? t('userManagement.enableMenu', 'Enable menu') : t('userManagement.disableMenu', 'Disable menu')"
            @change="updateMenuStatus(row, $event)"
          />
          <span v-else class="menu-status-hint">-</span>
          <!-- <span v-else class="menu-status-hint">{{ t('userManagement.buttonStatusInherited', 'Inherited') }}</span> -->
        </template>
        <template #action="{ row }">
          <div class="table-row-actions">
            <el-button link type="primary" :icon="Edit" :disabled="!canManageMenus || row.builtin" @click="openMenuEditor(row)">
              {{ t('common.edit', 'Edit') }}
            </el-button>
            <el-button link type="danger" :icon="Delete" :disabled="!canManageMenus || row.builtin || Boolean(row.children?.length)" @click="deleteMenu(row)">
              {{ t('common.delete', 'Delete') }}
            </el-button>
          </div>
        </template>
      </custom-table>
    </section>

    <custom-drawer
      :visible="menuEditorDialog.show"
      :title="menuEditorDialog.mode === 'create' ? t('userManagement.createMenu', 'Create menu') : t('userManagement.editMenu', 'Edit menu')"
      size="980px"
      :confirm-text="$t('common.save')"
      :loading="menuEditorDialog.loading"
      :on-close="() => { menuEditorDialog.show = false }"
      :on-confirm="submitMenuEditor"
    >
      <div class="dialog-form">
        <el-alert
          :title="t('userManagement.menuFormTip', 'Target type and target key are validated against the backend contract.')"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />
        <el-form label-position="top" class="menu-editor-form">
          <el-form-item v-if="menuEditorDialog.mode === 'create'" :label="$t('userManagement.menuKey', 'Menu key')" required>
            <el-input v-model="menuEditorDialog.form.key" :placeholder="t('userManagement.inputMenuKey', 'Enter a menu key')" />
          </el-form-item>
          <el-form-item :label="$t('userManagement.menuName', 'Menu name')" required>
            <el-input v-model="menuEditorDialog.form.name" maxlength="96" show-word-limit :placeholder="t('userManagement.inputMenuName', 'Enter a menu name')" />
          </el-form-item>
          <el-form-item :label="$t('userManagement.menuNameEn', 'English name')">
            <el-input v-model="menuEditorDialog.form.nameEn" maxlength="96" show-word-limit :placeholder="t('userManagement.inputMenuNameEn', 'Enter an English name')" />
          </el-form-item>
          <el-form-item :label="$t('userManagement.menuParent', 'Parent menu')" :required="menuEditorDialog.form.type === 'button'">
            <el-select v-model="menuEditorDialog.form.parentKey" filterable clearable :placeholder="$t('common.select', 'Select')" @change="handleMenuParentChange">
              <el-option v-for="option in menuParentOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('userManagement.menuType', 'Type')" required>
            <el-segmented
              v-model="menuEditorDialog.form.type"
              class="menu-type-segmented"
              :options="[
                { label: t('userManagement.menuTypes.directory', 'Directory'), value: 'directory' },
                { label: t('userManagement.menuTypes.page', 'Page'), value: 'page' },
                { label: t('userManagement.menuTypes.button', 'Button'), value: 'button' }
              ]"
              @change="handleMenuTypeChange"
            />
          </el-form-item>
          <el-form-item v-if="menuEditorDialog.form.type !== 'directory'" :label="$t('userManagement.menuTargetType', 'Target type')" required>
            <el-select v-model="menuEditorDialog.form.targetType" :placeholder="$t('common.select', 'Select')">
              <el-option v-for="option in menuTargetTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="menuEditorDialog.form.type !== 'directory'" :label="$t('userManagement.menuTargetKey', 'Target key')" required>
            <el-select v-model="menuEditorDialog.form.targetKey" filterable :placeholder="t('userManagement.inputMenuTargetKey', 'Enter a target key')">
              <el-option v-for="option in currentTargetOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('userManagement.menuSort', 'Sort')">
            <el-input-number v-model="menuEditorDialog.form.sort" :min="0" :step="10" />
          </el-form-item>
          <el-form-item :label="$t('common.status', 'Status')">
            <el-switch v-if="menuEditorDialog.form.type !== 'button'" v-model="menuEditorDialog.form.enabled" />
            <span v-else class="menu-status-hint">-</span>
          </el-form-item>
          <el-form-item :label="$t('userManagement.superAdminOnly', 'Super admin only')">
            <el-switch v-model="menuEditorDialog.form.superAdminOnly" />
          </el-form-item>
        </el-form>
      </div>
    </custom-drawer>
  </div>
</template>

<style scoped lang="less">
.menu-page {
  padding-bottom: 32px;
}

.panel-card {
  padding: 24px;
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  background: var(--surface-card);
}

.panel-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 24px;
    font-weight: 740;
  }

  p {
    margin: 8px 0 0;
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.menu-table {
  width: 100%;
  --el-table-bg-color: var(--surface-card);
  --el-table-tr-bg-color: var(--surface-card);
  --el-table-row-hover-bg-color: color-mix(in srgb, var(--surface-hover) 78%, var(--surface-card));

  :deep(.el-table__inner-wrapper) {
    overflow: hidden;
    border: 1px solid var(--border-subtle);
    border-radius: 18px;
    background: var(--surface-card);
  }

  :deep(.el-table__header-wrapper th.el-table__cell) {
    height: 54px;
    padding: 0;
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    background: var(--surface-subtle);
    border-bottom: 1px solid var(--border-subtle);
  }

  :deep(.el-table__body-wrapper td.el-table__cell) {
    height: 62px;
    padding: 0;
    color: var(--text-secondary);
    background: var(--surface-card);
    border-bottom: 1px solid var(--border-subtle);
  }

  :deep(.el-table__body tr:hover > td.el-table__cell) {
    background: var(--el-table-row-hover-bg-color) !important;
  }

  :deep(.cell) {
    padding: 0 18px;
    line-height: 1.45;
  }

  :deep(.menu-key-column .cell) {
    display: flex;
    align-items: center;
    color: var(--text-primary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    font-weight: 650;
  }

  :deep(.menu-key-cell) {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  :deep(.menu-key-cell.is-expandable) {
    cursor: pointer;
  }

  :deep(.menu-key-cell.is-expandable .menu-key-value),
  :deep(.menu-key-cell.is-expandable .menu-key-text),
  :deep(.menu-key-cell.is-expandable .menu-expand-button),
  :deep(.menu-key-cell.is-expandable .menu-expand-icon) {
    cursor: pointer;
  }

  :deep(.menu-key-value) {
    display: inline-flex !important;
    align-items: center !important;
    height: 24px;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    line-height: 24px;
    white-space: nowrap;
  }

  :deep(.menu-key-text) {
    display: inline-flex;
    align-items: center;
    height: 24px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 24px;
    white-space: nowrap;
  }

  :deep(.menu-expand-button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 18px;
    width: 18px;
    height: 24px;
    margin-left: 14px !important;
    padding: 0;
    border: 0;
    align-self: center;
    line-height: 0;
    color: var(--text-tertiary);
    background: transparent;
    cursor: pointer;
  }

  :deep(.menu-expand-icon) {
    display: inline-flex;
    width: 14px;
    height: 14px;
    align-items: center;
    justify-content: center;
    line-height: 1;
    margin: 0;
    vertical-align: middle;
    transform-origin: center;
    transition: transform 0.2s ease;
  }

  :deep(.menu-name-column .cell) {
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 650;
  }

  :deep(.menu-type-column .cell),
  :deep(.menu-target-column .cell) {
    display: flex;
    align-items: center;
  }

  :deep(.menu-type-column .cell) {
    justify-content: center;
  }

  :deep(.menu-type-tag),
  :deep(.permission-count-tag) {
    min-width: 38px;
    justify-content: center;
    font-weight: 700;
  }
}

.menu-target {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 3px;

  span,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: var(--text-primary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
  }

  small {
    color: var(--text-tertiary);
    font-size: 11px;
    text-transform: uppercase;
  }
}

.table-row-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.menu-status-hint {
  color: var(--text-tertiary);
  font-size: 12px;
  white-space: nowrap;
}

.menu-editor-form {
  display: grid;
  gap: 4px;

  :deep(.el-select),
  :deep(.el-input-number) {
    width: 100%;
  }
}

.menu-editor-form :deep(.menu-type-segmented) {
  --el-segmented-color: var(--text-secondary);
  --el-segmented-bg-color: var(--surface-subtle);
  --el-segmented-item-selected-color: var(--primary-button-text);
  --el-segmented-item-selected-bg-color: rgb(var(--primary-color));
  border: 1px solid var(--border-default);
}

.dialog-form {
  padding-top: 6px;
}

@media (max-width: 640px) {
  .panel-card {
    padding: 18px;
  }

  .panel-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
