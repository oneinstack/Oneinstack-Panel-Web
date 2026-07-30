<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Api } from '@/api/Api'

interface CertificateStatus {
  valid: boolean
  error?: string
  notBefore?: string
  notAfter?: string
  dnsNames: string[]
  ipAddresses: string[]
}

interface NetworkSettings {
  bindAddress: string
  httpPort: string
  httpAccessUrl: string
  httpsEnabled: boolean
  httpsPort: string
  httpsAccessUrl: string
  httpsCertificateFile: string
  httpsPrivateKeyFile: string
  trustedProxies: string[]
  panelEntryEnabled: boolean
  panelEntryPath: string
  panelAccessURL?: string
  panelAccessUrl?: string
  certificate?: CertificateStatus
  restartRequired: boolean
  autoApplySupported: boolean
  applyTransaction?: NetworkApplyTransaction
}

interface NetworkApplyTransaction {
  id: string
  status: 'scheduled' | 'applying' | 'succeeded' | 'rolled_back' | 'failed'
  error?: string
  createdAt: string
  startedAt?: string
  finishedAt?: string
  httpUrl: string
  httpsUrl?: string
  rolledBack: boolean
  recoverable: boolean
}

const loading = ref(false)
const saving = ref(false)
const applyPolling = ref(false)
const formRef = ref<FormInstance>()
const current = ref<NetworkSettings>()
const proxyText = ref('')
const form = reactive({
  bindAddress: '0.0.0.0',
  httpPort: '8089',
  httpsEnabled: false,
  httpsPort: '8443',
  httpsCertificateFile: '',
  httpsPrivateKeyFile: ''
})
let applyPollTimer: number | undefined

const validatePort = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  const port = Number(value)
  if (!/^\d{1,5}$/.test(value) || !Number.isInteger(port) || port < 1 || port > 65535) {
    callback(new Error('请输入 1-65535 之间的端口'))
    return
  }
  callback()
}

const rules: FormRules = {
  bindAddress: [{ required: true, message: '请输入监听 IP', trigger: 'blur' }],
  httpPort: [{ validator: validatePort, trigger: 'blur' }],
  httpsPort: [{ validator: validatePort, trigger: 'blur' }],
  httpsCertificateFile: [{
    validator: (_rule, value, callback) => {
      if (form.httpsEnabled && !String(value || '').trim()) {
        callback(new Error('启用 HTTPS 时必须填写证书文件'))
        return
      }
      callback()
    },
    trigger: 'blur'
  }],
  httpsPrivateKeyFile: [{
    validator: (_rule, value, callback) => {
      if (form.httpsEnabled && !String(value || '').trim()) {
        callback(new Error('启用 HTTPS 时必须填写私钥文件'))
        return
      }
      callback()
    },
    trigger: 'blur'
  }]
}

const certificateNames = computed(() => {
  const certificate = current.value?.certificate
  if (!certificate?.valid) return ''
  return [...(certificate.ipAddresses || []), ...(certificate.dnsNames || [])].join('、')
})

const applySettings = (settings: NetworkSettings) => {
  current.value = settings
  form.bindAddress = settings.bindAddress || '0.0.0.0'
  form.httpPort = settings.httpPort || '8089'
  form.httpsEnabled = Boolean(settings.httpsEnabled)
  form.httpsPort = settings.httpsPort || '8443'
  form.httpsCertificateFile = settings.httpsCertificateFile || ''
  form.httpsPrivateKeyFile = settings.httpsPrivateKeyFile || ''
  proxyText.value = (settings.trustedProxies || []).join('\n')
}

const loadSettings = async () => {
  loading.value = true
  try {
    const { data } = await Api.getPanelNetwork()
    applySettings(data)
  } catch {
    ElMessage.error('获取面板访问配置失败')
  } finally {
    loading.value = false
  }
}

const applyStatusTitle = computed(() => {
  const transaction = current.value?.applyTransaction
  if (!transaction) return ''
  switch (transaction.status) {
    case 'scheduled':
      return '访问配置已保存，systemd 即将自动重启面板'
    case 'applying':
      return '正在应用新的访问配置并执行就绪检查'
    case 'succeeded':
      return '新的访问配置已自动应用'
    case 'rolled_back':
      return '新配置启动失败，已自动恢复原访问配置'
    case 'failed':
      return '访问配置自动应用失败，需要检查 systemd 状态'
    default:
      return ''
  }
})

const applyStatusType = computed(() => {
  const status = current.value?.applyTransaction?.status
  if (status === 'succeeded') return 'success'
  if (status === 'rolled_back' || status === 'failed') return 'error'
  return 'warning'
})

const browserHTTPOrigin = (url: string) => {
  const browserHost = window.location.hostname.includes(':')
    ? `[${window.location.hostname.replace(/^\[|\]$/g, '')}]`
    : window.location.hostname
  return url.replace('服务器IP', browserHost).replace(/\/+$/, '')
}

const stopApplyPolling = () => {
  if (applyPollTimer !== undefined) {
    window.clearTimeout(applyPollTimer)
    applyPollTimer = undefined
  }
  applyPolling.value = false
}

const followNetworkTransaction = async (
  transaction: NetworkApplyTransaction,
  attempts = 0
) => {
  if (attempts >= 50) {
    stopApplyPolling()
    ElMessage.warning('面板重启时间较长，请稍后使用新地址访问并检查 systemd 状态')
    return
  }
  applyPolling.value = true
  try {
    const { data } = await Api.getPanelNetworkTransaction(transaction.id)
    current.value = {
      ...(current.value as NetworkSettings),
      applyTransaction: data
    }
    if (data.status === 'succeeded') {
      stopApplyPolling()
      const newOrigin = browserHTTPOrigin(data.httpUrl)
      if (newOrigin !== window.location.origin) {
        ElMessage.success('新访问地址已就绪，正在跳转')
        window.location.assign(`${newOrigin}${window.location.pathname}${window.location.hash}`)
      } else {
        ElMessage.success('访问配置已自动应用')
        await loadSettings()
      }
      return
    }
    if (data.status === 'rolled_back' || data.status === 'failed') {
      stopApplyPolling()
      ElMessage.error(data.error || '新配置启动失败，已恢复原访问方式')
      await loadSettings()
      return
    }
  } catch {
    const newOrigin = browserHTTPOrigin(transaction.httpUrl)
    try {
      await window.fetch(`${newOrigin}/health/ready`, {
        method: 'GET',
        cache: 'no-store',
        mode: newOrigin === window.location.origin ? 'same-origin' : 'no-cors'
      })
      if (newOrigin !== window.location.origin) {
        stopApplyPolling()
        window.location.assign(`${newOrigin}${window.location.pathname}${window.location.hash}`)
        return
      }
    } catch {
      // 重启窗口内旧地址和新地址都可能短暂不可达，继续轮询。
    }
  }
  applyPollTimer = window.setTimeout(
    () => followNetworkTransaction(transaction, attempts + 1),
    1500
  )
}

const saveSettings = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (form.httpsEnabled && form.httpPort === form.httpsPort) {
    ElMessage.error('HTTP 与 HTTPS 必须使用不同端口')
    return
  }
  try {
    await ElMessageBox.confirm(
      '保存前会检查端口占用、证书和私钥。受管 systemd 环境会自动重启并验证新地址；如果启动失败，将恢复原配置。',
      '确认更新访问配置',
      { type: 'warning', confirmButtonText: '保存并自动应用', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  saving.value = true
  try {
    const trustedProxies = proxyText.value
      .split(/[\n,]+/)
      .map(item => item.trim())
      .filter(Boolean)
    const panelEntryEnabled = Boolean(current.value?.panelEntryEnabled)
    const { data } = await Api.updatePanelNetwork({
      ...form,
      trustedProxies,
      panelEntryEnabled,
      panelEntryPath: panelEntryEnabled ? (current.value?.panelEntryPath || '') : '',
      rotatePanelEntry: false
    })
    applySettings(data)
    if (data.applyTransaction) {
      ElMessage.success('配置已保存，将自动重启并验证；失败时会恢复原配置')
      void followNetworkTransaction(data.applyTransaction)
    } else if (data.restartRequired) {
      ElMessage.warning('当前不是受管 systemd 环境，配置已保存，请手动重启面板')
    } else {
      ElMessage.success('配置校验通过')
    }
  } catch {
    ElMessage.error('访问配置保存失败，请检查端口、证书文件和私钥文件')
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
onBeforeUnmount(stopApplyPolling)
</script>

<template>
  <section class="network-setting" v-loading="loading">
    <div class="network-setting__header">
      <div class="network-setting__heading">
        <div class="network-setting__title">面板访问方式</div>
        <p class="network-setting__subtitle">配置面板入口、HTTPS 证书和可信代理，保证远程访问稳定且安全。</p>
      </div>
      <el-button class="network-setting__refresh" @click="loadSettings">刷新</el-button>
    </div>

    <div class="network-overview">
      <div class="network-overview__intro">
        <div class="network-overview__tag">HTTP 默认保留</div>
        <p class="network-overview__text">
          面板默认监听服务器网卡，可直接使用服务器 IP 访问。HTTPS 是可选的独立入口；启用后不会关闭 HTTP，也不会自动强制跳转。
        </p>
      </div>
      <div v-if="current" class="network-overview__cards">
        <div class="summary-card">
          <span class="summary-card__label">HTTP 地址</span>
          <strong class="summary-card__value">{{ current.httpAccessUrl }}</strong>
        </div>
        <div class="summary-card">
          <span class="summary-card__label">HTTPS 地址</span>
          <strong class="summary-card__value">{{ current.httpsEnabled ? current.httpsAccessUrl : '未启用（可选）' }}</strong>
        </div>
        <div class="summary-card">
          <span class="summary-card__label">当前监听</span>
          <strong class="summary-card__value">{{ current.bindAddress }}:{{ current.httpPort }}</strong>
        </div>
      </div>
    </div>

    <el-alert
      v-if="current?.restartRequired"
      class="setting-alert"
      :title="current.autoApplySupported
        ? '配置正在由 systemd 自动应用，启动失败会恢复原配置。'
        : '当前不是受管 systemd 环境；配置已保存，请手动重启面板服务。'"
      type="warning"
      :closable="false"
      show-icon
    />

    <el-alert
      v-if="current?.applyTransaction"
      class="setting-alert"
      :title="applyStatusTitle"
      :type="applyStatusType"
      :closable="false"
      show-icon
      :description="current.applyTransaction.error || (applyPolling ? '页面会持续检查状态，新地址就绪后自动跳转。' : '')"
    />

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="network-form">
      <div class="form-section">
        <div class="form-section__header">
          <div>
            <h3>基础访问</h3>
            <p>配置监听地址和默认 HTTP 入口，确保面板始终可访问。</p>
          </div>
        </div>
        <div class="form-grid">
          <el-form-item label="监听 IP" prop="bindAddress">
            <el-input v-model="form.bindAddress" placeholder="0.0.0.0" />
            <div class="form-tip">默认 0.0.0.0，表示监听服务器所有 IPv4 网卡，用户可使用任一可达服务器 IP。</div>
          </el-form-item>

          <el-form-item label="HTTP 端口" prop="httpPort">
            <el-input v-model="form.httpPort" placeholder="8089" />
            <div class="form-tip">HTTP 始终保留，防止 HTTPS 证书或域名配置问题导致面板失联。</div>
          </el-form-item>
        </div>
      </div>

      <div class="form-section">
        <div class="https-toggle">
          <div class="https-toggle__content">
            <span class="https-toggle__title">启用 HTTPS（可选）</span>
            <span class="https-toggle__desc">开启独立加密入口，但不会替换当前 HTTP 地址。</span>
          </div>
          <el-switch v-model="form.httpsEnabled" />
        </div>

        <template v-if="form.httpsEnabled">
          <div class="form-section__header form-section__header--compact">
            <div>
              <h3>HTTPS 配置</h3>
              <p>保存时会校验证书和私钥是否匹配，以及端口是否可用。</p>
            </div>
          </div>

          <div class="form-grid">
            <el-form-item label="HTTPS 端口" prop="httpsPort">
              <el-input v-model="form.httpsPort" placeholder="8443" />
            </el-form-item>

            <div class="form-grid__spacer" />

            <el-form-item class="form-grid__full" label="证书文件" prop="httpsCertificateFile">
              <el-input v-model="form.httpsCertificateFile" placeholder="/usr/local/one/certificates/panel/fullchain.pem" />
            </el-form-item>
            <el-form-item class="form-grid__full" label="私钥文件" prop="httpsPrivateKeyFile">
              <el-input v-model="form.httpsPrivateKeyFile" placeholder="/usr/local/one/certificates/panel/privkey.pem" />
            </el-form-item>
          </div>

          <el-alert
            v-if="current?.certificate"
            class="certificate-status"
            :type="current.certificate.valid ? 'success' : 'error'"
            :closable="false"
            show-icon
            :title="current.certificate.valid ? '证书与私钥匹配且在有效期内' : '证书不可用'"
            :description="current.certificate.valid
              ? `证书名称：${certificateNames || '证书未声明 DNS/IP SAN；使用 IP 访问 HTTPS 时浏览器可能告警'}`
              : current.certificate.error"
          />
        </template>
      </div>

      <div class="form-section">
        <div class="form-section__header form-section__header--compact">
          <div>
            <h3>可信反向代理</h3>
            <p>仅在你确认请求会经过自有代理层时填写，避免来源头被伪造。</p>
          </div>
        </div>

        <el-form-item label="代理地址白名单">
          <el-input
            v-model="proxyText"
            type="textarea"
            :rows="4"
            placeholder="默认留空；如使用 Nginx/Caddy 反代，一行填写一个代理 IP 或 CIDR"
          />
          <div class="form-tip">留空时不信任任何转发头，直接 IP 访问最安全。只填写实际由你管理的反向代理地址。</div>
        </el-form-item>
      </div>

      <div class="network-form__footer">
        <el-button type="primary" :loading="saving || applyPolling" @click="saveSettings">
          {{ applyPolling ? '正在应用配置' : '校验并保存' }}
        </el-button>
      </div>
    </el-form>
  </section>
</template>

<style scoped lang="less">
.network-setting {
  padding: 28px 0 34px;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 20px;
  }

  &__heading {
    min-width: 0;
  }

  &__eyebrow {
    margin: 0 0 8px;
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
  }

  &__title {
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

  &__subtitle {
    max-width: 720px;
    margin: 0;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.75;
  }

  &__refresh {
    min-width: 88px;
    flex-shrink: 0;
  }
}

.network-overview {
  padding: 22px;
  margin-top: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));

  &__intro {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 18px;
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(var(--primary-color), 0.08);
    color: rgb(var(--primary-color));
    font-size: 12px;
    font-weight: 700;
  }

  &__text {
    margin: 0;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.8;
  }

  &__cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
}

.summary-card {
  padding: 16px 18px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04), 0 10px 24px rgba(15, 23, 42, 0.04);

  &__label {
    display: block;
    margin-bottom: 8px;
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 600;
  }

  &__value {
    display: block;
    color: var(--text-primary);
    font-size: 15px;
    line-height: 1.7;
    word-break: break-all;
  }
}

.setting-alert,
.network-form {
  margin-top: 18px;
}

.network-form {
  padding: 24px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: #fff;

  &__footer {
    display: flex;
    justify-content: flex-start;
    margin-top: 8px;
  }
}

.form-tip {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.7;
}

.certificate-status {
  margin-top: 2px;
}

.form-section + .form-section {
  margin-top: 26px;
  padding-top: 26px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
}

.form-section__header {
  margin-bottom: 16px;

  h3 {
    margin: 0 0 6px;
    color: var(--text-primary);
    font-size: 17px;
    font-weight: 700;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.7;
  }
}

.form-section__header--compact {
  margin-top: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;

  &__full {
    grid-column: 1 / -1;
  }

  &__spacer {
    display: block;
  }
}

.https-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 16px;
  background: var(--surface-subtle);

  &__content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 700;
  }

  &__desc {
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.7;
  }
}

:deep(.network-form .el-form-item) {
  margin-bottom: 20px;
}

:deep(.network-form .el-form-item__label) {
  color: var(--text-primary);
  font-weight: 700;
}

:deep(.network-form .el-input__wrapper),
:deep(.network-form .el-textarea__inner) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.16) inset;
}

:deep(.network-form .el-switch) {
  --el-switch-on-color: rgb(var(--primary-color));
}

@media (max-width: 1024px) {
  .network-overview__cards,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-grid__spacer {
    display: none;
  }
}

@media (max-width: 700px) {
  .network-setting {
    padding: 24px 0 28px;

    &__header {
      flex-direction: column;
      align-items: stretch;
    }

    &__title {
      font-size: 22px;

      &::before {
        height: 22px;
      }
    }
  }

  .network-overview,
  .network-form {
    padding: 16px;
  }

  .https-toggle {
    flex-direction: column;
    align-items: flex-start;
  }

  .network-form__footer {
    justify-content: stretch;
  }

  :deep(.network-form .el-button--primary) {
    width: 100%;
  }
}
</style>
