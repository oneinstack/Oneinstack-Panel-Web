<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'

import { Api } from '@/api/modules'
import i18n from '@/lang'
import { hasOperationAccess } from '@/utils/access'

const canReadPanelSettings = computed(() => hasOperationAccess('panelSettings', 'read', {
  actions: ['panelSettings.read', 'system.settings.read']
}))
const canWritePanelSettings = computed(() => hasOperationAccess('panelSettings', 'write', {
  actions: ['panelSettings.write', 'system.settings.write']
}))

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
  signingKeyId?: string
  trustRevision?: number
  trustSource?: 'center' | 'static'
  trustedKeyCount: number
  revokedKeyCount: number
  trustUpdatedAt?: string
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
const errorMessage = ref('')
let reconnectTimer: number | undefined

const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}

const stateNames = computed<Record<string, string>>(() => ({
  idle: t('setting.update.states.idle', 'Not executed'),
  checking: t('setting.update.states.checking', 'Checking updates'),
  downloading: t('setting.update.states.downloading', 'Downloading and verifying'),
  preflight: t('setting.update.states.preflight', 'Database migration precheck'),
  switching: t('setting.update.states.switching', 'Switching version'),
  health_checking: t('setting.update.states.healthChecking', 'Health checking'),
  succeeded: t('setting.update.states.succeeded', 'Update succeeded'),
  failed: t('setting.update.states.failed', 'Update failed'),
  rolled_back: t('setting.update.states.rolledBack', 'Automatically rolled back'),
  rollback_failed: t('setting.update.states.rollbackFailed', 'Rollback failed'),
  recovery_required: t('setting.update.states.recoveryRequired', 'Recovery required')
}))

const activeStates = ['checking', 'downloading', 'preflight', 'switching', 'health_checking']
const isRunning = computed(() => activeStates.includes(status.value.state) || applying.value)
const currentVersionText = computed(
  () => version.value?.version || check.value?.currentVersion || status.value.currentVersion || ''
)
const latestVersionText = computed(() => check.value?.latestVersion || status.value.targetVersion || '')
const hasSameVersionTarget = computed(() => {
  return Boolean(latestVersionText.value) && latestVersionText.value === currentVersionText.value
})
const canApplyUpdate = computed(() => {
  return Boolean(check.value?.updateAvailable && check.value?.compatible && !hasSameVersionTarget.value)
})
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

const writeClipboardText = async (text: string) => {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'readonly')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!copied) {
    throw new Error('copy failed')
  }
}

const copyCurrentVersion = async () => {
  if (!currentVersionText.value) return
  try {
    await writeClipboardText(currentVersionText.value)
    ElMessage.success(t('setting.update.copyVersionSuccess', 'Version copied'))
  } catch {
    ElMessage.error(t('setting.panel.copyFailed', 'Copy failed. Check browser clipboard permission.'))
  }
}

const updateSource = computed(() => {
  if (check.value?.source === 'center') return 'OneinStack Center'
  if (check.value?.source === 'manifest') return t('setting.update.standaloneSignedManifest', 'Standalone signed manifest')
  return t('setting.update.notChecked', 'Not checked')
})

const maskedInstanceID = computed(() => {
  const value = check.value?.instanceId
  if (!value) return ''
  return `…${value.slice(-8)}`
})

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string') return error
  return fallback
}

const loadBaseState = async () => {
  if (!canReadPanelSettings.value) return
  const [versionResponse, statusResponse] = await Promise.all([
    Api.getPanelVersion({ silentError: true }),
    Api.getPanelUpdateStatus({ silentError: true })
  ])
  version.value = versionResponse.data
  status.value = statusResponse.data || status.value
}

const checkForUpdate = async () => {
  if (!canReadPanelSettings.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const { data } = await Api.checkPanelUpdate({ silentError: true })
    check.value = data
    if (data.updateAvailable && data.latestVersion !== data.currentVersion) {
      ElMessage.success(
        data.source === 'center'
          ? t('setting.update.centerAssignedVersion', 'Center assigned version {version} to this instance', { version: data.latestVersion })
          : t('setting.update.newVersionFound', 'New version {version} found', { version: data.latestVersion })
      )
    } else {
      ElMessage.success(t('setting.update.alreadyLatest', 'Already on the latest version'))
    }
  } catch (error) {
    const message = getErrorMessage(error, t('setting.update.checkFailed', 'Failed to check updates'))
    errorMessage.value = message
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}

const applyUpdate = async () => {
  if (!canWritePanelSettings.value) return
  if (!canApplyUpdate.value || applying.value) return
  try {
    const targetVersion = latestVersionText.value || t('setting.update.newVersion', 'new version')
    const { value } = await ElMessageBox.prompt(
      t('setting.update.applyConfirmMessage', 'The panel will update to {version}. It will be briefly offline during update and automatically restore the old version if it fails. Enter UPDATE PANEL to continue.', { version: targetVersion }),
      t('setting.update.updatePanel', 'Update panel'),
      {
        type: 'warning',
        inputPlaceholder: 'UPDATE PANEL',
        inputValidator: (input) => input === 'UPDATE PANEL' || t('setting.update.confirmTextIncorrect', 'Confirmation text is incorrect'),
        confirmButtonText: t('setting.update.startUpdate', 'Start update'),
        cancelButtonText: t('common.cancel', 'Cancel')
      }
    )
    applying.value = true
    errorMessage.value = ''
    await Api.applyPanelUpdate({ confirm: value }, { silentError: true })
    ElMessage.success(t('setting.update.taskStarted', 'Update task started. Waiting for the panel to come back online.'))
    beginReconnectPolling()
  } catch (error) {
    applying.value = false
    if (error !== 'cancel' && error !== 'close') {
      const message = getErrorMessage(error, t('setting.update.startFailed', 'Failed to start update'))
      errorMessage.value = message
      ElMessage.error(message)
      await loadBaseState().catch(() => undefined)
    }
  }
}

const beginReconnectPolling = () => {
  if (reconnectTimer) window.clearTimeout(reconnectTimer)
  const poll = async () => {
    try {
      const { data } = await Api.pollPanelUpdateStatus()
      if (data) {
        status.value = data
        if (!activeStates.includes(status.value.state)) {
          applying.value = false
          ElMessage.success(
            status.value.state === 'succeeded'
              ? t('setting.update.completed', 'Panel update completed')
              : status.value.message || t('setting.update.ended', 'Panel update ended')
          )
          await loadBaseState()
          return
        }
      }
    } catch {
      // 主服务切换期间连接失败属于预期情况，继续静默重连。
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
  }).catch((error) => {
    errorMessage.value = getErrorMessage(error, t('setting.update.loadStatusFailed', 'Failed to load update status'))
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
        <div class="update-card__title">{{ $t('setting.update.title') }}</div>
        <div class="update-card__subtitle">{{ $t('setting.update.description') }}</div>
      </div>
      <el-tag :type="statusType">{{ stateNames[status.state] || status.state }}</el-tag>
    </div>

    <div class="version-grid">
      <div class="version-item version-item--version">
        <span>{{ $t('setting.update.currentVersion') }}</span>
        <div class="version-value version-value--interactive">
          <el-tooltip
            :content="currentVersionText || '—'"
            effect="dark"
            placement="top-start"
            :show-after="120"
            :disabled="!currentVersionText"
          >
            <strong class="version-code">{{ currentVersionText || '—' }}</strong>
          </el-tooltip>
          <el-tooltip :content="$t('setting.update.copyVersion', 'Copy version')" effect="dark" placement="top">
            <el-button
              class="version-copy-button"
              :icon="CopyDocument"
              text
              :disabled="!currentVersionText"
              @click="copyCurrentVersion"
            />
          </el-tooltip>
        </div>
      </div>
      <div class="version-item">
        <span>{{ $t('setting.update.platform') }}</span>
        <strong>{{ version ? `${version.os}/${version.arch}` : '—' }}</strong>
      </div>
      <div class="version-item">
        <span>{{ $t('setting.update.latestVersion') }}</span>
        <strong>{{ check?.latestVersion || status.targetVersion || $t('setting.update.notChecked') }}</strong>
      </div>
      <div class="version-item">
        <span>{{ $t('setting.update.updatePackage') }}</span>
        <strong>{{ formatBytes(check?.artifactSize) }}</strong>
      </div>
      <div class="version-item">
        <span>{{ $t('setting.update.versionSource') }}</span>
        <strong>{{ updateSource }}</strong>
        <small v-if="maskedInstanceID">{{ $t('setting.update.instance', { id: maskedInstanceID }) }}</small>
      </div>
      <div class="version-item trust-item">
        <span>{{ $t('setting.update.signatureTrust') }}</span>
        <strong>{{ check?.signingKeyId || $t('setting.update.notChecked') }}</strong>
        <small v-if="check?.trustSource === 'center'">
          {{ $t('setting.update.centerTrustStatus', { revision: check.trustRevision, count: check.trustedKeyCount }) }}
          <template v-if="check.revokedKeyCount"> · {{ $t('setting.update.revokedCount', { count: check.revokedKeyCount }) }}</template>
        </small>
        <small v-else-if="check?.trustSource === 'static'">{{ $t('setting.update.localStaticTrust') }}</small>
      </div>
    </div>

    <el-alert
      v-if="errorMessage"
      class="update-message"
      :title="errorMessage"
      type="error"
      :closable="true"
      show-icon
      @close="errorMessage = ''"
    />

    <el-alert
      v-if="status.message"
      class="update-message"
      :title="status.message"
      :type="statusType === 'danger' ? 'error' : statusType"
      :closable="false"
      show-icon
    />

    <div v-if="check?.releaseNotes" class="release-notes">
      <span>{{ $t('setting.update.releaseNotes') }}</span>
      <p>{{ check.releaseNotes }}</p>
    </div>

    <div class="update-actions">
      <el-button v-if="canReadPanelSettings" :loading="loading" :disabled="isRunning" @click="checkForUpdate">{{ $t('setting.update.checkUpdate') }}</el-button>
      <el-button
        v-if="canWritePanelSettings && (!check || canApplyUpdate)"
        type="primary"
        :loading="applying"
        :disabled="!canApplyUpdate || isRunning"
        @click="applyUpdate"
      >
        {{ $t('setting.update.updateTo', { version: check?.latestVersion || $t('setting.update.newVersion') }) }}
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.update-card {
  // padding-top: 28px;
  // margin-top: 20px;
  // border-top: 1px solid var(--border-subtle);
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
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin: 20px 0;
  align-items: stretch;
}

.version-item {
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-subtle);
  box-shadow: var(--shadow-xs);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(var(--primary-color), 0.24);
    box-shadow: var(--shadow-sm);
    background: rgba(var(--primary-color), 0.04);
  }

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
    word-break: break-word;
  }

  small {
    margin-top: 4px;
    color: var(--text-tertiary);
    font-size: 11px;
  }
}

.version-item--version {
  grid-column: span 1;
  min-width: 0;
}

.version-value {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 7px;
  min-width: 0;
}

.version-value--interactive {
  justify-content: space-between;
}

.version-code {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  word-break: normal;
  overflow-wrap: normal;
  line-height: 1.35;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.version-copy-button {
  flex-shrink: 0;
  color: var(--text-secondary);
  min-width: 34px;
  min-height: 34px;
  padding: 0 !important;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.version-copy-button:hover {
  color: rgb(var(--primary-color));
  border-color: rgba(var(--primary-color), 0.24);
  background: rgba(var(--primary-color), 0.06);
}

:root:root.dark .version-copy-button {
  border-color: var(--border-default);
  background: var(--surface-subtle);
  color: var(--text-secondary);
}

:root:root.dark .version-copy-button:hover {
  color: #fdba74;
  border-color: rgba(var(--primary-color), 0.28);
  background: rgba(var(--primary-color), 0.08);
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

  .version-item--version {
    grid-column: span 2;
  }

  .version-value {
    align-items: flex-start;
  }

  .version-code {
    overflow: visible;
    white-space: normal;
    text-overflow: initial;
    word-break: break-word;
    overflow-wrap: anywhere;
    line-height: 1.45;
  }
}

@media (max-width: 640px) {
  .version-grid {
    grid-template-columns: 1fr;
  }

  .version-item--version {
    grid-column: span 1;
  }
}
</style>
