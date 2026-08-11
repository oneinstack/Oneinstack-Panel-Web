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
    ElMessage.error(error?.message || t('file.treeReadFailed', 'Failed to read directory tree'))
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
}

.file-tree-panel__node {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text-secondary);

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.is-file {
    color: var(--text-tertiary);
  }
}

:deep(.el-tree-node__content) {
  height: 34px;
  border-radius: 8px;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.08);
}
</style>
