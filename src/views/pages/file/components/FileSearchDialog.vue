<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Search, FolderOpened, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { Api } from '@/api/Api'
import { formatBytes } from '@/utils/fileSize'

const props = defineProps<{
  modelValue: boolean
  currentPath: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'navigate', path: string): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const state = reactive({
  loading: false,
  searched: false,
  query: '',
  scope: 'current' as 'current' | 'server',
  type: 'all' as 'all' | 'file' | 'dir',
  result: {
    items: [] as any[],
    total: 0,
    visited: 0,
    skipped: 0,
    truncated: false,
    searchedPath: '/'
  }
})

watch(
  () => props.modelValue,
  (opened) => {
    if (!opened) return
    state.searched = false
    state.result.items = []
    state.result.total = 0
  }
)

const searchPath = computed(() => (state.scope === 'server' ? '/' : props.currentPath || '/'))

const runSearch = async () => {
  const query = state.query.trim()
  if (!query) {
    ElMessage.warning('请输入文件或目录名称')
    return
  }
  state.loading = true
  try {
    const { data } = await Api.searchFiles({
      path: searchPath.value,
      query,
      type: state.type,
      maxResults: 200,
      maxDepth: 32
    })
    state.result = {
      items: data?.items ?? [],
      total: data?.total ?? 0,
      visited: data?.visited ?? 0,
      skipped: data?.skipped ?? 0,
      truncated: Boolean(data?.truncated),
      searchedPath: data?.searchedPath ?? searchPath.value
    }
    state.searched = true
  } finally {
    state.loading = false
  }
}

const openResult = (row: any) => {
  const path = row.isDir ? row.path : parentPath(row.path)
  emit('navigate', path)
  visible.value = false
}

const parentPath = (path: string) => {
  const parts = path.split('/').filter(Boolean)
  parts.pop()
  return parts.length ? `/${parts.join('/')}` : '/'
}

const displayTime = (value: string) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}
</script>

<template>
  <el-dialog v-model="visible" width="860px" class="file-search-dialog" destroy-on-close align-center>
    <template #header>
      <div class="dialog-heading">
        <div class="heading-icon"><el-icon><Search /></el-icon></div>
        <div>
          <h3>搜索服务器文件</h3>
          <p>按名称搜索，不读取文件内容；全盘搜索会跳过 proc、sys、dev 和 run。</p>
        </div>
      </div>
    </template>

    <div class="search-panel">
      <el-input
        v-model="state.query"
        size="large"
        clearable
        autofocus
        placeholder="输入文件名或目录名，例如 nginx.conf"
        @keyup.enter="runSearch"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
        <template #append>
          <el-button type="primary" :loading="state.loading" @click="runSearch">搜索</el-button>
        </template>
      </el-input>
      <div class="search-options">
        <el-segmented
          v-model="state.scope"
          :options="[
            { label: `当前目录 ${currentPath}`, value: 'current' },
            { label: '整个服务器', value: 'server' }
          ]"
        />
        <el-radio-group v-model="state.type">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="file">文件</el-radio-button>
          <el-radio-button value="dir">目录</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div v-loading="state.loading" class="result-panel">
      <div v-if="state.searched" class="result-summary">
        <span>找到 {{ state.result.total }} 项</span>
        <span class="summary-muted">
          已扫描 {{ state.result.visited }} 项
          <template v-if="state.result.skipped"> · 跳过 {{ state.result.skipped }} 个受限目录</template>
        </span>
        <el-tag v-if="state.result.truncated" type="warning" effect="plain">结果已截断</el-tag>
      </div>
      <el-scrollbar v-if="state.result.items.length" height="430px">
        <button
          v-for="item in state.result.items"
          :key="item.path"
          type="button"
          class="result-row"
          @dblclick="openResult(item)"
        >
          <div class="result-icon" :class="{ directory: item.isDir }">
            <el-icon><FolderOpened v-if="item.isDir" /><Document v-else /></el-icon>
          </div>
          <div class="result-main">
            <strong>{{ item.name }}</strong>
            <span>{{ item.path }}</span>
          </div>
          <div class="result-meta">
            <span>{{ item.isDir ? '目录' : formatBytes(item.size) }}</span>
            <span>{{ displayTime(item.modTime) }}</span>
          </div>
          <el-button type="primary" link @click.stop="openResult(item)">定位</el-button>
        </button>
      </el-scrollbar>
      <el-empty
        v-else-if="state.searched && !state.loading"
        :description="`在 ${state.result.searchedPath} 没有找到匹配项`"
      />
      <div v-else class="search-placeholder">
        <el-icon><Search /></el-icon>
        <span>输入名称后开始搜索</span>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped lang="less">
.dialog-heading {
  display: flex;
  align-items: center;
  gap: 14px;

  h3 {
    margin: 0 0 4px;
    color: var(--text-primary);
    font-size: 19px;
  }

  p {
    margin: 0;
    color: var(--text-tertiary);
    font-size: 13px;
  }
}

.heading-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.1);
  font-size: 20px;
}

.search-panel {
  padding: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--bg-card);
}

.search-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
}

.result-panel {
  min-height: 300px;
  margin-top: 16px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
}

.result-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13px;
}

.summary-muted {
  color: var(--text-tertiary);
}

.result-row {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 180px 52px;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 66px;
  padding: 10px 16px;
  border: 0;
  border-bottom: 1px solid var(--border-subtle);
  color: inherit;
  text-align: left;
  background: transparent;
  cursor: default;

  &:hover {
    background: rgba(var(--primary-color), 0.045);
  }
}

.result-icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 10px;
  color: #64748b;
  background: #f1f5f9;

  &.directory {
    color: #f59e0b;
    background: #fff7e8;
  }
}

.result-main,
.result-meta {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;

  span {
    overflow: hidden;
    color: var(--text-tertiary);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.result-meta {
  align-items: flex-end;
}

.search-placeholder {
  display: flex;
  min-height: 300px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  color: var(--text-tertiary);

  .el-icon {
    font-size: 34px;
  }
}

@media (max-width: 800px) {
  .search-options {
    align-items: stretch;
    flex-direction: column;
  }

  .result-row {
    grid-template-columns: 38px minmax(0, 1fr) 52px;
  }

  .result-meta {
    display: none;
  }
}
</style>
