<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Delete, Refresh, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/Api'
import { formatBytes } from '@/utils/fileSize'

interface TrashEntry {
  id: string
  originalPath: string
  name: string
  size: number
  isDir: boolean
  deletedAt: string
  deletedBy?: string
}

interface CapacityStatus {
  usedBytes: number
  quotaBytes: number
  diskAvailableBytes: number
  minFreeBytes: number
  writableBytes: number
  entryCount: number
}

const props = defineProps<{
  modelValue: boolean
}>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'changed'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const state = reactive({
  loading: false,
  items: [] as TrashEntry[],
  capacity: null as CapacityStatus | null,
  retentionDays: 0,
  load: async () => {
    state.loading = true
    try {
      const [{ data: trash }, { data: storage }] = await Promise.all([Api.getTrashList(), Api.getFileCapacity()])
      state.items = trash.items ?? []
      state.capacity = storage.capacity ?? null
      state.retentionDays = storage.trashRetentionDays ?? 0
    } finally {
      state.loading = false
    }
  },
  restore: async (row: TrashEntry) => {
    await ElMessageBox.confirm(`恢复到 ${row.originalPath}？如果原位置已有同名文件，系统会拒绝覆盖。`, '恢复文件', {
      type: 'info',
      confirmButtonText: '恢复',
      cancelButtonText: '取消'
    })
    await Api.restoreTrash({ id: row.id })
    ElMessage.success('恢复成功')
    emit('changed')
    await state.load()
  },
  remove: async (row: TrashEntry) => {
    await ElMessageBox.confirm(`彻底删除“${row.name}”？此操作无法恢复。`, '彻底删除', {
      type: 'warning',
      confirmButtonText: '彻底删除',
      cancelButtonText: '取消'
    })
    await Api.deleteTrashPermanently({ id: row.id })
    ElMessage.success('已彻底删除')
    await state.load()
  },
  empty: async () => {
    await ElMessageBox.confirm('确定清空回收站？其中的全部文件都将无法恢复。', '清空回收站', {
      type: 'error',
      confirmButtonText: '确认清空',
      cancelButtonText: '取消'
    })
    await Api.emptyTrash()
    ElMessage.success('回收站已清空')
    await state.load()
  }
})

const formatTime = (value: string) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) state.load()
  }
)
</script>

<template>
  <el-dialog
    v-model="visible"
    title="文件回收站"
    width="min(1080px, 92vw)"
    append-to-body
    destroy-on-close
    class="trash-dialog"
  >
    <div class="trash-summary">
      <div class="summary-item">
        <span class="summary-label">回收站文件</span>
        <strong>{{ state.items.length }}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-label">目录已用</span>
        <strong>{{ formatBytes(state.capacity?.usedBytes) }}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-label">当前可写</span>
        <strong>{{ formatBytes(state.capacity?.writableBytes) }}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-label">自动保留</span>
        <strong>{{ state.retentionDays ? `${state.retentionDays} 天` : '-' }}</strong>
      </div>
    </div>

    <div class="trash-toolbar">
      <el-alert
        :title="`删除的文件默认进入回收站，并在保留期结束后自动清理。目录配额包含回收站占用。`"
        type="info"
        show-icon
        :closable="false"
      />
      <div class="toolbar-actions">
        <el-button :icon="Refresh" :loading="state.loading" @click="state.load">刷新</el-button>
        <el-button type="danger" plain :icon="Delete" :disabled="state.items.length === 0" @click="state.empty">
          清空回收站
        </el-button>
      </div>
    </div>

    <el-table v-loading="state.loading" :data="state.items" row-key="id" height="480" empty-text="回收站为空">
      <el-table-column label="名称" min-width="180">
        <template #default="{ row }">
          <div class="file-name">
            <v-s-icon :name="row.isDir ? 'folder' : 'txt'" size="22" />
            <span class="ellipsis">{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="originalPath" label="原路径" min-width="260" show-overflow-tooltip />
      <el-table-column label="大小" width="110">
        <template #default="{ row }">{{ formatBytes(row.size) }}</template>
      </el-table-column>
      <el-table-column label="删除时间" width="180">
        <template #default="{ row }">{{ formatTime(row.deletedAt) }}</template>
      </el-table-column>
      <el-table-column prop="deletedBy" label="操作用户" width="120">
        <template #default="{ row }">{{ row.deletedBy || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link :icon="RefreshLeft" @click="state.restore(row)">恢复</el-button>
          <el-button type="danger" link :icon="Delete" @click="state.remove(row)">彻底删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.trash-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid rgb(var(--border-color-gray));
  border-radius: 8px;
  background: rgb(var(--bg-color-gray));

  strong {
    font-size: 20px;
    color: var(--font-color-black);
  }
}

.summary-label {
  font-size: 13px;
  color: var(--font-color-gray);
}

.trash-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  .el-alert {
    flex: 1;
  }
}

.toolbar-actions,
.file-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-name .ellipsis {
  max-width: 170px;
}

@media (max-width: 760px) {
  .trash-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .trash-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
