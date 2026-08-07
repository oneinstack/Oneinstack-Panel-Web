<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import QrcodeVue from 'qrcode.vue'
import { Api } from '@/api/Api'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'

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

const otherSessionCount = computed(() => sessions.value.filter(item => !item.current).length)
const totpStateLabel = computed(() => {
  if (status.totpEnabled) return '已启用'
  if (status.totpSetupPending) return '待验证'
  return '未启用'
})
const totpStateType = computed(() => {
  if (status.totpEnabled) return 'success'
  if (status.totpSetupPending) return 'warning'
  return 'info'
})
const totpDescription = computed(() => {
  if (status.totpEnabled) {
    return `使用标准 TOTP 身份验证器保护登录；当前剩余 ${status.recoveryCodesRemaining} 条恢复码。`
  }
  if (status.totpSetupPending) {
    return '已生成待确认的动态口令配置，完成验证后才会启用；关闭弹窗不会启用动态口令。'
  }
  return '使用标准 TOTP 身份验证器保护登录；启用后会生成恢复码用于紧急登录。'
})
const setupButtonText = computed(() => status.totpSetupPending ? '继续验证' : '启用')

const load = async (notify = false) => {
  loading.value = true
  try {
    const [statusResponse, sessionsResponse] = await Promise.all([
      Api.getSecurityStatus(),
      Api.getSessions()
    ])
    Object.assign(status, statusResponse.data)
    sessions.value = sessionsResponse.data || []
    if (notify) ElMessage.success('账号与会话状态已刷新')
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : '获取账号与会话状态失败'
    ElMessage.error(message)
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
    const message = error instanceof Error && error.message ? error.message : '创建动态口令配置失败'
    ElMessage.error(message)
  } finally {
    setupLoading.value = false
  }
}

const confirmSetup = async () => {
  if (!setup.password || !setup.code) {
    ElMessage.warning('请输入当前密码和 6 位动态口令')
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
    ElMessage.success('动态口令认证已启用')
    await load()
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : '动态口令验证失败'
    ElMessage.error(message)
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
    ElMessage.warning('请输入当前密码和动态口令')
    return
  }
  if (verifyMode.value === 'disable') {
    await Api.disableTOTP({ ...verifyForm })
    verifyVisible.value = false
    ElMessage.success('动态口令认证已停用，请重新登录')
    sconfig.logout()
    await System.router.replace('/login')
    return
  }
  const { data } = await Api.regenerateRecoveryCodes({ ...verifyForm })
  recoveryCodes.value = data.recoveryCodes || []
  verifyVisible.value = false
  recoveryVisible.value = true
  ElMessage.success('恢复码已重新生成，其他会话已退出')
  await load()
}

const copyRecoveryCodes = async () => {
  await navigator.clipboard.writeText(recoveryCodes.value.join('\n'))
  ElMessage.success('恢复码已复制')
}

const revokeSession = async (item: SessionItem) => {
  await ElMessageBox.confirm(
    `高风险操作：确定让 ${item.remoteIp || '未知地址'} 的会话立即退出吗？该设备下一次请求会立即失效。`,
    '吊销会话',
    {
      type: 'warning',
      confirmButtonText: '确认吊销',
      cancelButtonText: '取消'
    }
  )
  await Api.revokeSession(item.id)
  ElMessage.success('会话已吊销')
  await load()
}

const revokeOthers = async () => {
  await ElMessageBox.confirm(
    '高风险操作：确定让除当前浏览器外的所有会话立即退出吗？其他设备需要重新登录。',
    '退出其他设备',
    {
      type: 'warning',
      confirmButtonText: '确认退出其他设备',
      cancelButtonText: '取消'
    }
  )
  const { data } = await Api.revokeOtherSessions()
  ElMessage.success(`已吊销 ${data.revokedSessions || 0} 个会话`)
  await load()
}

const formatDate = (value: string) => value ? new Date(value).toLocaleString() : '-'

onMounted(() => load())
</script>

<template>
  <div v-loading="loading" class="account-security">
    <div class="section-header">
      <div>
        <div class="section-title">账号与会话安全</div>
        <div class="section-description">管理动态口令、恢复码以及当前账号的登录设备。</div>
      </div>
      <el-button :loading="loading" @click="load(true)">刷新会话状态</el-button>
    </div>

    <div class="security-row">
      <div>
        <div class="row-title">
          动态口令认证
          <el-tag size="small" type="warning">中风险</el-tag>
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
          <el-button @click="openVerification('regenerate')">重新生成恢复码</el-button>
          <el-button type="danger" plain @click="openVerification('disable')">停用</el-button>
        </template>
      </div>
    </div>

    <div class="sessions-header">
      <div>
        <div class="row-title">
          有效登录会话
          <el-tag size="small" type="danger">高风险</el-tag>
        </div>
        <div class="row-description">被吊销的会话无需等待 JWT 到期，会在下一次请求时立即失效。</div>
      </div>
      <el-button type="warning" plain :disabled="otherSessionCount === 0" @click="revokeOthers">
        退出其他设备
      </el-button>
    </div>
    <el-table :data="sessions" empty-text="暂无有效会话">
      <el-table-column label="IP 地址" min-width="150">
        <template #default="{ row }">
          <el-popover
            placement="top-start"
            :width="320"
            trigger="hover"
            popper-class="session-device-popover"
          >
            <template #reference>
              <div class="session-ip">
                <span class="session-ip__text">{{ row.remoteIp || '-' }}</span>
                <el-tag v-if="row.current" type="success" size="small">当前会话</el-tag>
              </div>
            </template>
            <div class="session-device">
              <div class="session-device__label">设备信息</div>
              <div class="session-device__value">{{ row.userAgent || '未知浏览器' }}</div>
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="登录时间" min-width="160">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="最近活动" min-width="160">
        <template #default="{ row }">{{ formatDate(row.lastSeenAt) }}</template>
      </el-table-column>
      <el-table-column label="到期时间" min-width="160">
        <template #default="{ row }">{{ formatDate(row.expiresAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="96" align="right">
        <template #default="{ row }">
          <el-button v-if="!row.current" link type="danger" @click="revokeSession(row)">吊销会话</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <el-dialog v-model="setupVisible" title="启用动态口令认证" width="520px">
    <div class="setup-content">
      <qrcode-vue :value="setup.otpauthUri" :size="180" level="M" />
      <div class="setup-help">使用身份验证器扫描二维码，或手动输入下面的密钥。</div>
      <el-input :model-value="setup.secret" readonly>
        <template #prepend>密钥</template>
      </el-input>
      <el-input v-model="setup.password" type="password" show-password placeholder="当前账号密码" />
      <el-input v-model="setup.code" maxlength="6" placeholder="身份验证器中的 6 位动态口令" />
    </div>
    <template #footer>
      <el-button @click="setupVisible = false">取消</el-button>
      <el-button type="primary" :loading="setupLoading" @click="confirmSetup">验证并启用</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="verifyVisible"
    :title="verifyMode === 'disable' ? '停用动态口令认证' : '重新生成恢复码'"
    width="460px"
  >
    <el-alert
      :title="verifyMode === 'disable'
        ? '停用后所有登录会话将立即失效。'
        : '生成新恢复码后旧恢复码作废，其他登录会话将退出。'"
      type="warning"
      :closable="false"
      style="margin-bottom: 18px"
    />
    <el-input v-model="verifyForm.password" type="password" show-password placeholder="当前账号密码" />
    <el-input
      v-model="verifyForm.code"
      maxlength="6"
      placeholder="身份验证器中的 6 位动态口令"
      style="margin-top: 14px"
    />
    <template #footer>
      <el-button @click="verifyVisible = false">取消</el-button>
      <el-button :type="verifyMode === 'disable' ? 'danger' : 'primary'" @click="submitVerification">
        确认
      </el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="recoveryVisible" title="请立即保存恢复码" width="520px">
    <el-alert
      title="恢复码只显示这一次，每条只能使用一次。请离线保存在安全位置。"
      type="warning"
      :closable="false"
      show-icon
    />
    <div class="recovery-codes">
      <code v-for="code in recoveryCodes" :key="code">{{ code }}</code>
    </div>
    <template #footer>
      <el-button @click="copyRecoveryCodes">复制全部</el-button>
      <el-button type="primary" @click="recoveryVisible = false">我已安全保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.account-security {
  padding: 30px 0 10px;
  border-top: 1px solid var(--border-subtle);
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
