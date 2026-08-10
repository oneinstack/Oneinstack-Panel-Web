<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Delete, Refresh, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/Api'
import { formatBytes } from '@/utils/fileSize'
import i18n from '@/lang'

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
const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

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
    await ElMessageBox.confirm(t('file.trashDialog.restoreConfirm', 'Restore to {path}? If a file with the same name already exists there, the system will refuse to overwrite it.', { path: row.originalPath }), t('file.trashDialog.restoreTitle', 'Restore file'), {
      type: 'info',
      confirmButtonText: t('file.trashDialog.restore', 'Restore'),
      cancelButtonText: t('common.cancel', 'Cancel')
    })
    await Api.restoreTrash({ id: row.id })
    ElMessage.success(t('file.trashDialog.restoreSuccess', 'Restored successfully'))
    emit('changed')
    await state.load()
  },
  remove: async (row: TrashEntry) => {
    await ElMessageBox.confirm(t('file.trashDialog.deleteConfirm', 'Permanently delete "{name}"? This action cannot be undone.', { name: row.name }), t('file.trashDialog.deleteTitle', 'Permanently delete'), {
      type: 'warning',
      confirmButtonText: t('file.trashDialog.deletePermanently', 'Permanently delete'),
      cancelButtonText: t('common.cancel', 'Cancel')
    })
    await Api.deleteTrashPermanently({ id: row.id })
    ElMessage.success(t('file.trashDialog.deleteSuccess', 'Permanently deleted'))
    await state.load()
  },
  empty: async () => {
    await ElMessageBox.confirm(t('file.trashDialog.emptyConfirm', 'Empty the trash? All files in it will be unrecoverable.'), t('file.trashDialog.emptyTitle', 'Empty trash'), {
      type: 'error',
      confirmButtonText: t('file.trashDialog.emptyConfirmButton', 'Empty trash'),
      cancelButtonText: t('common.cancel', 'Cancel')
    })
    await Api.emptyTrash()
    ElMessage.success(t('file.trashDialog.emptySuccess', 'Trash emptied'))
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
    :title="t('file.fileTrash', 'File trash')"
    width="min(1080px, 92vw)"
    append-to-body
    destroy-on-close
    class="trash-dialog"
  >
    <div class="trash-summary">
      <div class="summary-item">
        <span class="summary-label">{{ t('file.trashDialog.trashFiles', 'Trash files') }}</span>
        <strong>{{ state.items.length }}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-label">{{ t('file.trashDialog.used', 'Directory used') }}</span>
        <strong>{{ formatBytes(state.capacity?.usedBytes) }}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-label">{{ t('file.trashDialog.writable', 'Currently writable') }}</span>
        <strong>{{ formatBytes(state.capacity?.writableBytes) }}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-label">{{ t('file.trashDialog.retention', 'Auto retention') }}</span>
        <strong>{{ state.retentionDays ? t('file.trashDialog.days', '{days} days', { days: state.retentionDays }) : '-' }}</strong>
      </div>
    </div>

    <div class="trash-toolbar">
      <el-alert
        :title="t('file.trashDialog.tip', 'Deleted files enter the trash by default and are automatically cleaned after the retention period. Directory quota includes trash usage.')"
        type="info"
        show-icon
        :closable="false"
      />
      <div class="toolbar-actions">
        <el-button :icon="Refresh" :loading="state.loading" @click="state.load">{{ t('common.refresh', 'Refresh') }}</el-button>
        <el-button type="danger" plain :icon="Delete" :disabled="state.items.length === 0" @click="state.empty">
          {{ t('file.trashDialog.emptyTrash', 'Empty trash') }}
        </el-button>
      </div>
    </div>

    <el-table v-loading="state.loading" :data="state.items" row-key="id" height="480" :empty-text="t('file.trashDialog.emptyTable', 'Trash is empty')">
      <el-table-column :label="t('common.name', 'Name')" min-width="180">
        <template #default="{ row }">
          <div class="file-name">
            <v-s-icon :name="row.isDir ? 'folder' : 'txt'" size="22" />
            <span class="ellipsis">{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="originalPath" :label="t('file.trashDialog.originalPath', 'Original path')" min-width="260" show-overflow-tooltip />
      <el-table-column :label="t('common.size', 'Size')" width="110">
        <template #default="{ row }">{{ formatBytes(row.size) }}</template>
      </el-table-column>
      <el-table-column :label="t('file.trashDialog.deletedAt', 'Deleted at')" width="180">
        <template #default="{ row }">{{ formatTime(row.deletedAt) }}</template>
      </el-table-column>
      <el-table-column prop="deletedBy" :label="t('file.trashDialog.deletedBy', 'Deleted by')" width="120">
        <template #default="{ row }">{{ row.deletedBy || '-' }}</template>
      </el-table-column>
      <el-table-column :label="t('common.action', 'Action')" width="180" fixed="right" class-name="table-action-column">
        <template #default="{ row }">
          <el-button type="primary" link :icon="RefreshLeft" @click="state.restore(row)">{{ t('file.trashDialog.restore', 'Restore') }}</el-button>
          <el-button type="danger" link :icon="Delete" @click="state.remove(row)">{{ t('file.trashDialog.deletePermanently', 'Permanently delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <el-button @click="visible = false">{{ t('common.close', 'Close') }}</el-button>
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
