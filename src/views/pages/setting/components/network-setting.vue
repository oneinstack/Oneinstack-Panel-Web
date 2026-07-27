<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
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
  certificate?: CertificateStatus
  restartRequired: boolean
}

const loading = ref(false)
const saving = ref(false)
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
      '保存前会检查端口占用、证书和私钥。配置保存后需要重启面板服务，当前 HTTP 访问不会立即中断。',
      '确认更新访问配置',
      { type: 'warning', confirmButtonText: '校验并保存', cancelButtonText: '取消' }
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
    const { data } = await Api.updatePanelNetwork({
      ...form,
      trustedProxies
    })
    applySettings(data)
    ElMessage.success(data.restartRequired ? '配置已保存，请重启面板服务后生效' : '配置校验通过')
  } catch {
    ElMessage.error('访问配置保存失败，请检查端口、证书文件和私钥文件')
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <section class="network-setting" v-loading="loading">
    <div class="network-setting__header">
      <div class="network-setting__title">面板访问方式</div>
      <el-button @click="loadSettings">刷新</el-button>
    </div>

    <el-alert
      title="HTTP 是默认访问方式"
      type="info"
      :closable="false"
      show-icon
      description="面板默认监听服务器网卡，可直接使用服务器 IP 访问。HTTPS 是可选的独立入口；启用后不会关闭 HTTP，也不会自动强制跳转。"
    />

    <el-alert
      v-if="current?.restartRequired"
      class="setting-alert"
      title="配置已保存但尚未生效，请在确认防火墙或云安全组已放行新端口后重启面板服务。"
      type="warning"
      :closable="false"
      show-icon
    />

    <el-descriptions v-if="current" class="access-summary" :column="1" border>
      <el-descriptions-item label="HTTP 访问地址">{{ current.httpAccessUrl }}</el-descriptions-item>
      <el-descriptions-item label="HTTPS 访问地址">
        {{ current.httpsEnabled ? current.httpsAccessUrl : '未启用（可选）' }}
      </el-descriptions-item>
    </el-descriptions>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="network-form">
      <el-form-item label="监听 IP" prop="bindAddress">
        <el-input v-model="form.bindAddress" placeholder="0.0.0.0" />
        <div class="form-tip">默认 0.0.0.0，表示监听服务器所有 IPv4 网卡，用户可使用任一可达服务器 IP。</div>
      </el-form-item>

      <el-form-item label="HTTP 端口" prop="httpPort">
        <el-input v-model="form.httpPort" placeholder="8089" />
        <div class="form-tip">HTTP 始终保留，防止 HTTPS 证书或域名配置问题导致面板失联。</div>
      </el-form-item>

      <el-form-item label="启用 HTTPS（可选）">
        <el-switch v-model="form.httpsEnabled" />
      </el-form-item>

      <template v-if="form.httpsEnabled">
        <el-form-item label="HTTPS 端口" prop="httpsPort">
          <el-input v-model="form.httpsPort" placeholder="8443" />
        </el-form-item>
        <el-form-item label="证书文件" prop="httpsCertificateFile">
          <el-input v-model="form.httpsCertificateFile" placeholder="/usr/local/one/certificates/panel/fullchain.pem" />
        </el-form-item>
        <el-form-item label="私钥文件" prop="httpsPrivateKeyFile">
          <el-input v-model="form.httpsPrivateKeyFile" placeholder="/usr/local/one/certificates/panel/privkey.pem" />
        </el-form-item>
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

      <el-form-item label="可信反向代理">
        <el-input
          v-model="proxyText"
          type="textarea"
          :rows="3"
          placeholder="默认留空；如使用 Nginx/Caddy 反代，一行填写一个代理 IP 或 CIDR"
        />
        <div class="form-tip">留空时不信任任何转发头，直接 IP 访问最安全。只填写实际由你管理的反向代理地址。</div>
      </el-form-item>

      <el-button type="primary" :loading="saving" @click="saveSettings">校验并保存</el-button>
    </el-form>
  </section>
</template>

<style scoped lang="less">
.network-setting {
  padding: 26px 0 30px;
  border-bottom: 1px solid var(--border-subtle);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  &__title {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 650;
    color: var(--text-primary);

    &::before {
      width: 3px;
      height: 17px;
      margin-right: 9px;
      content: '';
      border-radius: 99px;
      background: rgb(var(--primary-color));
    }
  }
}

.setting-alert,
.access-summary,
.network-form {
  margin-top: 18px;
}

.network-form {
  max-width: 760px;
  padding: 22px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-subtle);
}

.form-tip {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 11px;
  line-height: 1.6;
}

.certificate-status {
  margin: 0 0 18px;
}

@media (max-width: 700px) {
  .network-form {
    padding: 16px;
  }
}
</style>
