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
const setup = reactive({ secret: '', otpauthUri: '', password: '', code: '' })
const recoveryVisible = ref(false)
const recoveryCodes = ref<string[]>([])
const verifyVisible = ref(false)
const verifyMode = ref<'disable' | 'regenerate'>('regenerate')
const verifyForm = reactive({ password: '', code: '' })

const otherSessionCount = computed(() => sessions.value.filter(item => !item.current).length)

const load = async () => {
  loading.value = true
  try {
    const [statusResponse, sessionsResponse] = await Promise.all([
      Api.getSecurityStatus(),
      Api.getSessions()
    ])
    Object.assign(status, statusResponse.data)
    sessions.value = sessionsResponse.data || []
  } finally {
    loading.value = false
  }
}

const openSetup = async () => {
  const { data } = await Api.setupTOTP()
  Object.assign(setup, {
    secret: data.secret,
    otpauthUri: data.otpauthUri,
    password: '',
    code: ''
  })
  setupVisible.value = true
}

const confirmSetup = async () => {
  if (!setup.password || !setup.code) {
    ElMessage.warning('请输入当前密码和 6 位动态口令')
    return
  }
  const { data } = await Api.confirmTOTP({
    password: setup.password,
    code: setup.code
  })
  recoveryCodes.value = data.recoveryCodes || []
  setupVisible.value = false
  recoveryVisible.value = true
  ElMessage.success('动态口令认证已启用')
  await load()
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
    `确定让 ${item.remoteIp || '未知地址'} 的会话立即退出吗？`,
    '吊销会话',
    { type: 'warning' }
  )
  await Api.revokeSession(item.id)
  ElMessage.success('会话已吊销')
  await load()
}

const revokeOthers = async () => {
  await ElMessageBox.confirm('确定让除当前浏览器外的所有会话立即退出吗？', '退出其他设备', {
    type: 'warning'
  })
  const { data } = await Api.revokeOtherSessions()
  ElMessage.success(`已吊销 ${data.revokedSessions || 0} 个会话`)
  await load()
}

const formatDate = (value: string) => value ? new Date(value).toLocaleString() : '-'

onMounted(load)
</script>

<template>
  <div v-loading="loading" class="account-security">
    <div class="section-header">
      <div>
        <div class="section-title">账号与会话安全</div>
        <div class="section-description">管理动态口令、恢复码以及当前账号的登录设备。</div>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <div class="security-row">
      <div>
        <div class="row-title">
          动态口令认证
          <el-tag :type="status.totpEnabled ? 'success' : 'info'" size="small">
            {{ status.totpEnabled ? '已启用' : '未启用' }}
          </el-tag>
        </div>
        <div class="row-description">
          使用标准 TOTP 身份验证器保护登录；当前剩余 {{ status.recoveryCodesRemaining }} 条恢复码。
        </div>
      </div>
      <div class="row-actions">
        <el-button v-if="!status.totpEnabled" type="primary" @click="openSetup">启用</el-button>
        <template v-else>
          <el-button @click="openVerification('regenerate')">重新生成恢复码</el-button>
          <el-button type="danger" plain @click="openVerification('disable')">停用</el-button>
        </template>
      </div>
    </div>

    <div class="sessions-header">
      <div>
        <div class="row-title">有效登录会话</div>
        <div class="row-description">被吊销的会话无需等待 JWT 到期，会在下一次请求时立即失效。</div>
      </div>
      <el-button :disabled="otherSessionCount === 0" @click="revokeOthers">退出其他设备</el-button>
    </div>
    <el-table :data="sessions" empty-text="暂无有效会话">
      <el-table-column label="设备" min-width="240">
        <template #default="{ row }">
          <div class="device">
            <span>{{ row.userAgent || '未知浏览器' }}</span>
            <el-tag v-if="row.current" type="success" size="small">当前会话</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="remoteIp" label="IP 地址" width="150" />
      <el-table-column label="最近活动" width="190">
        <template #default="{ row }">{{ formatDate(row.lastSeenAt) }}</template>
      </el-table-column>
      <el-table-column label="到期时间" width="190">
        <template #default="{ row }">{{ formatDate(row.expiresAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="right">
        <template #default="{ row }">
          <el-button v-if="!row.current" link type="danger" @click="revokeSession(row)">吊销</el-button>
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
      <el-button type="primary" @click="confirmSetup">验证并启用</el-button>
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
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 650;
}
.section-description,
.row-description {
  color: var(--el-text-color-secondary);
  margin-top: 7px;
  line-height: 1.5;
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
.device {
  display: flex;
  align-items: center;
  gap: 8px;
}
.device span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
}
</style>
