<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Api } from '@/api/modules'
import System from '@/utils/System'
import { ElMessage } from 'element-plus'
import { Close, FolderOpened, Lock, Refresh, SwitchButton } from '@element-plus/icons-vue'
import WebsiteCertificateDrawer from './WebsiteCertificateDrawer.vue'
import { isOperationCancelled, submitOperation } from '@/utils/operationPreview'
import i18n from '@/lang'

interface Props {
  modelValue: boolean
  website: Record<string, any> | null
}

const props = defineProps<Props>()
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
  saving: false,
  document: null as any,
  settings: {} as any,
  config: { loading: false, saving: false, loaded: false, content: '', revision: '', path: '', error: '' },
  logs: { loading: false, type: 'access' as 'access' | 'error', lines: 300, content: '', path: '' }
})
const activeMenu = ref('domain')
const domainLines = ref('')
const expiresAt = ref<Date | string | undefined>()
const statusLoading = ref(false)
const currentWebsite = computed(() => state.document?.website || props.website || {})
const certificate = reactive({ show: false, website: {} as Record<string, any> })
const t = i18n.t as any

const menus = computed(() => [
  { key: 'domain', label: t('website.settingsDrawer.menus.domain') },
  { key: 'binding', label: t('website.settingsDrawer.menus.binding'), hidden: currentWebsite.value.type === 'proxy' },
  { key: 'directory', label: t('website.settingsDrawer.menus.directory'), hidden: currentWebsite.value.type === 'proxy' },
  { key: 'access', label: t('website.settingsDrawer.menus.access') },
  { key: 'traffic', label: t('website.settingsDrawer.menus.traffic') },
  { key: 'rewrite', label: t('website.settingsDrawer.menus.rewrite'), hidden: currentWebsite.value.type === 'proxy' },
  { key: 'documents', label: t('website.settingsDrawer.menus.documents'), hidden: currentWebsite.value.type === 'proxy' },
  { key: 'config', label: t('website.settingsDrawer.menus.config') },
  { key: 'ssl', label: t('website.settingsDrawer.menus.ssl') },
  { key: 'php', label: t('website.settingsDrawer.menus.php'), hidden: currentWebsite.value.type !== 'php' },
  { key: 'redirect', label: t('website.settingsDrawer.menus.redirect') },
  { key: 'proxy', label: t('website.settingsDrawer.menus.proxy') },
  { key: 'hotlink', label: t('website.settingsDrawer.menus.hotlink') },
  { key: 'tamper', label: t('website.settingsDrawer.menus.tamper') },
  { key: 'security', label: t('website.settingsDrawer.menus.security') },
  { key: 'logs', label: t('website.settingsDrawer.menus.logs') },
  { key: 'alerts', label: t('website.settingsDrawer.menus.alerts') },
  { key: 'other', label: t('website.settingsDrawer.menus.other') }
].filter((item) => !item.hidden))

const formatTime = (value?: string | Date | null) => {
  if (!value) return t('website.settingsDrawer.permanent')
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(i18n.locale, { hour12: false })
}
const formatBytes = (value: unknown) => {
  let bytes = Number(value || 0)
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  while (bytes >= 1024 && index < units.length - 1) { bytes /= 1024; index++ }
  return `${bytes >= 100 || index === 0 ? bytes.toFixed(0) : bytes.toFixed(2)} ${units[index]}`
}
const isExpired = computed(() => Boolean(currentWebsite.value.expires_at && new Date(currentWebsite.value.expires_at).getTime() <= Date.now()))

const buildWebsiteProfilePayload = (overrides: Record<string, any> = {}) => ({
  id: Number(currentWebsite.value.id || 0),
  name: currentWebsite.value.name,
  domain: currentWebsite.value.domain,
  root_dir: currentWebsite.value.root_dir,
  dir: currentWebsite.value.dir,
  remark: currentWebsite.value.remark,
  type: currentWebsite.value.type,
  class: currentWebsite.value.class,
  pact: currentWebsite.value.pact,
  tar_url: currentWebsite.value.tar_url,
  send_url: currentWebsite.value.send_url,
  enabled: Boolean(currentWebsite.value.enabled),
  expires_at: expiresAt.value ? new Date(expiresAt.value).toISOString() : null,
  ...overrides
})

const hydrateDocument = (data: any) => {
  const runtime = props.website || {}
  data.website = {
    ...(data.website || {}),
    ssl_enabled: runtime.ssl_enabled,
    certificate_status: runtime.certificate_status,
    certificate_expires_at: runtime.certificate_expires_at,
    today_traffic_bytes: runtime.today_traffic_bytes,
    today_requests: runtime.today_requests
  }
  state.document = data
}

const load = async () => {
  const websiteId = Number(props.website?.id || 0)
  if (!websiteId) return
  state.loading = true
  try {
    const { data } = await Api.getWebsiteSettings(websiteId)
    hydrateDocument(data)
    state.settings = structuredClone(data.settings || {})
    state.settings.bindings ||= []
    state.settings.redirects ||= []
    state.settings.proxy_rules ||= []
    domainLines.value = String(data.website?.domain || '').split(',').join('\n')
    expiresAt.value = data.website?.expires_at ? new Date(data.website.expires_at) : undefined
  } finally { state.loading = false }
}

watch(() => props.modelValue, (value) => {
  if (!value) return
  activeMenu.value = 'domain'
  state.config.loaded = false
  state.config.error = ''
  void load()
})

const selectMenu = (key: string) => {
  activeMenu.value = key
  if (key === 'config' && !state.config.loaded) void loadConfig()
  if (key === 'logs') void loadLog()
}
const saveSettings = async (success = i18n.t('website.notifications.settingsPublished')) => {
  const websiteId = Number(currentWebsite.value.id || 0)
  if (!websiteId) return
  state.saving = true
  try {
    await submitOperation('website.settings.update', {
      websiteId,
      settings: structuredClone(state.settings)
    })
    await load()
    ElMessage.success(success)
    emit('changed')
  } catch (error: any) {
    if (isOperationCancelled(error)) return
    ElMessage.error(error?.message || i18n.t('common.operationFailed'))
  } finally { state.saving = false }
}
const saveWebsiteProfile = async (domainOnly = false) => {
  const domains = domainLines.value.split(/[,\n\r]+/).map((item) => item.trim()).filter(Boolean)
  if (!domains.length) { ElMessage.warning(i18n.t('website.notifications.domainRequired')); return }
  state.saving = true
  try {
    await submitOperation('website.update', buildWebsiteProfilePayload({
      domain: domains.join(',')
    }))
    ElMessage.success(i18n.t(domainOnly ? 'website.notifications.domainUpdated' : 'website.notifications.profileUpdated'))
    await load()
    emit('changed')
  } catch (error: any) {
    if (isOperationCancelled(error)) return
    ElMessage.error(error?.message || i18n.t('common.operationFailed'))
  } finally { state.saving = false }
}
const toggleStatus = async (enabled: boolean) => {
  statusLoading.value = true
  try {
    await submitOperation('website.toggle', {
      id: Number(currentWebsite.value.id),
      enabled
    })
    ElMessage.success(i18n.t(enabled ? 'website.notifications.enabled' : 'website.notifications.disabled'))
    await load()
    emit('changed')
  } catch (error: any) {
    if (isOperationCancelled(error)) return
    ElMessage.error(error?.message || i18n.t('common.operationFailed'))
  } finally { statusLoading.value = false }
}
const loadConfig = async () => {
  state.config.loading = true
  state.config.error = ''
  try {
    const { data } = await Api.getWebsiteManagedConfig(Number(currentWebsite.value.id))
    Object.assign(state.config, { content: data.content || '', revision: data.revision || '', path: data.path || '', loaded: true })
  } catch (error: any) {
    state.config.loaded = false
    const response = error?.response?.data
    state.config.error = response?.error?.detail || response?.message || error?.message || i18n.t('website.notifications.configLoadFailed')
  } finally { state.config.loading = false }
}
const saveConfig = async () => {
  state.config.saving = true
  try {
    await submitOperation('website.config.update', {
      websiteId: Number(currentWebsite.value.id),
      content: state.config.content,
      revision: state.config.revision
    })
    await loadConfig()
    ElMessage.success(i18n.t('website.notifications.configReloaded'))
    emit('changed')
  } catch (error: any) {
    if (isOperationCancelled(error)) return
    ElMessage.error(error?.message || i18n.t('common.operationFailed'))
  } finally { state.config.saving = false }
}
const loadLog = async () => {
  state.logs.loading = true
  try {
    const { data } = await Api.getWebsiteLog(Number(currentWebsite.value.id), { type: state.logs.type, lines: state.logs.lines })
    state.logs.content = data.content || ''
    state.logs.path = data.path || ''
  } finally { state.logs.loading = false }
}
const addBinding = () => state.settings.bindings.push({ path: '', directory: '', enabled: true })
const addRedirect = () => state.settings.redirects.push({ source: '', target: '', status: 301, enabled: true })
const addProxy = () => state.settings.proxy_rules.push({ path: '', target: '', host: '$host', enabled: true })
const removeAt = (list: any[], index: number) => list.splice(index, 1)
const openRoot = () => {
  const path = String(currentWebsite.value.root_dir || '')
  if (path) System.router.push({ path: '/file', query: { path } })
}
const openCertificate = () => {
  certificate.website = currentWebsite.value
  certificate.show = true
}
</script>

<template>
  <el-dialog
    v-model="visible"
    class="website-settings-dialog"
    width="min(980px, calc(100vw - 56px))"
    :show-close="false"
    align-center
    append-to-body
    destroy-on-close
  >
    <div v-loading="state.loading" class="settings-layout">
      <header class="settings-header">
        <div class="settings-header__title">
          <div class="settings-header__mark">W</div>
          <div><span>SITE CONFIGURATION</span><h2>{{ currentWebsite.name || t('website.settingsDrawer.title') }}</h2><p>{{ t('website.settingsDrawer.addedAt', { time: formatTime(currentWebsite.create_time) }) }}</p></div>
        </div>
        <div class="settings-header__summary">
          <div><span>{{ t('website.todayTraffic') }}</span><strong>{{ formatBytes(props.website?.today_traffic_bytes) }}</strong></div>
          <div><span>{{ t('website.expiration') }}</span><strong :class="{ expired: isExpired }">{{ formatTime(currentWebsite.expires_at) }}</strong></div>
          <el-switch :model-value="Boolean(currentWebsite.enabled)" :loading="statusLoading" inline-prompt :active-text="t('website.settingsDrawer.enabled')" :inactive-text="t('website.settingsDrawer.disabled')" @change="toggleStatus(Boolean($event))" />
          <el-button class="settings-close" text :icon="Close" @click="visible = false" />
        </div>
      </header>
      <div class="settings-body">
        <aside class="settings-nav">
          <button v-for="item in menus" :key="item.key" type="button" :class="{ active: activeMenu === item.key }" @click="selectMenu(item.key)">{{ item.label }}</button>
        </aside>
        <main class="settings-content">
          <section v-if="activeMenu === 'domain'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.domain') }}</h3><p>{{ t('website.settingsDrawer.domainDescription') }}</p></div></div>
            <el-input v-model="domainLines" type="textarea" :rows="7" placeholder="example.com&#10;www.example.com" />
            <div class="domain-preview"><span v-for="domain in domainLines.split(/[,\n\r]+/).filter(Boolean)" :key="domain">{{ domain.trim() }}</span></div>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveWebsiteProfile(true)">{{ t('website.settingsDrawer.saveDomain') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'binding'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.binding') }}</h3><p>{{ t('website.settingsDrawer.bindingDescription') }}</p></div><el-button type="primary" plain @click="addBinding">{{ t('website.settingsDrawer.addBinding') }}</el-button></div>
            <div v-for="(item, index) in state.settings.bindings" :key="index" class="rule-row rule-row--binding">
              <el-switch v-model="item.enabled" /><el-input v-model="item.path" :placeholder="t('website.settingsDrawer.bindingPath')" /><el-input v-model="item.directory" :placeholder="t('website.settingsDrawer.bindingDirectory')" /><el-button type="danger" link @click="removeAt(state.settings.bindings, index)">{{ t('website.settingsDrawer.delete') }}</el-button>
            </div>
            <el-empty v-if="!state.settings.bindings?.length" :description="t('website.settingsDrawer.noBindings')" :image-size="72" />
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings(t('website.settingsDrawer.published.binding'))">{{ t('website.settingsDrawer.savePublish') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'directory'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.directory') }}</h3><p>{{ t('website.settingsDrawer.directoryDescription') }}</p></div></div>
            <el-form label-position="top" class="settings-form">
              <el-form-item :label="t('website.settingsDrawer.websiteRoot')"><el-input :model-value="currentWebsite.root_dir" readonly><template #append><el-button :icon="FolderOpened" @click="openRoot">{{ t('website.settingsDrawer.fileManager') }}</el-button></template></el-input></el-form-item>
              <el-form-item :label="t('website.settingsDrawer.runningDirectory')"><el-input v-model="state.settings.running_directory" :placeholder="t('website.settingsDrawer.runningDirectoryPlaceholder')" /></el-form-item>
              <el-form-item :label="t('website.settingsDrawer.directoryListing')"><el-switch v-model="state.settings.directory_listing" :active-text="t('website.settingsDrawer.allowDirectoryListing')" :inactive-text="t('website.settingsDrawer.denyDirectoryListing')" /></el-form-item>
            </el-form>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings(t('website.settingsDrawer.published.directory'))">{{ t('website.settingsDrawer.savePublish') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'access'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.access') }}</h3><p>{{ t('website.settingsDrawer.accessDescription') }}</p></div></div>
            <div class="form-grid"><el-form-item :label="t('website.settingsDrawer.allowlist')"><el-input v-model="state.settings.allowed_ips" type="textarea" :rows="10" placeholder="192.168.1.0/24&#10;2001:db8::/32" /></el-form-item><el-form-item :label="t('website.settingsDrawer.denylist')"><el-input v-model="state.settings.denied_ips" type="textarea" :rows="10" placeholder="203.0.113.8" /></el-form-item></div>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings(t('website.settingsDrawer.published.access'))">{{ t('website.settingsDrawer.savePublish') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'traffic'" class="setting-panel">
            <div class="metric-strip"><div><span>{{ t('website.todayTraffic') }}</span><strong>{{ formatBytes(props.website?.today_traffic_bytes) }}</strong></div><div><span>{{ t('website.settingsDrawer.todayRequests') }}</span><strong>{{ Number(props.website?.today_requests || 0).toLocaleString() }}</strong></div><div><span>{{ t('website.settingsDrawer.metricSource') }}</span><strong>{{ t('website.settingsDrawer.accessLog') }}</strong></div></div>
            <el-form label-position="top" class="settings-form form-grid"><el-form-item :label="t('website.settingsDrawer.requestRate')"><el-input-number v-model="state.settings.rate_limit_kb" :min="0" :max="10485760" controls-position="right" /><small>{{ t('website.settingsDrawer.unlimitedTip') }}</small></el-form-item><el-form-item :label="t('website.settingsDrawer.rateAfter')"><el-input-number v-model="state.settings.rate_limit_after_kb" :min="0" :max="10485760" controls-position="right" /></el-form-item></el-form>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings(t('website.settingsDrawer.published.traffic'))">{{ t('website.settingsDrawer.savePublish') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'rewrite'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.rewrite') }}</h3><p>{{ t('website.settingsDrawer.rewriteDescription') }}</p></div></div>
            <el-input v-model="state.settings.rewrite_rules" type="textarea" :rows="16" class="code-input" placeholder="rewrite ^/article/(\d+)$ /index.php?id=$1 last;" />
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings(t('website.settingsDrawer.published.rewrite'))">{{ t('website.settingsDrawer.savePublish') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'documents'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.documents') }}</h3><p>{{ t('website.settingsDrawer.documentsDescription') }}</p></div></div>
            <el-form label-position="top" class="settings-form"><el-form-item :label="t('website.settingsDrawer.defaultDocuments')"><el-input v-model="state.settings.default_documents" placeholder="index.php index.html index.htm" /></el-form-item></el-form>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings(t('website.settingsDrawer.published.documents'))">{{ t('website.settingsDrawer.savePublish') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'config'" v-loading="state.config.loading" class="setting-panel setting-panel--fill">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.config') }}</h3><p>{{ state.config.path || t('website.settingsDrawer.configDescription') }}</p></div><el-button :icon="Refresh" @click="loadConfig">{{ t('website.settingsDrawer.reread') }}</el-button></div>
            <el-alert v-if="state.config.error" :title="state.config.error" type="error" show-icon :closable="false"><template #default><el-button type="primary" link @click="loadConfig">{{ t('website.settingsDrawer.readAgain') }}</el-button></template></el-alert>
            <el-alert :title="t('website.settingsDrawer.configWarning')" type="warning" show-icon :closable="false" />
            <el-input v-if="state.config.loaded" v-model="state.config.content" type="textarea" class="code-input config-editor" />
            <el-empty v-else-if="!state.config.loading && !state.config.error" :description="t('website.settingsDrawer.configUnread')" :image-size="72" />
            <div class="panel-actions"><el-button type="primary" :loading="state.config.saving" :disabled="!currentWebsite.enabled || !state.config.loaded" @click="saveConfig">{{ t('website.settingsDrawer.validatePublish') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'ssl'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.ssl') }}</h3><p>{{ t('website.settingsDrawer.sslDescription') }}</p></div></div>
            <div class="feature-card"><el-icon><Lock /></el-icon><div><strong>{{ currentWebsite.ssl_enabled ? t('website.settingsDrawer.sslEnabled') : t('website.settingsDrawer.sslDisabled') }}</strong><p>{{ currentWebsite.certificate_expires_at ? t('website.settingsDrawer.certificateExpires', { time: formatTime(currentWebsite.certificate_expires_at) }) : t('website.settingsDrawer.certificateAvailable') }}</p></div><el-button type="primary" @click="openCertificate">{{ t('website.settingsDrawer.manageSsl') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'php'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.php') }}</h3><p>{{ t('website.settingsDrawer.phpDescription') }}</p></div></div>
            <el-form label-position="top" class="settings-form"><el-form-item :label="t('website.settingsDrawer.fastcgiBackend')"><el-input v-model="state.settings.php_backend" placeholder="unix:/dev/shm/php-cgi.sock" /></el-form-item></el-form>
            <el-alert :title="t('website.settingsDrawer.phpWarning')" type="info" :closable="false" show-icon />
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings(t('website.settingsDrawer.published.php'))">{{ t('website.settingsDrawer.savePublish') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'redirect'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.redirect') }}</h3><p>{{ t('website.settingsDrawer.redirectDescription') }}</p></div><el-button type="primary" plain @click="addRedirect">{{ t('website.settingsDrawer.addRedirect') }}</el-button></div>
            <div v-for="(item, index) in state.settings.redirects" :key="index" class="rule-row rule-row--redirect"><el-switch v-model="item.enabled" /><el-input v-model="item.source" :placeholder="t('website.settingsDrawer.redirectSource')" /><el-select v-model="item.status"><el-option v-for="status in [301,302,307,308]" :key="status" :value="status" :label="status" /></el-select><el-input v-model="item.target" :placeholder="t('website.settingsDrawer.redirectTarget')" /><el-button type="danger" link @click="removeAt(state.settings.redirects, index)">{{ t('website.settingsDrawer.delete') }}</el-button></div>
            <el-empty v-if="!state.settings.redirects?.length" :description="t('website.settingsDrawer.noRedirects')" :image-size="72" />
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings(t('website.settingsDrawer.published.redirect'))">{{ t('website.settingsDrawer.savePublish') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'proxy'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.proxy') }}</h3><p>{{ t('website.settingsDrawer.proxyDescription') }}</p></div><el-button type="primary" plain @click="addProxy">{{ t('website.settingsDrawer.addProxy') }}</el-button></div>
            <div v-for="(item, index) in state.settings.proxy_rules" :key="index" class="rule-row rule-row--proxy"><el-switch v-model="item.enabled" /><el-input v-model="item.path" :placeholder="t('website.settingsDrawer.proxyPath')" /><el-input v-model="item.target" placeholder="http://127.0.0.1:9000" /><el-input v-model="item.host" placeholder="$host" /><el-button type="danger" link @click="removeAt(state.settings.proxy_rules, index)">{{ t('website.settingsDrawer.delete') }}</el-button></div>
            <el-empty v-if="!state.settings.proxy_rules?.length" :description="t('website.settingsDrawer.noProxies')" :image-size="72" />
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings(t('website.settingsDrawer.published.proxy'))">{{ t('website.settingsDrawer.savePublish') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'hotlink'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.hotlink') }}</h3><p>{{ t('website.settingsDrawer.hotlinkDescription') }}</p></div></div>
            <el-form label-position="top" class="settings-form"><el-form-item :label="t('website.settingsDrawer.enableHotlink')"><el-switch v-model="state.settings.hotlink_enabled" /></el-form-item><el-form-item :label="t('website.settingsDrawer.allowEmptyReferer')"><el-switch v-model="state.settings.hotlink_allow_empty" /></el-form-item><el-form-item :label="t('website.settingsDrawer.allowedDomains')"><el-input v-model="state.settings.hotlink_domains" type="textarea" :rows="5" placeholder="cdn.example.com&#10;*.example.com" /></el-form-item><el-form-item :label="t('website.settingsDrawer.protectedExtensions')"><el-input v-model="state.settings.hotlink_extensions" placeholder="jpg jpeg png gif webp svg css js mp4 mp3" /></el-form-item></el-form>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings(t('website.settingsDrawer.published.hotlink'))">{{ t('website.settingsDrawer.savePublish') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'tamper'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.tamperTitle') }}</h3><p>{{ t('website.settingsDrawer.tamperDescription') }}</p></div></div>
            <div class="feature-card"><el-icon><SwitchButton /></el-icon><div><strong>{{ t('website.settingsDrawer.managedProtection') }}</strong><p>{{ t('website.settingsDrawer.managedProtectionTip') }}</p></div><el-switch v-model="state.settings.tamper_protection" /></div>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings(t('website.settingsDrawer.published.tamper'))">{{ t('website.settingsDrawer.saveSettings') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'security'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.security') }}</h3><p>{{ t('website.settingsDrawer.securityDescription') }}</p></div></div>
            <el-form label-position="top" class="settings-form"><el-form-item :label="t('website.settingsDrawer.securityHeaders')"><el-switch v-model="state.settings.security_headers" :active-text="t('website.settingsDrawer.enable')" /></el-form-item><el-form-item :label="t('website.settingsDrawer.deniedPaths')"><el-input v-model="state.settings.denied_paths" type="textarea" :rows="9" placeholder="/.git&#10;/.env&#10;/backup" /></el-form-item></el-form>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings(t('website.settingsDrawer.published.security'))">{{ t('website.settingsDrawer.savePublish') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'logs'" class="setting-panel setting-panel--fill">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.logs') }}</h3><p>{{ state.logs.path || t('website.settingsDrawer.logDescription') }}</p></div><div class="heading-actions"><el-select v-model="state.logs.type" @change="loadLog"><el-option :label="t('website.settingsDrawer.accessLogOption')" value="access" /><el-option :label="t('website.settingsDrawer.errorLogOption')" value="error" /></el-select><el-select v-model="state.logs.lines" @change="loadLog"><el-option v-for="count in [100, 300, 1000]" :key="count" :value="count" :label="t('website.settingsDrawer.lines', { count })" /></el-select><el-button :icon="Refresh" :loading="state.logs.loading" @click="loadLog">{{ t('common.refresh') }}</el-button></div></div>
            <pre class="log-viewer">{{ state.logs.content || t('website.settingsDrawer.noLogs') }}</pre>
          </section>

          <section v-else-if="activeMenu === 'alerts'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.alerts') }}</h3><p>{{ t('website.settingsDrawer.alertsDescription') }}</p></div></div>
            <el-form label-position="top" class="settings-form form-grid"><el-form-item :label="t('website.settingsDrawer.enableTrafficAlert')"><el-switch v-model="state.settings.traffic_alert" /></el-form-item><el-form-item :label="t('website.settingsDrawer.alertThreshold')"><el-input-number v-model="state.settings.traffic_alert_bytes" :min="0" :step="1073741824" controls-position="right" /></el-form-item></el-form>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings(t('website.settingsDrawer.published.alerts'))">{{ t('website.settingsDrawer.saveSettings') }}</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'other'" class="setting-panel">
            <div class="panel-heading"><div><h3>{{ t('website.settingsDrawer.menus.other') }}</h3><p>{{ t('website.settingsDrawer.otherDescription') }}</p></div></div>
            <el-form label-position="top" class="settings-form"><el-form-item :label="t('website.expiration')"><el-date-picker v-model="expiresAt" type="datetime" :placeholder="t('website.settingsDrawer.expirationPlaceholder')" clearable /></el-form-item><el-form-item :label="t('website.settingsDrawer.remark')"><el-input v-model="currentWebsite.remark" type="textarea" :rows="4" /></el-form-item><el-form-item :label="t('website.settingsDrawer.accessLogLabel')"><el-switch v-model="state.settings.access_log_enabled" :active-text="t('website.settingsDrawer.recordAccessLog')" /></el-form-item><el-form-item :label="t('website.settingsDrawer.errorLogLabel')"><el-switch v-model="state.settings.error_log_enabled" :active-text="t('website.settingsDrawer.recordErrorLog')" /></el-form-item></el-form>
            <div class="panel-actions panel-actions--split"><el-button :loading="state.saving" @click="saveSettings(t('website.settingsDrawer.published.logs'))">{{ t('website.settingsDrawer.saveLogs') }}</el-button><el-button type="primary" :loading="state.saving" @click="saveWebsiteProfile(false)">{{ t('website.settingsDrawer.saveProfile') }}</el-button></div>
          </section>
        </main>
      </div>
    </div>
    <website-certificate-drawer v-model="certificate.show" :website="certificate.website" @changed="load(); emit('changed')" />
  </el-dialog>
</template>

<style scoped lang="less">
.settings-layout { height: 100%; min-height: 0; display: flex; flex-direction: column; background: var(--surface-card); }
.settings-header { min-height: 82px; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; gap: 20px; border-bottom: 1px solid var(--border-subtle); }
.settings-header__title { min-width: 0; display: flex; align-items: center; gap: 14px; }
.settings-header__mark { width: 46px; height: 46px; flex: 0 0 46px; display: grid; place-items: center; border: 1px solid color-mix(in srgb, var(--el-color-primary) 28%, transparent); border-radius: 13px; color: var(--el-color-primary); background: color-mix(in srgb, var(--el-color-primary) 9%, transparent); font-size: 21px; font-weight: 800; }
.settings-header__title span { color: var(--el-color-primary); font-size: 10px; font-weight: 800; letter-spacing: .16em; }
.settings-header__title h2 { margin: 2px 0; overflow: hidden; color: var(--text-primary); font-size: 19px; text-overflow: ellipsis; white-space: nowrap; }
.settings-header__title p { margin: 0; color: var(--text-tertiary); font-size: 12px; }
.settings-header__summary { display: flex; align-items: center; gap: 16px; }
.settings-header__summary > div { display: flex; flex-direction: column; gap: 4px; }
.settings-header__summary span { color: var(--text-tertiary); font-size: 11px; }
.settings-header__summary strong { color: var(--text-primary); font-size: 13px; white-space: nowrap; }
.settings-header__summary strong.expired { color: var(--el-color-danger); }
.settings-close { margin-left: 4px; font-size: 22px; }
.settings-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 168px minmax(0, 1fr); }
.settings-nav { padding: 14px 10px 22px; overflow-y: auto; border-right: 1px solid var(--border-subtle); background: color-mix(in srgb, var(--surface-muted) 72%, var(--surface-card)); }
.settings-nav button { width: 100%; height: 42px; padding: 0 18px; border: 0; border-radius: 9px; color: var(--text-secondary); background: transparent; font-size: 13px; text-align: left; cursor: pointer; transition: .18s ease; }
.settings-nav button:hover { color: var(--text-primary); background: var(--surface-card); }
.settings-nav button.active { color: var(--el-color-primary); background: color-mix(in srgb, var(--el-color-primary) 10%, var(--surface-card)); font-weight: 650; box-shadow: inset 3px 0 var(--el-color-primary); }
.settings-content { min-width: 0; overflow-y: auto; padding: 22px 24px 30px; }
.setting-panel { min-height: 100%; display: flex; flex-direction: column; gap: 20px; }
.setting-panel--fill { height: 100%; }
.panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
.panel-heading h3 { margin: 0; color: var(--text-primary); font-size: 19px; }
.panel-heading p { margin: 7px 0 0; color: var(--text-tertiary); font-size: 12px; line-height: 1.65; }
.heading-actions { display: flex; align-items: center; gap: 8px; }
.heading-actions .el-select { width: 112px; }
.panel-actions { margin-top: auto; padding-top: 20px; display: flex; justify-content: flex-end; border-top: 1px solid var(--border-subtle); }
.panel-actions--split { justify-content: space-between; }
.settings-form { width: min(100%, 760px); }
.settings-form :deep(.el-input-number), .settings-form :deep(.el-date-editor) { width: 100%; }
.settings-form small { display: block; margin-top: 6px; color: var(--text-tertiary); }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.domain-preview { display: flex; flex-wrap: wrap; gap: 8px; }
.domain-preview span { padding: 7px 11px; border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-secondary); background: var(--surface-muted); font-size: 12px; }
.rule-row { padding: 13px 14px; display: grid; align-items: center; gap: 10px; border: 1px solid var(--border-subtle); border-radius: 11px; background: var(--surface-card); }
.rule-row--binding { grid-template-columns: auto minmax(150px, .7fr) minmax(220px, 1fr) auto; }
.rule-row--redirect { grid-template-columns: auto minmax(130px, .6fr) 90px minmax(220px, 1fr) auto; }
.rule-row--proxy { grid-template-columns: auto minmax(110px, .5fr) minmax(220px, 1fr) minmax(120px, .5fr) auto; }
.metric-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.metric-strip > div { padding: 17px 18px; display: flex; flex-direction: column; gap: 7px; border: 1px solid var(--border-subtle); border-radius: 12px; background: var(--surface-muted); }
.metric-strip span { color: var(--text-tertiary); font-size: 11px; }
.metric-strip strong { color: var(--text-primary); font-size: 18px; }
.feature-card { padding: 20px; display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; align-items: center; gap: 15px; border: 1px solid var(--border-subtle); border-radius: 14px; background: var(--surface-muted); }
.feature-card > .el-icon { width: 44px; height: 44px; border-radius: 12px; color: var(--el-color-primary); background: color-mix(in srgb, var(--el-color-primary) 10%, transparent); font-size: 22px; }
.feature-card strong { color: var(--text-primary); }
.feature-card p { margin: 5px 0 0; color: var(--text-tertiary); font-size: 12px; }
.code-input :deep(textarea) { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; line-height: 1.7; }
.config-editor { flex: 1; min-height: 360px; }
.config-editor :deep(.el-textarea), .config-editor :deep(textarea) { height: 100%; min-height: 360px !important; }
.log-viewer { flex: 1; min-height: 320px; margin: 0; padding: 18px; overflow: auto; border-radius: 12px; color: #d8e2f1; background: #101827; font: 12px/1.72 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: pre-wrap; word-break: break-all; }
@media (max-width: 900px) { .settings-header__summary > div { display: none; } .settings-body { grid-template-columns: 152px minmax(0, 1fr); } .settings-content { padding: 22px 20px 38px; } .form-grid, .metric-strip { grid-template-columns: 1fr; } .rule-row { grid-template-columns: 1fr; } }
</style>

<style lang="less">
.website-settings-dialog { height: min(720px, calc(100vh - 72px)); margin: 0 !important; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: 16px; background: var(--surface-card); box-shadow: 0 24px 70px rgba(15, 23, 42, .22); }
.website-settings-dialog .el-dialog__header { display: none; }
.website-settings-dialog .el-dialog__body { height: 100%; padding: 0; overflow: hidden; }
@media (max-width: 900px) {
  .website-settings-dialog { width: calc(100vw - 24px) !important; height: calc(100vh - 32px); border-radius: 13px; }
}
</style>
