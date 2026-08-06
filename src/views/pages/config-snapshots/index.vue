<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Delete, Refresh, RefreshLeft, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/Api'
import sconfig from '@/sstore/sconfig'

type SnapshotResourceType = 'website' | 'nginx' | 'firewall' | 'panel_access'
type SnapshotStatus = 'pending' | 'applying' | 'succeeded' | 'failed' | 'rolled_back' | 'rollback_failed'

interface ConfigurationSnapshot {
  id: string
  resourceType: SnapshotResourceType
  resourceId: string
  operation: string
  status: SnapshotStatus
  beforeRevision?: string
  afterRevision?: string
  artifactSha256?: string
  taskId?: string
  requestedBy?: number
  failureMessage?: string
  createdAt?: string
  finishedAt?: string | null
}

interface SnapshotDiff {
  added?: string[]
  changed?: string[]
  removed?: string[]
  summary?: string
}

interface SnapshotDetail {
  snapshot?: ConfigurationSnapshot
  before?: unknown
  after?: unknown
  diff?: SnapshotDiff
}

interface RestorePreview {
  snapshot?: ConfigurationSnapshot
  current?: unknown
  target?: unknown
  diff?: SnapshotDiff
  hasDrift?: boolean
  requiresForce?: boolean
}

const loading = ref(false)
const detailLoading = ref(false)
const restoreLoading = ref(false)
const deletingId = ref('')
const snapshots = ref<ConfigurationSnapshot[]>([])
const total = ref(0)
const detailVisible = ref(false)
const detail = ref<SnapshotDetail | null>(null)
const restoreVisible = ref(false)
const restorePreview = ref<RestorePreview | null>(null)
const selectedSnapshot = ref<ConfigurationSnapshot | null>(null)

const filters = reactive({
  page: 1,
  pageSize: 20,
  resourceType: '' as '' | SnapshotResourceType,
  resourceId: '',
  status: '' as '' | SnapshotStatus
})

const resourceOptions = [
  { label: '全部资源', value: '' },
  { label: '网站配置', value: 'website' },
  { label: 'Nginx 配置', value: 'nginx' },
  { label: '防火墙规则', value: 'firewall' },
  { label: '面板访问', value: 'panel_access' }
]

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '应用中', value: 'applying' },
  { label: '成功', value: 'succeeded' },
  { label: '失败', value: 'failed' },
  { label: '已回滚', value: 'rolled_back' },
  { label: '回滚失败', value: 'rollback_failed' }
]

const canRead = computed(() =>
  sconfig.hasActionAccess('config.snapshot.read') ||
  Boolean((sconfig.scopeAccess as any)?.config?.snapshot?.read) ||
  Boolean((sconfig.scopeAccess as any)?.['config.snapshot']?.read)
)
const canWrite = computed(() =>
  sconfig.hasActionAccess('config.snapshot.write') ||
  Boolean((sconfig.scopeAccess as any)?.config?.snapshot?.write) ||
  Boolean((sconfig.scopeAccess as any)?.['config.snapshot']?.write)
)

const succeededCount = computed(() => snapshots.value.filter((item) => item.status === 'succeeded').length)
const failedCount = computed(() =>
  snapshots.value.filter((item) => ['failed', 'rollback_failed'].includes(item.status)).length
)
const restoreCount = computed(() => snapshots.value.filter((item) => item.operation === 'restore').length)

const resourceLabel = (value?: string) => ({
  website: '网站配置',
  nginx: 'Nginx 配置',
  firewall: '防火墙规则',
  panel_access: '面板访问'
}[value || ''] || value || '—')

const operationLabel = (value?: string) => ({
  create: '创建',
  update: '更新',
  delete: '删除',
  restore: '回滚'
}[value || ''] || value || '—')

const statusLabel = (value?: string) => ({
  pending: '待处理',
  applying: '应用中',
  succeeded: '成功',
  failed: '失败',
  rolled_back: '已回滚',
  rollback_failed: '回滚失败'
}[value || ''] || value || '—')

const statusType = (value?: string) => {
  if (value === 'succeeded' || value === 'rolled_back') return 'success'
  if (value === 'pending' || value === 'applying') return 'warning'
  if (value === 'failed' || value === 'rollback_failed') return 'danger'
  return 'info'
}

const formatTime = (value?: string | null) => value ? new Date(value).toLocaleString() : '—'
const formatJson = (value: unknown) => JSON.stringify(value ?? {}, null, 2)
const shortHash = (value?: string) => value ? value.replace(/^sha256:?/, '').slice(0, 12) : '—'

const diffCount = (diff?: SnapshotDiff) =>
  (diff?.added?.length || 0) + (diff?.changed?.length || 0) + (diff?.removed?.length || 0)

const buildParams = () => ({
  page: filters.page,
  pageSize: filters.pageSize,
  resourceType: filters.resourceType || undefined,
  resourceId: filters.resourceId.trim() || undefined,
  status: filters.status || undefined
})

const loadSnapshots = async () => {
  if (!canRead.value) return
  loading.value = true
  try {
    const { data } = await Api.getConfigurationSnapshots(buildParams())
    snapshots.value = data?.items || []
    total.value = data?.total || 0
    filters.page = data?.page || filters.page
    filters.pageSize = data?.pageSize || filters.pageSize
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.page = 1
  filters.resourceType = ''
  filters.resourceId = ''
  filters.status = ''
  void loadSnapshots()
}

const openDetail = async (row: ConfigurationSnapshot) => {
  detailVisible.value = true
  selectedSnapshot.value = row
  detail.value = null
  detailLoading.value = true
  try {
    const [detailResponse, diffResponse] = await Promise.all([
      Api.getConfigurationSnapshot(row.id),
      Api.getConfigurationSnapshotDiff(row.id).catch(() => ({ data: null }))
    ])
    detail.value = {
      ...detailResponse.data,
      diff: detailResponse.data?.diff || diffResponse.data?.diff || diffResponse.data
    }
  } finally {
    detailLoading.value = false
  }
}

const openRestore = async (row: ConfigurationSnapshot) => {
  selectedSnapshot.value = row
  restoreVisible.value = true
  restorePreview.value = null
  restoreLoading.value = true
  try {
    const { data } = await Api.previewConfigurationSnapshotRestore(row.id)
    restorePreview.value = data || {}
  } finally {
    restoreLoading.value = false
  }
}

const executeRestore = async () => {
  if (!selectedSnapshot.value || !restorePreview.value) return
  const force = Boolean(restorePreview.value.hasDrift || restorePreview.value.requiresForce)
  if (force) {
    await ElMessageBox.confirm(
      '检测到当前配置与快照生成后的状态存在差异。继续会用历史快照覆盖当前配置，是否确认强制回滚？',
      '强制回滚确认',
      {
        type: 'warning',
        confirmButtonText: '确认覆盖并回滚',
        cancelButtonText: '取消'
      }
    )
  } else {
    await ElMessageBox.confirm('确认回滚到该配置快照？回滚会创建新的 restore 快照记录。', '回滚配置', {
      type: 'warning',
      confirmButtonText: '确认回滚',
      cancelButtonText: '取消'
    })
  }
  restoreLoading.value = true
  try {
    await Api.restoreConfigurationSnapshot(selectedSnapshot.value.id, { force })
    ElMessage.success('回滚已执行')
    restoreVisible.value = false
    await loadSnapshots()
  } finally {
    restoreLoading.value = false
  }
}

const deleteSnapshot = async (row: ConfigurationSnapshot) => {
  await ElMessageBox.confirm(`删除快照 ${row.id}？活动中的快照不能删除。`, '删除配置快照', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
  deletingId.value = row.id
  try {
    await Api.deleteConfigurationSnapshot(row.id)
    ElMessage.success('快照已删除')
    await loadSnapshots()
  } finally {
    deletingId.value = ''
  }
}

onMounted(() => {
  void loadSnapshots()
})
</script>

<template>
  <div class="snapshot-page">
    <section class="snapshot-toolbar">
      <div>
        <h2>配置快照</h2>
        <p>查看网站、Nginx、防火墙和面板访问配置的快照差异，并在确认后安全回滚。</p>
      </div>
      <div class="toolbar-actions">
        <el-button :icon="Refresh" :loading="loading" @click="loadSnapshots">刷新</el-button>
      </div>
    </section>

    <el-alert
      v-if="!canRead"
      class="snapshot-alert"
      title="当前账号没有配置快照读取权限"
      type="warning"
      show-icon
      :closable="false"
    />

    <section class="summary-grid">
      <div class="summary-card">
        <small>当前页快照</small>
        <strong>{{ snapshots.length }}</strong>
      </div>
      <div class="summary-card">
        <small>全部记录</small>
        <strong>{{ total }}</strong>
      </div>
      <div class="summary-card success">
        <small>成功快照</small>
        <strong>{{ succeededCount }}</strong>
      </div>
      <div class="summary-card warning">
        <small>回滚记录</small>
        <strong>{{ restoreCount }}</strong>
      </div>
      <div class="summary-card danger">
        <small>失败记录</small>
        <strong>{{ failedCount }}</strong>
      </div>
    </section>

    <section class="snapshot-panel">
      <div class="filter-bar">
        <el-select v-model="filters.resourceType" placeholder="资源类型" clearable style="width: 170px">
          <el-option
            v-for="item in resourceOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input v-model="filters.resourceId" placeholder="资源 ID / 配置路径" clearable style="width: 220px" />
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 150px">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-button type="primary" @click="filters.page = 1; loadSnapshots()">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="snapshots" row-key="id" empty-text="暂无配置快照">
        <el-table-column label="资源" min-width="230">
          <template #default="{ row }">
            <div class="resource-cell">
              <strong>{{ resourceLabel(row.resourceType) }}</strong>
              <span>{{ row.resourceId || '—' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="动作" width="100">
          <template #default="{ row }">{{ operationLabel(row.operation) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="版本" min-width="210">
          <template #default="{ row }">
            <div class="revision-cell">
              <span>前 {{ shortHash(row.beforeRevision) }}</span>
              <span>后 {{ shortHash(row.afterRevision) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="制品摘要" width="150">
          <template #default="{ row }">{{ shortHash(row.artifactSha256) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="230">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="openDetail(row)">详情</el-button>
            <el-button
              link
              type="warning"
              :icon="RefreshLeft"
              :disabled="!canWrite || row.status !== 'succeeded'"
              @click="openRestore(row)"
            >
              回滚
            </el-button>
            <el-button
              link
              type="danger"
              :icon="Delete"
              :loading="deletingId === row.id"
              :disabled="!canWrite || row.status === 'pending' || row.status === 'applying'"
              @click="deleteSnapshot(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @size-change="() => { filters.page = 1; loadSnapshots() }"
          @current-change="loadSnapshots"
        />
      </div>
    </section>

    <el-dialog v-model="detailVisible" width="960px" :title="`快照详情 · ${selectedSnapshot?.id || ''}`">
      <div v-loading="detailLoading" class="snapshot-detail">
        <div class="diff-summary">
          <el-tag type="primary" effect="light">{{ detail?.diff?.summary || '暂无差异摘要' }}</el-tag>
          <span>变更字段 {{ diffCount(detail?.diff) }} 项</span>
        </div>
        <div class="diff-lists">
          <div><strong>新增</strong><span>{{ detail?.diff?.added?.join('，') || '无' }}</span></div>
          <div><strong>修改</strong><span>{{ detail?.diff?.changed?.join('，') || '无' }}</span></div>
          <div><strong>删除</strong><span>{{ detail?.diff?.removed?.join('，') || '无' }}</span></div>
        </div>
        <div class="json-grid">
          <section>
            <h4>变更前</h4>
            <pre>{{ formatJson(detail?.before) }}</pre>
          </section>
          <section>
            <h4>变更后</h4>
            <pre>{{ formatJson(detail?.after) }}</pre>
          </section>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="restoreVisible" width="960px" title="回滚预览">
      <div v-loading="restoreLoading" class="snapshot-detail">
        <el-alert
          v-if="restorePreview?.hasDrift || restorePreview?.requiresForce"
          title="检测到配置漂移，执行回滚需要强制覆盖当前配置"
          type="warning"
          show-icon
          :closable="false"
        />
        <div class="diff-summary">
          <el-tag :type="restorePreview?.hasDrift ? 'warning' : 'success'" effect="light">
            {{ restorePreview?.diff?.summary || '暂无回滚差异摘要' }}
          </el-tag>
          <span>变更字段 {{ diffCount(restorePreview?.diff) }} 项</span>
        </div>
        <div class="json-grid">
          <section>
            <h4>当前配置</h4>
            <pre>{{ formatJson(restorePreview?.current) }}</pre>
          </section>
          <section>
            <h4>目标配置</h4>
            <pre>{{ formatJson(restorePreview?.target) }}</pre>
          </section>
        </div>
      </div>
      <template #footer>
        <el-button @click="restoreVisible = false">取消</el-button>
        <el-button type="warning" :loading="restoreLoading" :disabled="!restorePreview" @click="executeRestore">
          {{ restorePreview?.hasDrift || restorePreview?.requiresForce ? '强制覆盖并回滚' : '确认回滚' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="less">
.snapshot-page {
  min-height: 100%;
}

.snapshot-toolbar,
.toolbar-actions,
.filter-bar,
.pagination-row,
.diff-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.snapshot-toolbar {
  justify-content: space-between;
  margin-bottom: 18px;

  h2 {
    color: var(--text-primary);
    font-size: 22px;
    font-weight: 720;
  }

  p {
    margin-top: 6px;
    color: var(--text-tertiary);
    font-size: 13px;
  }
}

.snapshot-alert {
  margin-bottom: 18px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.summary-card {
  min-height: 92px;
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);

  small {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 10px;
    color: var(--text-primary);
    font-size: 26px;
    font-weight: 760;
  }

  &.success strong {
    color: rgb(var(--success-color));
  }

  &.warning strong {
    color: var(--el-color-warning);
  }

  &.danger strong {
    color: var(--el-color-danger);
  }
}

.snapshot-panel {
  padding: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.filter-bar {
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.resource-cell,
.revision-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.pagination-row {
  justify-content: flex-end;
  margin-top: 16px;
}

.snapshot-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.diff-summary {
  justify-content: space-between;
  padding: 12px;
  border-radius: 10px;
  background: var(--surface-subtle);
  color: var(--text-tertiary);
}

.diff-lists {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  div {
    min-width: 0;
    padding: 12px;
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    background: var(--surface-card);
  }

  strong,
  span {
    display: block;
  }

  span {
    margin-top: 8px;
    color: var(--text-tertiary);
    word-break: break-all;
  }
}

.json-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  section {
    min-width: 0;
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    overflow: hidden;
  }

  h4 {
    margin: 0;
    padding: 10px 12px;
    background: var(--surface-subtle);
    color: var(--text-primary);
  }

  pre {
    min-height: 320px;
    max-height: 520px;
    margin: 0;
    padding: 12px;
    overflow: auto;
    background: #0b1220;
    color: #e5edf6;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

@media (max-width: 980px) {
  .snapshot-toolbar,
  .diff-summary {
    align-items: flex-start;
    flex-direction: column;
  }

  .summary-grid,
  .diff-lists,
  .json-grid {
    grid-template-columns: 1fr;
  }
}
</style>
