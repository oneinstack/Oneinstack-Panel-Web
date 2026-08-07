<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Api } from '@/api/Api'
import System from '@/utils/System'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, FolderOpened, Lock, Refresh, SwitchButton } from '@element-plus/icons-vue'
import WebsiteCertificateDrawer from './WebsiteCertificateDrawer.vue'

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

const menus = computed(() => [
  { key: 'domain', label: '域名管理' },
  { key: 'binding', label: '子目录绑定', hidden: currentWebsite.value.type === 'proxy' },
  { key: 'directory', label: '网站目录', hidden: currentWebsite.value.type === 'proxy' },
  { key: 'access', label: '访问限制' },
  { key: 'traffic', label: '流量限制' },
  { key: 'rewrite', label: '伪静态', hidden: currentWebsite.value.type === 'proxy' },
  { key: 'documents', label: '默认文档', hidden: currentWebsite.value.type === 'proxy' },
  { key: 'config', label: '配置文件' },
  { key: 'ssl', label: 'SSL' },
  { key: 'php', label: 'PHP', hidden: currentWebsite.value.type !== 'php' },
  { key: 'redirect', label: '重定向' },
  { key: 'proxy', label: '反向代理' },
  { key: 'hotlink', label: '防盗链' },
  { key: 'tamper', label: '防篡改' },
  { key: 'security', label: '网站安全' },
  { key: 'logs', label: '网站日志' },
  { key: 'alerts', label: '网站告警' },
  { key: 'other', label: '其他设置' }
].filter((item) => !item.hidden))

const formatTime = (value?: string | Date | null) => {
  if (!value) return '永久有效'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('zh-CN', { hour12: false })
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
const saveSettings = async (success = '网站设置已发布') => {
  const websiteId = Number(currentWebsite.value.id || 0)
  if (!websiteId) return
  state.saving = true
  try {
    const { data } = await Api.updateWebsiteSettings(websiteId, state.settings)
    hydrateDocument(data)
    state.settings = structuredClone(data.settings || {})
    state.settings.bindings ||= []
    state.settings.redirects ||= []
    state.settings.proxy_rules ||= []
    ElMessage.success(success)
    emit('changed')
  } finally { state.saving = false }
}
const saveWebsiteProfile = async (domainOnly = false) => {
  const domains = domainLines.value.split(/[,\n\r]+/).map((item) => item.trim()).filter(Boolean)
  if (!domains.length) { ElMessage.warning('至少保留一个网站域名'); return }
  state.saving = true
  try {
    await Api.updateWebsite({
      ...currentWebsite.value,
      domain: domains.join(','),
      expires_at: expiresAt.value ? new Date(expiresAt.value).toISOString() : null
    })
    ElMessage.success(domainOnly ? '域名配置已更新' : '网站基本设置已更新')
    await load()
    emit('changed')
  } finally { state.saving = false }
}
const toggleStatus = async (enabled: boolean) => {
  if (!enabled) {
    try {
      await ElMessageBox.confirm(`停用后将无法访问 ${currentWebsite.value.name}，网站文件和数据不会被删除。`, '停用网站', {
        type: 'warning', confirmButtonText: '确认停用', cancelButtonText: '取消'
      })
    } catch { return }
  }
  statusLoading.value = true
  try {
    await Api.setWebsiteStatus(Number(currentWebsite.value.id), enabled)
    ElMessage.success(enabled ? '网站已启用' : '网站已停用')
    await load()
    emit('changed')
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
    state.config.error = response?.error?.detail || response?.message || error?.message || '读取网站配置失败'
  } finally { state.config.loading = false }
}
const saveConfig = async () => {
  state.config.saving = true
  try {
    const { data } = await Api.updateWebsiteManagedConfig(Number(currentWebsite.value.id), {
      content: state.config.content, revision: state.config.revision
    })
    state.config.content = data.content || state.config.content
    state.config.revision = data.revision || state.config.revision
    ElMessage.success('配置语法校验通过并已平滑重载')
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
          <div><span>SITE CONFIGURATION</span><h2>{{ currentWebsite.name || '网站设置' }}</h2><p>添加时间 {{ formatTime(currentWebsite.create_time) }}</p></div>
        </div>
        <div class="settings-header__summary">
          <div><span>今日流量</span><strong>{{ formatBytes(props.website?.today_traffic_bytes) }}</strong></div>
          <div><span>到期时间</span><strong :class="{ expired: isExpired }">{{ formatTime(currentWebsite.expires_at) }}</strong></div>
          <el-switch :model-value="Boolean(currentWebsite.enabled)" :loading="statusLoading" inline-prompt active-text="运行" inactive-text="停用" @change="toggleStatus(Boolean($event))" />
          <el-button class="settings-close" text :icon="Close" @click="visible = false" />
        </div>
      </header>
      <div class="settings-body">
        <aside class="settings-nav">
          <button v-for="item in menus" :key="item.key" type="button" :class="{ active: activeMenu === item.key }" @click="selectMenu(item.key)">{{ item.label }}</button>
        </aside>
        <main class="settings-content">
          <section v-if="activeMenu === 'domain'" class="setting-panel">
            <div class="panel-heading"><div><h3>域名管理</h3><p>一行一个域名，可使用域名:端口；首行作为网站主域名。</p></div></div>
            <el-input v-model="domainLines" type="textarea" :rows="7" placeholder="example.com&#10;www.example.com" />
            <div class="domain-preview"><span v-for="domain in domainLines.split(/[,\n\r]+/).filter(Boolean)" :key="domain">{{ domain.trim() }}</span></div>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveWebsiteProfile(true)">保存域名</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'binding'" class="setting-panel">
            <div class="panel-heading"><div><h3>子目录绑定</h3><p>把 URL 路径安全映射到网站根目录下的子目录。</p></div><el-button type="primary" plain @click="addBinding">添加绑定</el-button></div>
            <div v-for="(item, index) in state.settings.bindings" :key="index" class="rule-row rule-row--binding">
              <el-switch v-model="item.enabled" /><el-input v-model="item.path" placeholder="访问路径，如 /assets" /><el-input v-model="item.directory" placeholder="子目录，如 /public/assets" /><el-button type="danger" link @click="removeAt(state.settings.bindings, index)">删除</el-button>
            </div>
            <el-empty v-if="!state.settings.bindings?.length" description="暂无子目录绑定" :image-size="72" />
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings('子目录绑定已发布')">保存并发布</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'directory'" class="setting-panel">
            <div class="panel-heading"><div><h3>网站目录</h3><p>运行目录必须位于网站根目录内，避免访问其他系统目录。</p></div></div>
            <el-form label-position="top" class="settings-form">
              <el-form-item label="网站根目录"><el-input :model-value="currentWebsite.root_dir" readonly><template #append><el-button :icon="FolderOpened" @click="openRoot">文件管理</el-button></template></el-input></el-form-item>
              <el-form-item label="运行目录（相对网站根目录）"><el-input v-model="state.settings.running_directory" placeholder="留空使用网站根目录，如 /public" /></el-form-item>
              <el-form-item label="目录列表"><el-switch v-model="state.settings.directory_listing" active-text="允许列出目录" inactive-text="禁止列出目录" /></el-form-item>
            </el-form>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings('网站目录设置已发布')">保存并发布</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'access'" class="setting-panel">
            <div class="panel-heading"><div><h3>访问限制</h3><p>支持 IPv4、IPv6 和 CIDR；存在白名单时，其余地址默认拒绝。</p></div></div>
            <div class="form-grid"><el-form-item label="IP 白名单"><el-input v-model="state.settings.allowed_ips" type="textarea" :rows="10" placeholder="192.168.1.0/24&#10;2001:db8::/32" /></el-form-item><el-form-item label="IP 黑名单"><el-input v-model="state.settings.denied_ips" type="textarea" :rows="10" placeholder="203.0.113.8" /></el-form-item></div>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings('访问限制已发布')">保存并发布</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'traffic'" class="setting-panel">
            <div class="metric-strip"><div><span>今日响应流量</span><strong>{{ formatBytes(props.website?.today_traffic_bytes) }}</strong></div><div><span>今日请求</span><strong>{{ Number(props.website?.today_requests || 0).toLocaleString() }}</strong></div><div><span>统计来源</span><strong>站点访问日志</strong></div></div>
            <el-form label-position="top" class="settings-form form-grid"><el-form-item label="单请求限速（KB/s）"><el-input-number v-model="state.settings.rate_limit_kb" :min="0" :max="10485760" controls-position="right" /><small>0 表示不限速。</small></el-form-item><el-form-item label="传输多少 KB 后开始限速"><el-input-number v-model="state.settings.rate_limit_after_kb" :min="0" :max="10485760" controls-position="right" /></el-form-item></el-form>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings('流量限制已发布')">保存并发布</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'rewrite'" class="setting-panel">
            <div class="panel-heading"><div><h3>伪静态</h3><p>每行一条 rewrite 指令；发布前执行语法检查。</p></div></div>
            <el-input v-model="state.settings.rewrite_rules" type="textarea" :rows="16" class="code-input" placeholder="rewrite ^/article/(\d+)$ /index.php?id=$1 last;" />
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings('伪静态规则已发布')">保存并发布</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'documents'" class="setting-panel">
            <div class="panel-heading"><div><h3>默认文档</h3><p>按从左到右的优先级查找首页文件。</p></div></div>
            <el-form label-position="top" class="settings-form"><el-form-item label="默认文档"><el-input v-model="state.settings.default_documents" placeholder="index.php index.html index.htm" /></el-form-item></el-form>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings('默认文档已发布')">保存并发布</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'config'" v-loading="state.config.loading" class="setting-panel setting-panel--fill">
            <div class="panel-heading"><div><h3>配置文件</h3><p>{{ state.config.path || '当前网站实际运行配置' }}。保存时自动备份、校验并平滑重载。</p></div><el-button :icon="Refresh" @click="loadConfig">重新读取</el-button></div>
            <el-alert v-if="state.config.error" :title="state.config.error" type="error" show-icon :closable="false"><template #default><el-button type="primary" link @click="loadConfig">再次读取</el-button></template></el-alert>
            <el-alert title="结构化设置再次保存时会重新生成此配置；高级自定义内容请在修改后立即验证网站。" type="warning" show-icon :closable="false" />
            <el-input v-if="state.config.loaded" v-model="state.config.content" type="textarea" class="code-input config-editor" />
            <el-empty v-else-if="!state.config.loading && !state.config.error" description="尚未读取运行配置" :image-size="72" />
            <div class="panel-actions"><el-button type="primary" :loading="state.config.saving" :disabled="!currentWebsite.enabled || !state.config.loaded" @click="saveConfig">校验并发布</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'ssl'" class="setting-panel">
            <div class="panel-heading"><div><h3>SSL 证书</h3><p>申请 ACME 证书、续签、强制 HTTPS 或停用证书。</p></div></div>
            <div class="feature-card"><el-icon><Lock /></el-icon><div><strong>{{ currentWebsite.ssl_enabled ? 'SSL 已启用' : 'SSL 未启用' }}</strong><p>{{ currentWebsite.certificate_expires_at ? `证书到期：${formatTime(currentWebsite.certificate_expires_at)}` : '可以申请或配置网站证书' }}</p></div><el-button type="primary" @click="openCertificate">管理 SSL</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'php'" class="setting-panel">
            <div class="panel-heading"><div><h3>PHP 运行环境</h3><p>指定本机 Unix Socket 或回环地址 FastCGI 端口。</p></div></div>
            <el-form label-position="top" class="settings-form"><el-form-item label="FastCGI 后端"><el-input v-model="state.settings.php_backend" placeholder="unix:/dev/shm/php-cgi.sock" /></el-form-item></el-form>
            <el-alert title="切换前请确认对应 PHP-FPM 服务已运行；只允许本机 Socket 或回环地址。" type="info" :closable="false" show-icon />
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings('PHP 运行环境已切换')">保存并发布</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'redirect'" class="setting-panel">
            <div class="panel-heading"><div><h3>重定向</h3><p>为指定站内路径配置 301、302、307 或 308 跳转。</p></div><el-button type="primary" plain @click="addRedirect">添加重定向</el-button></div>
            <div v-for="(item, index) in state.settings.redirects" :key="index" class="rule-row rule-row--redirect"><el-switch v-model="item.enabled" /><el-input v-model="item.source" placeholder="来源 /old" /><el-select v-model="item.status"><el-option v-for="status in [301,302,307,308]" :key="status" :value="status" :label="status" /></el-select><el-input v-model="item.target" placeholder="目标 /new 或 https://..." /><el-button type="danger" link @click="removeAt(state.settings.redirects, index)">删除</el-button></div>
            <el-empty v-if="!state.settings.redirects?.length" description="暂无重定向" :image-size="72" />
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings('重定向规则已发布')">保存并发布</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'proxy'" class="setting-panel">
            <div class="panel-heading"><div><h3>反向代理</h3><p>可为子路径单独代理到 HTTP/HTTPS 上游。</p></div><el-button type="primary" plain @click="addProxy">添加代理</el-button></div>
            <div v-for="(item, index) in state.settings.proxy_rules" :key="index" class="rule-row rule-row--proxy"><el-switch v-model="item.enabled" /><el-input v-model="item.path" placeholder="路径 /api" /><el-input v-model="item.target" placeholder="http://127.0.0.1:9000" /><el-input v-model="item.host" placeholder="$host" /><el-button type="danger" link @click="removeAt(state.settings.proxy_rules, index)">删除</el-button></div>
            <el-empty v-if="!state.settings.proxy_rules?.length" description="暂无附加反向代理" :image-size="72" />
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings('反向代理规则已发布')">保存并发布</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'hotlink'" class="setting-panel">
            <div class="panel-heading"><div><h3>防盗链</h3><p>根据 Referer 拒绝其他站点直接引用本站静态资源。</p></div></div>
            <el-form label-position="top" class="settings-form"><el-form-item label="启用防盗链"><el-switch v-model="state.settings.hotlink_enabled" /></el-form-item><el-form-item label="允许空 Referer"><el-switch v-model="state.settings.hotlink_allow_empty" /></el-form-item><el-form-item label="允许的来源域名"><el-input v-model="state.settings.hotlink_domains" type="textarea" :rows="5" placeholder="cdn.example.com&#10;*.example.com" /></el-form-item><el-form-item label="保护的扩展名"><el-input v-model="state.settings.hotlink_extensions" placeholder="jpg jpeg png gif webp svg css js mp4 mp3" /></el-form-item></el-form>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings('防盗链设置已发布')">保存并发布</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'tamper'" class="setting-panel">
            <div class="panel-heading"><div><h3>站点配置防篡改</h3><p>比较可信配置与实际站点文件，发现外部修改后自动恢复。</p></div></div>
            <div class="feature-card"><el-icon><SwitchButton /></el-icon><div><strong>受管配置保护</strong><p>不会锁定网站业务文件，也不会影响正常发布。</p></div><el-switch v-model="state.settings.tamper_protection" /></div>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings('防篡改设置已更新')">保存设置</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'security'" class="setting-panel">
            <div class="panel-heading"><div><h3>网站安全</h3><p>启用基础安全响应头，并拒绝访问敏感目录或文件路径。</p></div></div>
            <el-form label-position="top" class="settings-form"><el-form-item label="安全响应头"><el-switch v-model="state.settings.security_headers" active-text="启用" /></el-form-item><el-form-item label="禁止访问路径"><el-input v-model="state.settings.denied_paths" type="textarea" :rows="9" placeholder="/.git&#10;/.env&#10;/backup" /></el-form-item></el-form>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings('网站安全设置已发布')">保存并发布</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'logs'" class="setting-panel setting-panel--fill">
            <div class="panel-heading"><div><h3>网站日志</h3><p>{{ state.logs.path || '查看站点最近日志' }}</p></div><div class="heading-actions"><el-select v-model="state.logs.type" @change="loadLog"><el-option label="访问日志" value="access" /><el-option label="错误日志" value="error" /></el-select><el-select v-model="state.logs.lines" @change="loadLog"><el-option :value="100" label="100 行" /><el-option :value="300" label="300 行" /><el-option :value="1000" label="1000 行" /></el-select><el-button :icon="Refresh" :loading="state.logs.loading" @click="loadLog">刷新</el-button></div></div>
            <pre class="log-viewer">{{ state.logs.content || '当前暂无日志' }}</pre>
          </section>

          <section v-else-if="activeMenu === 'alerts'" class="setting-panel">
            <div class="panel-heading"><div><h3>网站告警</h3><p>今日响应流量达到阈值时，在面板运行日志中产生站点告警。</p></div></div>
            <el-form label-position="top" class="settings-form form-grid"><el-form-item label="启用流量告警"><el-switch v-model="state.settings.traffic_alert" /></el-form-item><el-form-item label="告警阈值（字节）"><el-input-number v-model="state.settings.traffic_alert_bytes" :min="0" :step="1073741824" controls-position="right" /></el-form-item></el-form>
            <div class="panel-actions"><el-button type="primary" :loading="state.saving" @click="saveSettings('网站告警设置已更新')">保存设置</el-button></div>
          </section>

          <section v-else-if="activeMenu === 'other'" class="setting-panel">
            <div class="panel-heading"><div><h3>其他设置</h3><p>管理网站有效期、备注与日志开关。</p></div></div>
            <el-form label-position="top" class="settings-form"><el-form-item label="到期时间"><el-date-picker v-model="expiresAt" type="datetime" placeholder="不设置表示永久有效" clearable /></el-form-item><el-form-item label="网站备注"><el-input v-model="currentWebsite.remark" type="textarea" :rows="4" /></el-form-item><el-form-item label="访问日志"><el-switch v-model="state.settings.access_log_enabled" active-text="记录访问日志" /></el-form-item><el-form-item label="错误日志"><el-switch v-model="state.settings.error_log_enabled" active-text="记录错误日志" /></el-form-item></el-form>
            <div class="panel-actions panel-actions--split"><el-button :loading="state.saving" @click="saveSettings('日志设置已发布')">保存日志设置</el-button><el-button type="primary" :loading="state.saving" @click="saveWebsiteProfile(false)">保存基本设置</el-button></div>
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
