<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleClose } from '@element-plus/icons-vue'
import QrcodeVue from 'qrcode.vue'
import { Api } from '@/api/modules'
import { useConfigStore } from '@/stores/modules/config';
import System from '@/utils/System'
import i18n from '@/lang'
import type { ColumnItem } from '@/components/custom-table.vue'

const sconfig = useConfigStore()

interface SecurityStatus {
  totpEnabled: boolean
  totpSetupPending: boolean
  recoveryCodesRemaining: number
  mustChangePassword: boolean
}

interface SessionItem {
  id: string
  remoteIp: string
  userAgent: string
  createdAt: string
  lastSeenAt: string
  expiresAt: string
  current: boolean
}

const loading = ref(false)
const status = reactive<SecurityStatus>({
  totpEnabled: false,
  totpSetupPending: false,
  recoveryCodesRemaining: 0,
  mustChangePassword: false
})
const sessions = ref<SessionItem[]>([])
const setupVisible = ref(false)
const setupLoading = ref(false)
const setup = reactive({ secret: '', otpauthUri: '', password: '', code: '' })
const recoveryVisible = ref(false)
const recoveryCodes = ref<string[]>([])
const verifyVisible = ref(false)
const verifyMode = ref<'disable' | 'regenerate'>('regenerate')
const verifyForm = reactive({ password: '', code: '' })

const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}

const otherSessionCount = computed(() => sessions.value.filter(item => !item.current).length)
const totpStateLabel = computed(() => {
  if (status.totpEnabled) return t('setting.accountSecurity.enabled', 'Enabled')
  if (status.totpSetupPending) return t('setting.accountSecurity.pendingVerification', 'Pending verification')
  return t('setting.accountSecurity.notEnabled', 'Not enabled')
})
const totpStateType = computed(() => {
  if (status.totpEnabled) return 'success'
  if (status.totpSetupPending) return 'warning'
  return 'info'
})
const totpDescription = computed(() => {
  if (status.totpEnabled) {
    return t('setting.accountSecurity.totpEnabledDescription', 'Protect sign-in with a standard TOTP authenticator. {count} recovery codes remain.', { count: status.recoveryCodesRemaining })
  }
  if (status.totpSetupPending) {
    return t('setting.accountSecurity.totpPendingDescription', 'A pending TOTP configuration has been generated. It is enabled only after verification; closing the dialog does not enable TOTP.')
  }
  return t('setting.accountSecurity.totpDisabledDescription', 'Protect sign-in with a standard TOTP authenticator. Recovery codes are generated for emergency sign-in after enabling.')
})
const setupButtonText = computed(() => status.totpSetupPending ? t('setting.accountSecurity.continueVerification', 'Continue verification') : t('setting.accountSecurity.enable', 'Enable'))
const sessionColumns = computed<ColumnItem[]>(() => [
  { prop: 'remoteIp', label: t('setting.accountSecurity.ipAddress', 'IP address'), minWidth: 150, slot: 'remoteIp' },
  { prop: 'createdAt', label: t('setting.accountSecurity.loginTime', 'Login time'), minWidth: 160, slot: 'createdAt' },
  { prop: 'lastSeenAt', label: t('setting.accountSecurity.lastActivity', 'Last activity'), minWidth: 160, slot: 'lastSeenAt' },
  { prop: 'expiresAt', label: t('setting.accountSecurity.expiresAt', 'Expires at'), minWidth: 160, slot: 'expiresAt' },
  { prop: 'actionColumn', label: t('common.action', 'Action'), width: 132, align: 'right', fixed: 'right', slot: 'actionColumn', className: 'table-action-column' }
])

const load = async (notify = false) => {
  loading.value = true
  try {
    const [statusResponse, sessionsResponse] = await Promise.all([
      Api.getSecurityStatus(),
      Api.getSessions()
    ])
    Object.assign(status, statusResponse.data)
    sessions.value = sessionsResponse.data || []
    if (notify) ElMessage.success(t('setting.accountSecurity.statusRefreshed', 'Account and session status refreshed'))
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : t('setting.accountSecurity.statusLoadFailed', 'Failed to load account and session status')
    // ElMessage.error(message)
  } finally {
    loading.value = false
  }
}

const openSetup = async () => {
  setupLoading.value = true
  try {
    const { data } = await Api.setupTOTP()
    Object.assign(setup, {
      secret: data.secret,
      otpauthUri: data.otpauthUri,
      password: '',
      code: ''
    })
    status.totpSetupPending = true
    setupVisible.value = true
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : t('setting.accountSecurity.setupCreateFailed', 'Failed to create TOTP configuration')
    // ElMessage.error(message)
  } finally {
    setupLoading.value = false
  }
}

const confirmSetup = async () => {
  if (!setup.password || !setup.code) {
    ElMessage.warning(t('setting.accountSecurity.inputPasswordAndTotpCode', 'Enter current password and 6-digit TOTP code'))
    return
  }
  setupLoading.value = true
  try {
    const { data } = await Api.confirmTOTP({
      password: setup.password,
      code: setup.code
    })
    recoveryCodes.value = data.recoveryCodes || []
    setupVisible.value = false
    recoveryVisible.value = true
    ElMessage.success(t('setting.accountSecurity.totpEnabledSuccess', 'TOTP authentication enabled'))
    await load()
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : t('setting.accountSecurity.totpVerifyFailed', 'TOTP verification failed')
    // ElMessage.error(message)
  } finally {
    setupLoading.value = false
  }
}

const openVerification = (mode: 'disable' | 'regenerate') => {
  verifyMode.value = mode
  verifyForm.password = ''
  verifyForm.code = ''
  verifyVisible.value = true
}

const submitVerification = async () => {
  if (!verifyForm.password || !verifyForm.code) {
    ElMessage.warning(t('setting.accountSecurity.inputPasswordAndCode', 'Enter current password and TOTP code'))
    return
  }
  if (verifyMode.value === 'disable') {
    await Api.disableTOTP({ ...verifyForm })
    verifyVisible.value = false
    ElMessage.success(t('setting.accountSecurity.totpDisabledSuccess', 'TOTP authentication disabled. Sign in again.'))
    sconfig.logout()
    await System.router.replace('/login')
    return
  }
  const { data } = await Api.regenerateRecoveryCodes({ ...verifyForm })
  recoveryCodes.value = data.recoveryCodes || []
  verifyVisible.value = false
  recoveryVisible.value = true
  ElMessage.success(t('setting.accountSecurity.recoveryRegenerated', 'Recovery codes regenerated. Other sessions have been signed out.'))
  await load()
}

const copyRecoveryCodes = async () => {
  await navigator.clipboard.writeText(recoveryCodes.value.join('\n'))
  ElMessage.success(t('setting.accountSecurity.recoveryCopied', 'Recovery codes copied'))
}

const revokeSession = async (item: SessionItem) => {
  await ElMessageBox.confirm(
    t('setting.accountSecurity.revokeSessionConfirm', 'High-risk operation: sign out the session from {ip} immediately? The next request from that device will be invalid.', { ip: item.remoteIp || t('setting.accountSecurity.unknownAddress', 'Unknown address') }),
    t('setting.accountSecurity.revokeSession', 'Revoke session'),
    {
      type: 'warning',
      confirmButtonText: t('setting.accountSecurity.confirmRevoke', 'Confirm revoke'),
      cancelButtonText: t('common.cancel', 'Cancel')
    }
  )
  await Api.revokeSession(item.id)
  ElMessage.success(t('setting.accountSecurity.sessionRevoked', 'Session revoked'))
  await load()
}

const revokeOthers = async () => {
  await ElMessageBox.confirm(
    t('setting.accountSecurity.revokeOthersConfirm', 'High-risk operation: sign out all sessions except the current browser? Other devices need to sign in again.'),
    t('setting.accountSecurity.signOutOtherDevices', 'Sign out other devices'),
    {
      type: 'warning',
      confirmButtonText: t('setting.accountSecurity.confirmSignOutOthers', 'Confirm sign out other devices'),
      cancelButtonText: t('common.cancel', 'Cancel')
    }
  )
  const { data } = await Api.revokeOtherSessions()
  ElMessage.success(t('setting.accountSecurity.revokedSessionCount', '{count} sessions revoked', { count: data.revokedSessions || 0 }))
  await load()
}

const formatDate = (value: string) => value ? new Date(value).toLocaleString() : '-'

onMounted(() => load())
</script>

<template>
  <div v-loading="loading" class="account-security">
    <div class="section-header">
      <div>
        <div class="section-title">{{ $t('setting.accountSecurity.title') }}</div>
        <div class="section-description">{{ $t('setting.accountSecurity.description') }}</div>
      </div>
      <el-button :loading="loading" @click="load(true)">{{ $t('setting.accountSecurity.refreshSessionStatus') }}</el-button>
    </div>

    <div class="security-row">
      <div>
        <div class="row-title">
          {{ $t('setting.accountSecurity.totpAuth') }}
          <el-tag size="small" type="warning">{{ $t('setting.backup.mediumRisk') }}</el-tag>
          <el-tag :type="totpStateType" size="small">
            {{ totpStateLabel }}
          </el-tag>
        </div>
        <div class="row-description">
          {{ totpDescription }}
        </div>
      </div>
      <div class="row-actions">
        <el-button v-if="!status.totpEnabled" type="primary" :loading="setupLoading" @click="openSetup">
          {{ setupButtonText }}
        </el-button>
        <template v-else>
          <el-button @click="openVerification('regenerate')">{{ $t('setting.accountSecurity.regenerateRecoveryCodes') }}</el-button>
          <el-button type="danger" plain @click="openVerification('disable')">{{ $t('setting.accountSecurity.disable') }}</el-button>
        </template>
      </div>
    </div>

    <div class="sessions-header">
      <div>
        <div class="row-title">
          {{ $t('setting.accountSecurity.activeSessions') }}
          <el-tag size="small" type="danger">{{ $t('setting.accountSecurity.highRisk') }}</el-tag>
        </div>
        <div class="row-description">{{ $t('setting.accountSecurity.sessionDescription') }}</div>
      </div>
      <el-button type="primary" plain :disabled="otherSessionCount === 0" @click="revokeOthers">
        {{ $t('setting.accountSecurity.signOutOtherDevices') }}
      </el-button>
    </div>
    <custom-table :data="sessions" :columns="sessionColumns" :pagination="false" :empty-text="$t('setting.accountSecurity.noActiveSessions')">
      <template #remoteIp="{ row }">
          <el-popover
            placement="top-start"
            :width="320"
            trigger="hover"
            popper-class="session-device-popover"
          >
            <template #reference>
              <div class="session-ip">
                <span class="session-ip__text">{{ row.remoteIp || '-' }}</span>
                <el-tag v-if="row.current" type="success" size="small">{{ $t('setting.accountSecurity.currentSession') }}</el-tag>
              </div>
            </template>
            <div class="session-device">
              <div class="session-device__label">{{ $t('setting.accountSecurity.deviceInfo') }}</div>
              <div class="session-device__value">{{ row.userAgent || $t('setting.accountSecurity.unknownBrowser') }}</div>
            </div>
          </el-popover>
      </template>
      <template #createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      <template #lastSeenAt="{ row }">{{ formatDate(row.lastSeenAt) }}</template>
      <template #expiresAt="{ row }">{{ formatDate(row.expiresAt) }}</template>
      <template #actionColumn="{ row }">
        <el-button v-if="!row.current" plain type="danger" :icon="CircleClose" @click="revokeSession(row)">{{ $t('setting.accountSecurity.revokeSession') }}</el-button>
      </template>
    </custom-table>
  </div>

  <el-dialog v-model="setupVisible" :title="$t('setting.accountSecurity.enableTotpAuth')" width="520px">
    <div class="setup-content">
      <qrcode-vue :value="setup.otpauthUri" :size="180" level="M" />
      <div class="setup-help">{{ $t('setting.accountSecurity.setupHelp') }}</div>
      <el-input :model-value="setup.secret" readonly>
        <template #prepend>{{ $t('setting.accountSecurity.secret') }}</template>
      </el-input>
      <el-input v-model="setup.password" type="password" show-password :placeholder="$t('setting.accountSecurity.currentPasswordPlaceholder')" />
      <el-input v-model="setup.code" maxlength="6" :placeholder="$t('setting.accountSecurity.totpCodePlaceholder')" />
    </div>
    <template #footer>
      <el-button @click="setupVisible = false">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="setupLoading" @click="confirmSetup">{{ $t('setting.accountSecurity.verifyAndEnable') }}</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="verifyVisible"
    :title="verifyMode === 'disable' ? $t('setting.accountSecurity.disableTotpAuth') : $t('setting.accountSecurity.regenerateRecoveryCodes')"
    width="460px"
  >
    <el-alert
      :title="verifyMode === 'disable'
        ? $t('setting.accountSecurity.disableWarning')
        : $t('setting.accountSecurity.regenerateWarning')"
      type="warning"
      :closable="false"
      style="margin-bottom: 18px"
    />
    <el-input v-model="verifyForm.password" type="password" show-password :placeholder="$t('setting.accountSecurity.currentPasswordPlaceholder')" />
    <el-input
      v-model="verifyForm.code"
      maxlength="6"
      :placeholder="$t('setting.accountSecurity.totpCodePlaceholder')"
      style="margin-top: 14px"
    />
    <template #footer>
      <el-button @click="verifyVisible = false">{{ $t('common.cancel') }}</el-button>
      <el-button :type="verifyMode === 'disable' ? 'danger' : 'primary'" @click="submitVerification">
        {{ $t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="recoveryVisible" :title="$t('setting.accountSecurity.saveRecoveryCodesNow')" width="520px">
    <el-alert
      :title="$t('setting.accountSecurity.recoveryCodesOnlyShownOnce')"
      type="warning"
      :closable="false"
      show-icon
    />
    <div class="recovery-codes">
      <code v-for="code in recoveryCodes" :key="code">{{ code }}</code>
    </div>
    <template #footer>
      <el-button @click="copyRecoveryCodes">{{ $t('setting.accountSecurity.copyAll') }}</el-button>
      <el-button type="primary" @click="recoveryVisible = false">{{ $t('setting.accountSecurity.savedSafely') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.account-security {
  // padding: 30px 0 10px;
  // border-top: 1px solid var(--border-subtle);
}
.section-header,
.security-row,
.sessions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}
.section-title {
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
.section-description,
.row-description {
  color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.75;
}

.section-header{
  margin-bottom: 16px;
}
.security-row {
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--surface-subtle);

  &:first-of-type {
    border-radius: 12px 12px 0 0;
  }
}
.row-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}
.row-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.sessions-header {
  padding: 24px 0 14px;
}
.session-ip {
  display: flex;
  align-items: center;
  gap: 8px;

  &__text {
    color: var(--text-primary);
    cursor: help;
    transition: color 0.2s ease;
  }

  &:hover &__text {
    color: rgb(var(--primary-color));
  }
}

.session-device {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__label {
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  &__value {
    color: var(--text-primary);
    font-size: 13px;
    line-height: 1.7;
    word-break: break-word;
  }
}
.setup-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.setup-help {
  color: var(--el-text-color-secondary);
}
.recovery-codes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 18px;
}
.recovery-codes code {
  padding: 11px;
  border: 1px solid var(--el-border-color);
  border-radius: 9px;
  background: var(--surface-subtle);
  text-align: center;
  font-size: 15px;
}

@media (max-width: 768px) {
  .section-header,
  .security-row,
  .sessions-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .session-ip {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
