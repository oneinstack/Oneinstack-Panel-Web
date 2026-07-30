<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { Api } from '@/api/Api'

interface VersionInfo {
  version: string
  buildTime: string
  commitHash: string
  webVersion: string
  goVersion: string
  os: string
  arch: string
}

interface UpdateCheck {
  enabled: boolean
  source?: 'center' | 'manifest'
  instanceId?: string
  currentVersion: string
  latestVersion?: string
  updateAvailable: boolean
  channel: string
  publishedAt?: string
  releaseNotes?: string
  compatible: boolean
  artifactSize?: number
}

interface UpdateStatus {
  state: string
  currentVersion?: string
  targetVersion?: string
  message?: string
  backupPath?: string
  rollbackAttempted: boolean
  rollbackSucceeded: boolean
  startedAt?: string
  updatedAt?: string
  finishedAt?: string
}

const version = ref<VersionInfo>()
const check = ref<UpdateCheck>()
const status = ref<UpdateStatus>({ state: 'idle', rollbackAttempted: false, rollbackSucceeded: false })
const loading = ref(false)
const applying = ref(false)
let reconnectTimer: number | undefined

const stateNames: Record<string, string> = {
  idle: '未执行',
  checking: '检查更新',
  downloading: '下载并校验',
  preflight: '数据库迁移预检',
  switching: '切换版本',
  health_checking: '健康检查',
  succeeded: '更新成功',
  failed: '更新失败',
  rolled_back: '已自动回滚',
  rollback_failed: '回滚失败',
  recovery_required: '需要恢复'
}

const activeStates = ['checking', 'downloading', 'preflight', 'switching', 'health_checking']
const isRunning = computed(() => activeStates.includes(status.value.state) || applying.value)
const statusType = computed(() => {
  if (status.value.state === 'succeeded') return 'success'
  if (status.value.state === 'rolled_back') return 'warning'
  if (
    status.value.state === 'failed' ||
    status.value.state === 'rollback_failed' ||
    status.value.state === 'recovery_required'
  )
    return 'danger'
  return 'info'
})

const formatBytes = (value?: number) => {
  if (!value) return '—'
  return `${(value / 1024 / 1024).toFixed(1)} MiB`
}

const updateSource = computed(() => {
  if (check.value?.source === 'center') return 'OneinStack Center'
  if (check.value?.source === 'manifest') return '独立签名清单'
  return '尚未检查'
})

const maskedInstanceID = computed(() => {
  const value = check.value?.instanceId
  if (!value) return ''
  return `…${value.slice(-8)}`
})

const loadBaseState = async () => {
  const [versionResponse, statusResponse] = await Promise.all([
    Api.getPanelVersion(),
    Api.getPanelUpdateStatus()
  ])
  version.value = versionResponse.data
  status.value = statusResponse.data || status.value
}

const checkForUpdate = async () => {
  loading.value = true
  try {
    const { data } = await Api.checkPanelUpdate()
    check.value = data
    if (data.updateAvailable) {
      ElMessage.success(
        data.source === 'center'
          ? `Center 已为本机分配新版本 ${data.latestVersion}`
          : `发现新版本 ${data.latestVersion}`
      )
    } else {
      ElMessage.success('当前已经是最新版本')
    }
  } finally {
    loading.value = false
  }
}

const applyUpdate = async () => {
  if (!check.value?.updateAvailable || applying.value) return
  try {
    const { value } = await ElMessageBox.prompt(
      `将更新到 ${check.value.latestVersion}。更新期间面板会短暂离线，失败时自动恢复旧版本。请输入 UPDATE PANEL 继续。`,
      '更新面板',
      {
        type: 'warning',
        inputPlaceholder: 'UPDATE PANEL',
        inputValidator: (input) => input === 'UPDATE PANEL' || '确认文本不正确',
        confirmButtonText: '开始更新',
        cancelButtonText: '取消'
      }
    )
    applying.value = true
    await Api.applyPanelUpdate({ confirm: value })
    ElMessage.success('更新任务已启动，正在等待面板重新上线')
    beginReconnectPolling()
  } catch (error) {
    applying.value = false
    if (error !== 'cancel' && error !== 'close') {
      await loadBaseState().catch(() => undefined)
    }
  }
}

const beginReconnectPolling = () => {
  if (reconnectTimer) window.clearTimeout(reconnectTimer)
  const poll = async () => {
    try {
      const response = await fetch('/v1/sys/update/status', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      })
      if (response.ok) {
        const body = await response.json()
        if (body?.code === 0 && body?.data) {
          status.value = body.data
          if (!activeStates.includes(status.value.state)) {
            applying.value = false
            ElMessage.success(
              status.value.state === 'succeeded'
                ? '面板更新完成'
                : status.value.message || '面板更新已结束'
            )
            await loadBaseState()
            return
          }
        }
      }
    } catch {
      // 主服务切换期间连接失败是预期状态，保持静默并继续重连。
    }
    reconnectTimer = window.setTimeout(poll, 2500)
  }
  reconnectTimer = window.setTimeout(poll, 3000)
}

onMounted(() => {
  loadBaseState().then(() => {
    if (activeStates.includes(status.value.state)) {
      applying.value = true
      beginReconnectPolling()
    }
  })
})

onBeforeUnmount(() => {
  if (reconnectTimer) window.clearTimeout(reconnectTimer)
})
</script>

<template>
  <div class="update-card">
    <div class="update-card__header">
      <div>
        <div class="update-card__title">面板更新</div>
        <div class="update-card__subtitle">Center 版本策略、签名校验、迁移预检、健康确认和失败自动回滚</div>
      </div>
      <el-tag :type="statusType">{{ stateNames[status.state] || status.state }}</el-tag>
    </div>

    <div class="version-grid">
      <div class="version-item">
        <span>当前版本</span>
        <strong>{{ version?.version || '—' }}</strong>
      </div>
      <div class="version-item">
        <span>平台</span>
        <strong>{{ version ? `${version.os}/${version.arch}` : '—' }}</strong>
      </div>
      <div class="version-item">
        <span>最新版本</span>
        <strong>{{ check?.latestVersion || status.targetVersion || '尚未检查' }}</strong>
      </div>
      <div class="version-item">
        <span>更新包</span>
        <strong>{{ formatBytes(check?.artifactSize) }}</strong>
      </div>
      <div class="version-item">
        <span>版本来源</span>
        <strong>{{ updateSource }}</strong>
        <small v-if="maskedInstanceID">实例 {{ maskedInstanceID }}</small>
      </div>
    </div>

    <el-alert
      v-if="status.message"
      class="update-message"
      :title="status.message"
      :type="statusType === 'danger' ? 'error' : statusType"
      :closable="false"
      show-icon
    />

    <div v-if="check?.releaseNotes" class="release-notes">
      <span>版本说明</span>
      <p>{{ check.releaseNotes }}</p>
    </div>

    <div class="update-actions">
      <el-button :loading="loading" :disabled="isRunning" @click="checkForUpdate">检查更新</el-button>
      <el-button
        type="primary"
        :loading="applying"
        :disabled="!check?.updateAvailable || !check?.compatible || isRunning"
        @click="applyUpdate"
      >
        更新到 {{ check?.latestVersion || '新版本' }}
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.update-card {
  padding-top: 28px;
  margin-top: 20px;
  border-top: 1px solid var(--border-subtle);
}

.update-card__header,
.update-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.update-card__title {
  display: flex;
    align-items: center;
    margin-bottom: 10px;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
  &::before {
      content: '';
      width: 3px;
      height: 17px;
      margin-right: 9px;
      border-radius: 99px;
      background: rgb(var(--primary-color));
    }
}

.update-card__subtitle {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.version-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin: 20px 0;
}

.version-item {
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-subtle);

  span,
  strong,
  small {
    display: block;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    margin-top: 7px;
    color: var(--text-primary);
    font-size: 15px;
    word-break: break-all;
  }

  small {
    margin-top: 4px;
    color: var(--text-tertiary);
    font-size: 11px;
  }
}

.update-message {
  margin-bottom: 16px;
}

.release-notes {
  margin-bottom: 16px;
  color: var(--font-color-gray);
  font-size: 13px;

  p {
    margin: 6px 0 0;
    color: var(--font-color-black);
    white-space: pre-wrap;
  }
}

.update-actions {
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .version-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
