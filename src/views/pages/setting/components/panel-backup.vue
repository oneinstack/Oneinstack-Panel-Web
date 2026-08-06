<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { Api } from '@/api/Api'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'

interface BackupInfo {
  id: string
  fileName: string
  createdAt: string
  panelVersion: string
  size: number
  sha256: string
  fileCount: number
  includesCertificates: boolean
  imported: boolean
}

interface RestoreStatus {
  state: string
  backupId?: string
  message?: string
  rollbackAttempted: boolean
  rollbackSucceeded: boolean
  startedAt?: string
  updatedAt: string
  finishedAt?: string
}

type DialogMode = 'create' | 'import' | 'restore'

const backups = ref<BackupInfo[]>([])
const status = ref<RestoreStatus>({
  state: 'idle',
  rollbackAttempted: false,
  rollbackSucceeded: false,
  updatedAt: ''
})
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('create')
const selectedBackup = ref<BackupInfo>()
const importFile = ref<File>()
let reconnectTimer: number | undefined

const form = reactive({
  passphrase: '',
  confirmPassphrase: '',
  confirmation: '',
  includeCertificates: true
})

const stateNames: Record<string, string> = {
  idle: '未执行恢复',
  validating: '恢复预检',
  stopping: '停止服务',
  restoring: '恢复数据',
  health_checking: '健康检查',
  succeeded: '恢复成功',
  failed: '恢复失败',
  rolled_back: '已自动回滚',
  rollback_failed: '回滚失败'
}

const activeStates = ['validating', 'stopping', 'restoring', 'health_checking']
const restoreRunning = computed(() => activeStates.includes(status.value.state))
const statusType = computed(() => {
  if (status.value.state === 'succeeded') return 'success'
  if (status.value.state === 'rolled_back') return 'warning'
  if (status.value.state === 'failed' || status.value.state === 'rollback_failed') return 'danger'
  return 'info'
})
const dialogTitle = computed(() => {
  if (dialogMode.value === 'import') return '导入加密备份'
  if (dialogMode.value === 'restore') return `恢复备份 · ${selectedBackup.value?.panelVersion || '未知版本'}`
  return '创建 Panel 备份'
})

const apiURL = (path: string) => {
  const base = System.env.API || '/v1'
  return `${base.replace(/\/$/, '')}${path}`
}

const formatBytes = (value: number) => {
  if (!value) return '0 B'
  const units = ['B', 'KiB', 'MiB', 'GiB']
  let size = value
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

const loadData = async (quiet = false) => {
  if (!quiet) loading.value = true
  try {
    const [backupResponse, statusResponse] = await Promise.all([
      Api.getPanelBackups(),
      Api.getPanelRestoreStatus()
    ])
    backups.value = backupResponse.data?.backups || []
    status.value = statusResponse.data || status.value
  } finally {
    if (!quiet) loading.value = false
  }
}

const resetDialog = () => {
  form.passphrase = ''
  form.confirmPassphrase = ''
  form.confirmation = ''
  form.includeCertificates = true
  importFile.value = undefined
  selectedBackup.value = undefined
}

const openDialog = (mode: DialogMode, backup?: BackupInfo) => {
  resetDialog()
  dialogMode.value = mode
  selectedBackup.value = backup
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  resetDialog()
}

const dialogConfirmText = computed(() => {
  if (dialogMode.value === 'restore') return '预检并恢复'
  if (dialogMode.value === 'import') return '校验并导入'
  return '创建备份'
})

const selectImportFile = (event: Event) => {
  const input = event.target as HTMLInputElement
  importFile.value = input.files?.[0]
}

const validatePassphrase = () => {
  const length = new TextEncoder().encode(form.passphrase).length
  if (length < 12 || length > 256) {
    ElMessage.warning('备份密码需要包含 12–256 个字节')
    return false
  }
  return true
}

const parseFetchError = async (response: Response) => {
  try {
    const body = await response.json()
    return body?.message || body?.error?.message || `请求失败（${response.status}）`
  } catch {
    return `请求失败（${response.status}）`
  }
}

const importBackup = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择 .onebak 备份文件')
    return
  }
  if (!importFile.value.name.toLowerCase().endsWith('.onebak')) {
    ElMessage.warning('仅支持 .onebak 备份文件')
    return
  }
  const payload = new FormData()
  payload.append('passphrase', form.passphrase)
  payload.append('backup', importFile.value)
  const response = await fetch(apiURL('/sys/backups/import'), {
    method: 'POST',
    body: payload,
    credentials: 'same-origin',
    headers: { Accept: 'application/json' }
  })
  if (!response.ok) throw new Error(await parseFetchError(response))
  const body = await response.json()
  if (body?.code !== 0) throw new Error(body?.message || '导入备份失败')
}

const submitDialog = async () => {
  if (!validatePassphrase() || submitting.value) return
  if (dialogMode.value === 'create' && form.passphrase !== form.confirmPassphrase) {
    ElMessage.warning('两次输入的备份密码不一致')
    return
  }
  if (dialogMode.value === 'restore' && form.confirmation !== 'RESTORE PANEL') {
    ElMessage.warning('确认文本必须为 RESTORE PANEL')
    return
  }

  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await Api.createPanelBackup({
        passphrase: form.passphrase,
        includeCertificates: form.includeCertificates
      })
      ElMessage.success('加密备份创建成功')
    } else if (dialogMode.value === 'import') {
      await importBackup()
      ElMessage.success('备份已导入并通过完整性校验')
    } else if (selectedBackup.value) {
      await Api.preflightPanelBackup(selectedBackup.value.id, { passphrase: form.passphrase })
      await Api.restorePanelBackup(selectedBackup.value.id, {
        passphrase: form.passphrase,
        confirm: form.confirmation
      })
      ElMessage.success('恢复任务已启动，面板将短暂离线')
      beginReconnectPolling()
    }
    dialogVisible.value = false
    resetDialog()
    if (dialogMode.value !== 'restore') await loadData(true)
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const downloadBackup = async (backup: BackupInfo) => {
  const response = await fetch(apiURL(`/sys/backups/${encodeURIComponent(backup.id)}/download`), {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store'
  })
  if (!response.ok) {
    ElMessage.error(await parseFetchError(response))
    return
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = backup.fileName
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const deleteBackup = async (backup: BackupInfo) => {
  try {
    await ElMessageBox.confirm(
      `将永久删除 ${backup.fileName}。如果没有其他副本，删除后无法恢复。`,
      '删除备份',
      {
        type: 'warning',
        confirmButtonText: '永久删除',
        cancelButtonText: '取消'
      }
    )
    await Api.deletePanelBackup(backup.id)
    ElMessage.success('备份已删除')
    await loadData(true)
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error('删除备份失败')
  }
}

const beginReconnectPolling = () => {
  if (reconnectTimer) window.clearTimeout(reconnectTimer)
  const poll = async () => {
    try {
      const response = await fetch(apiURL('/sys/restore/status'), {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      })
      if (response.status === 401) {
        ElMessage.warning('恢复后的数据库未保留当前会话，请重新登录后查看恢复结果')
        sconfig.logout(true)
        return
      }
      if (response.ok) {
        const body = await response.json()
        if (body?.code === 0 && body?.data) {
          status.value = body.data
          if (!activeStates.includes(status.value.state)) {
            ElMessage.success(
              status.value.state === 'succeeded'
                ? 'Panel 数据恢复完成'
                : status.value.message || '恢复任务已结束'
            )
            await loadData(true)
            return
          }
        }
      }
    } catch {
      // 恢复期间主服务会短暂不可访问，继续静默重连。
    }
    reconnectTimer = window.setTimeout(poll, 2500)
  }
  reconnectTimer = window.setTimeout(poll, 3000)
}

onMounted(() => {
  loadData().then(() => {
    if (restoreRunning.value) beginReconnectPolling()
  })
})

onBeforeUnmount(() => {
  if (reconnectTimer) window.clearTimeout(reconnectTimer)
})
</script>

<template>
  <section class="backup-card" v-loading="loading">
    <div class="backup-card__header">
      <div>
        <div class="backup-card__title">配置与数据备份</div>
        <div class="backup-card__subtitle">
          加密保存 Panel 配置、SQLite 数据、实例身份、更新信任状态和可选证书
        </div>
      </div>
      <div class="backup-card__actions">
        <el-button :disabled="restoreRunning" @click="openDialog('import')">导入备份</el-button>
        <el-button type="primary" :disabled="restoreRunning" @click="openDialog('create')">
          创建备份
        </el-button>
      </div>
    </div>

    <div class="restore-status" :class="`is-${statusType}`">
      <div>
        <span class="restore-status__label">最近恢复状态</span>
        <strong>{{ stateNames[status.state] || status.state }}</strong>
        <small v-if="status.message">{{ status.message }}</small>
      </div>
      <el-tag :type="statusType">{{ restoreRunning ? '任务执行中' : '当前无恢复任务' }}</el-tag>
    </div>

    <div v-if="backups.length" class="backup-list">
      <article v-for="backup in backups" :key="backup.id" class="backup-item">
        <div class="backup-item__main">
          <div class="backup-item__icon">B</div>
          <div class="backup-item__identity">
            <div class="backup-item__name">
              {{ backup.fileName }}
              <el-tag v-if="backup.imported" size="small" type="info">已导入</el-tag>
              <el-tag v-if="backup.includesCertificates" size="small" type="success">含证书</el-tag>
            </div>
            <div class="backup-item__meta">
              Panel {{ backup.panelVersion }} · {{ formatBytes(backup.size) }} ·
              {{ backup.fileCount }} 个文件 · {{ formatDate(backup.createdAt) }}
            </div>
            <div class="backup-item__digest">SHA-256 {{ backup.sha256 }}</div>
          </div>
        </div>
        <div class="backup-item__actions">
          <el-button link @click="downloadBackup(backup)">下载</el-button>
          <el-button link type="primary" :disabled="restoreRunning" @click="openDialog('restore', backup)">
            恢复
          </el-button>
          <el-button link type="danger" :disabled="restoreRunning" @click="deleteBackup(backup)">
            删除
          </el-button>
        </div>
      </article>
    </div>
    <el-empty v-else description="尚未创建 Panel 备份" :image-size="86" />

    <custom-drawer
      :visible="dialogVisible"
      :title="dialogTitle"
      size="560px"
      :confirm-text="dialogConfirmText"
      :loading="submitting"
      destroy-on-close
      :on-close="closeDialog"
      :on-confirm="submitDialog"
    >
      <el-alert
        v-if="dialogMode === 'restore'"
        title="恢复会替换当前配置与数据库，期间 Panel 会短暂离线；健康检查失败时将自动回滚。"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form class="backup-form" label-position="top">
        <el-form-item v-if="dialogMode === 'import'" label="备份文件">
          <input class="file-input" type="file" accept=".onebak" @change="selectImportFile" />
        </el-form-item>
        <el-form-item label="备份加密密码">
          <el-input
            v-model="form.passphrase"
            type="password"
            show-password
            autocomplete="off"
            placeholder="12–256 个字节，密码不会写入日志"
          />
        </el-form-item>
        <el-form-item v-if="dialogMode === 'create'" label="再次输入密码">
          <el-input
            v-model="form.confirmPassphrase"
            type="password"
            show-password
            autocomplete="off"
            placeholder="再次输入备份密码"
          />
        </el-form-item>
        <el-form-item v-if="dialogMode === 'create'">
          <el-checkbox v-model="form.includeCertificates">同时备份 Panel 证书目录</el-checkbox>
        </el-form-item>
        <el-form-item v-if="dialogMode === 'restore'" label="操作确认">
          <el-input v-model="form.confirmation" autocomplete="off" placeholder="输入 RESTORE PANEL" />
        </el-form-item>
      </el-form>
    </custom-drawer>
  </section>
</template>

<style scoped lang="less">
.backup-card {
  padding-top: 28px;
  margin-top: 28px;
  border-top: 1px solid var(--border-subtle);
}

.backup-card__header,
.backup-card__actions,
.backup-item,
.backup-item__main,
.backup-item__actions,
.restore-status {
  display: flex;
  align-items: center;
}

.backup-card__header,
.backup-item,
.restore-status {
  justify-content: space-between;
}

.backup-card__header {
  gap: 20px;
}

.backup-card__actions,
.backup-item__actions {
  gap: 8px;
  flex-shrink: 0;
}

.backup-card__title {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 650;
}

.backup-card__subtitle {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.restore-status {
  gap: 16px;
  padding: 15px 18px;
  margin: 20px 0 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-subtle);

  span,
  strong,
  small {
    display: block;
  }

  strong {
    margin-top: 4px;
    color: var(--text-primary);
    font-size: 14px;
  }

  small {
    margin-top: 4px;
    color: var(--text-tertiary);
  }
}

.restore-status__label {
  color: var(--text-tertiary);
  font-size: 11px;
}

.backup-list {
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
}

.backup-item {
  gap: 20px;
  padding: 17px 18px;
  background: var(--surface-card);

  & + & {
    border-top: 1px solid var(--border-subtle);
  }
}

.backup-item__main {
  min-width: 0;
  gap: 14px;
}

.backup-item__icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border: 1px solid rgba(255, 106, 31, 0.2);
  border-radius: 11px;
  color: var(--el-color-primary);
  background: rgba(255, 106, 31, 0.08);
  font-weight: 700;
}

.backup-item__identity {
  min-width: 0;
}

.backup-item__name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  overflow-wrap: anywhere;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.backup-item__meta,
.backup-item__digest {
  margin-top: 5px;
  color: var(--text-tertiary);
  font-size: 11px;
}

.backup-item__digest {
  overflow: hidden;
  max-width: 560px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.backup-form {
  margin-top: 18px;
}

.file-input {
  width: 100%;
  padding: 10px;
  border: 1px dashed var(--border-subtle);
  border-radius: 8px;
  color: var(--text-secondary);
  background: var(--surface-subtle);
}

@media (max-width: 760px) {
  .backup-card__header,
  .backup-item,
  .restore-status {
    align-items: flex-start;
    flex-direction: column;
  }

  .backup-card__actions,
  .backup-item__actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
