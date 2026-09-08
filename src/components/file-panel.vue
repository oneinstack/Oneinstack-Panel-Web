<script setup lang="ts">
import { Api } from '@/api/modules'
import { Document, FolderOpened, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, reactive } from 'vue'
import i18n from '@/lang'

interface TreeNode {
  name: string
  path: string
  children?: TreeNode[]
  isDir?: boolean
}

interface Emits {
  (e: 'select', path: string): void
  (e: 'select-node', node: TreeNode): void
}

const props = withDefaults(defineProps<{ path?: string }>(), {
  path: '/'
})

const emit = defineEmits<Emits>()

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}

const treeProps = {
  label: 'name',
  children: 'children'
}

const state = reactive({
  loading: false,
  selectedPath: '/',
  treeData: [] as TreeNode[]
})

const normalizePath = (path?: string, parentPath = '/') => {
  const raw = String(path || '').trim()
  if (raw) return raw.startsWith('/') ? raw : `${parentPath === '/' ? '' : parentPath}/${raw}`
  return parentPath
}

const normalizeNodes = (items: any[], parentPath = '/'): TreeNode[] => {
  return items
    .filter(Boolean)
    .map((item) => {
      const name = String(item.name || item.label || item.path?.split('/').pop() || '/')
      const path = normalizePath(item.path, parentPath === '/' ? `/${name}` : `${parentPath}/${name}`)
      const isDir = Boolean(item.isDir ?? item.type === 'directory' ?? item.children?.length)
      return {
        name: path === '/' ? t('file.rootDir', 'Root directory') : name,
        path,
        isDir,
        children: normalizeNodes(item.children || item.dirs || item.directories || [], path)
      }
    })
}

const normalizeTreeData = (data: any): TreeNode[] => {
  const root = data?.tree || data?.directories || data?.dirs || data?.files || data
  const items = Array.isArray(root) ? root : [root].filter(Boolean)
  const nodes = normalizeNodes(items)
  if (nodes.length === 1 && nodes[0].path === '/') return nodes
  return [
    {
      name: t('file.rootDir', 'Root directory'),
      path: '/',
      isDir: true,
      children: nodes
    }
  ]
}

const selectPath = (path: string) => {
  state.selectedPath = path
  emit('select', path)
}

const selectNode = (node: TreeNode) => {
  selectPath(node.path)
  emit('select-node', node)
}

const loadTree = async () => {
  const queryPath = normalizePath(props.path || '/')
  state.loading = true
  try {
    const { data } = await Api.getFileTree({ path: queryPath })
    state.treeData = normalizeTreeData(data)
    if (!state.treeData.length) {
      state.treeData = [{ name: queryPath === '/' ? t('file.rootDir', 'Root directory') : queryPath.split('/').pop() || queryPath, path: queryPath, isDir: true, children: [] }]
    }
    selectPath(queryPath)
  } catch (error: any) {
    // ElMessage.error(error?.message || t('file.treeReadFailed', 'Failed to read directory tree'))
  } finally {
    state.loading = false
  }
}

onMounted(loadTree)

defineExpose({
  refresh: loadTree
})
</script>

<template>
  <div class="file-tree-panel">
    <div class="file-tree-panel__header">
      <span class="file-tree-panel__path">{{ state.selectedPath }}</span>
      <el-button :icon="Refresh" link @click="loadTree">{{ $t('common.refresh') }}</el-button>
    </div>
    <el-tree
      v-loading="state.loading"
      class="file-tree-panel__tree"
      :data="state.treeData"
      :props="treeProps"
      node-key="path"
      highlight-current
      default-expand-all
      :current-node-key="state.selectedPath"
      @node-click="(data: TreeNode) => selectNode(data)"
    >
      <template #default="{ data }">
        <div class="file-tree-panel__node" :class="{ 'is-file': !data.isDir }">
          <el-icon><component :is="data.isDir ? FolderOpened : Document" /></el-icon>
          <span>{{ data.name }}</span>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<style scoped lang="less">
.file-tree-panel {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.file-tree-panel__header {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--surface-subtle);

  :deep(.el-button) {
    flex: 0 0 auto;
    color: var(--text-tertiary);
    font-weight: 600;

    &:hover,
    &:focus-visible {
      color: rgb(var(--primary-color));
    }
  }
}

.file-tree-panel__path {
  min-width: 0;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-tree-panel__tree {
  flex: 1;
  min-height: 300px;
  max-height: calc(100vh - 400px);
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-card);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);

  :deep(.el-tree) {
    --el-fill-color-blank: transparent;
    --el-tree-node-hover-bg-color: rgba(var(--primary-color), 0.08);
    --el-tree-text-color: var(--text-secondary);
    --el-tree-expand-icon-color: var(--text-placeholder);
    background: transparent;
    color: var(--text-secondary);
  }

  :deep(.el-loading-mask) {
    background: color-mix(in srgb, var(--surface-card) 86%, transparent);
  }

  :deep(.el-loading-spinner .circular) {
    stroke: rgb(var(--primary-color));
  }
}

.file-tree-panel__node {
  min-height: 34px;
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 9px;
  padding-right: 10px;
  color: var(--text-secondary);

  .el-icon {
    flex: 0 0 auto;
    color: rgb(var(--primary-color));
    font-size: 15px;
  }

  span {
    overflow: hidden;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.is-file {
    color: var(--text-tertiary);

    .el-icon {
      color: var(--text-tertiary);
    }
  }
}

:deep(.el-tree-node__content) {
  height: 34px;
  border-radius: 8px;
  transition: background-color 0.18s ease, color 0.18s ease;
}

:deep(.el-tree-node__expand-icon) {
  padding: 7px 5px;
  color: var(--text-placeholder);
  font-size: 13px;
  transition: color 0.18s ease, transform 0.18s ease;
}

:deep(.el-tree-node__content:hover .el-tree-node__expand-icon) {
  color: rgb(var(--primary-color));
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.12) !important;
  box-shadow: inset 2px 0 0 rgb(var(--primary-color));
}

:deep(.el-tree-node.is-current > .el-tree-node__content .file-tree-panel__node) {
  color: rgb(var(--primary-color));
}

:deep(.el-tree-node.is-current > .el-tree-node__content .file-tree-panel__node .el-icon) {
  color: rgb(var(--primary-color));
}
</style>
