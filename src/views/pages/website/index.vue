<script setup lang="ts">
import { computed, reactive, toRaw } from 'vue'
import SearchInput from '@/components/search-input.vue'
import { Delete, FolderAdd, FolderOpened, Lock, Refresh, Setting } from '@element-plus/icons-vue'
import CardTabs from '@/components/card-tabs.vue'
import CustomTable from '@/components/custom-table.vue'
import { Api } from '@/api/modules'
import type { FormItem } from '@/components/custom-form.vue'
import { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import WebsiteCertificateDrawer from './components/WebsiteCertificateDrawer.vue'
import WebsiteBackupDrawer from './components/WebsiteBackupDrawer.vue'
import WebServerConfigDrawer from './components/WebServerConfigDrawer.vue'
import { isOperationCancelled, submitOperation } from '@/utils/operationPreview'
import i18n from '@/lang'
import WebsiteSettingsDrawer from './components/WebsiteSettingsDrawer.vue'
import System from '@/utils/System'
import { useConfigStore } from '@/stores/modules/config'

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}
const sconfig = useConfigStore()
const canReadDatabase = () =>
  sconfig.hasMenuAccess('database') ||
  sconfig.hasActionAccess('database.read') ||
  Boolean((sconfig.scopeAccess as any)?.database?.read) ||
  Boolean((sconfig.scopeAccess as any)?.['database.read'])

const websiteRootDirPattern = /^(?!\.)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9][A-Za-z0-9._/-]*$/
const rootDirForbiddenCharacters = /[\0\r\n\t ;{}"'$]/

const normalizeWebsiteRootDirInput = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const buildWebsitePayload = (source: Record<string, any>) => ({
  id: source.id,
  name: source.name,
  domain: source.domain,
  root_dir: source.root_dir,
  dir: source.dir,
  remark: source.remark,
  type: source.type,
  class: source.class,
  pact: source.pact,
  tar_url: source.tar_url,
  send_url: source.send_url,
  enabled: source.enabled,
  expires_at: source.expires_at
})

const validateManagedWebsiteRootDir = (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
  const rootDir = normalizeWebsiteRootDirInput(value)
  if (!rootDir) {
    callback(new Error(t('website.rootDirRequired', '请选择根目录')))
    return
  }
  if (rootDir.startsWith('/')) {
    callback(new Error(t('website.rootDirMustBeRelative', '网站根目录必须填写受管目录下的相对路径')))
    return
  }
  if (rootDir.includes('\\')) {
    callback(new Error(t('website.rootDirBackslashNotAllowed', '网站根目录不能包含反斜杠')))
    return
  }
  if (rootDirForbiddenCharacters.test(rootDir)) {
    callback(new Error(t('website.rootDirUnsafeCharacters', '网站根目录包含不安全字符')))
    return
  }
  if (!websiteRootDirPattern.test(rootDir) || rootDir.split('/').some((segment) => segment === '.' || segment === '..' || !segment)) {
    callback(new Error(t('website.rootDirTraversalNotAllowed', '网站根目录不能包含越界路径')))
    return
  }
  callback()
}

const extractWebsiteOperationMeta = (payload: any) => {
  const root = payload?.data ?? payload ?? {}
  const result = root?.result || root?.data?.result || {}
  const meta = root?.meta || root?.data?.meta || {}
  const taskCandidates = [
    root?.taskId,
    root?.task_id,
    root?.id,
    root?.boundTaskId,
    root?.bound_task_id,
    root?.task?.id,
    root?.task?.taskId,
    root?.task?.task_id,
    result?.taskId,
    result?.task_id,
    result?.id,
    result?.boundTaskId,
    result?.task?.id,
    meta?.taskId,
    meta?.task_id,
    meta?.boundTaskId
  ]
  const approvalCandidates = [
    root?.approvalId,
    root?.approval_id,
    root?.approvalRequestId,
    root?.approval_request_id,
    root?.requestId,
    root?.request_id,
    root?.approval?.id,
    root?.approvalRequest?.id,
    result?.approvalId,
    result?.approval_id,
    result?.approvalRequestId,
    result?.approval_request_id,
    result?.requestId,
    result?.request_id,
    result?.approval?.id,
    result?.approvalRequest?.id,
    meta?.approvalId,
    meta?.approval_id,
    meta?.approvalRequestId,
    meta?.approval_request_id
  ]
  const statusCandidates = [
    root?.status,
    root?.state,
    root?.phase,
    root?.approvalStatus,
    root?.approval_status,
    root?.approval?.status,
    result?.status,
    result?.state,
    result?.phase,
    result?.approvalStatus,
    result?.approval_status,
    result?.approval?.status,
    meta?.status,
    meta?.state,
    meta?.phase
  ]
  const taskId = taskCandidates.find((item) => typeof item === 'string' || typeof item === 'number')
  const approvalId = approvalCandidates.find((item) => typeof item === 'string' || typeof item === 'number')
  const status = statusCandidates.find((item) => typeof item === 'string')

  return {
    taskId: taskId ? String(taskId) : '',
    approvalId: approvalId ? String(approvalId) : '',
    status: typeof status === 'string' ? status.toLowerCase() : ''
  }
}

const extractWebsiteTaskId = (payload: any): string => {
  return extractWebsiteOperationMeta(payload).taskId
}

const extractWebsiteApprovalId = (payload: any): string => {
  return extractWebsiteOperationMeta(payload).approvalId
}

const openWebsiteRoot = (rootDir: unknown) => {
  const path = typeof rootDir === 'string' ? rootDir.trim() : ''
  if (!path) {
    ElMessage.warning(t('website.noManagedRoot', 'The current website has no manageable root directory'))
    return
  }
  System.router.push({
    path: '/file',
      query: { path }
    })
}

const webServer = reactive({
  loading: true,
  data: {
    available: false,
    running: false,
    configurationAvailable: false
  } as Record<string, any>,
  configVisible: false,
  load: async () => {
    webServer.loading = true
    try {
      const { data } = await Api.getWebsiteWebServer()
      webServer.data = data
    } catch {
      webServer.data = {
        available: false,
        running: false,
        configurationAvailable: false
      }
    } finally {
      webServer.loading = false
    }
  }
})

const certificateDrawer = reactive({
  show: false,
  website: {} as Record<string, any>,
  open: (website: Record<string, any>) => {
    certificateDrawer.website = website
    certificateDrawer.show = true
  }
})

const backupDrawer = reactive({
  show: false,
  website: null as Record<string, any> | null,
  open: (website?: Record<string, any>) => {
    backupDrawer.website = website || null
    backupDrawer.show = true
  }
})

const settingsDrawer = reactive({
  show: false,
  website: null as Record<string, any> | null,
  open: (website: Record<string, any>) => {
    settingsDrawer.website = website
    settingsDrawer.show = true
  }
})

const statusLoading = reactive(new Set<number>())
const toggleWebsiteStatus = async (row: Record<string, any>, enabled: boolean) => {
  statusLoading.add(row.id)
  try {
    await submitOperation('website.toggle', {
      id: row.id,
      enabled
    })
    ElMessage.success(t(enabled ? 'website.notifications.enabled' : 'website.notifications.disabled'))
    await conf.website.getData()
  } catch (error: any) {
    if (isOperationCancelled(error)) return
    ElMessage.error(error?.message || t('common.operationFailed', '操作失败'))
  } finally {
    statusLoading.delete(row.id)
  }
}

const formatWebsiteTraffic = (value: unknown) => {
  let bytes = Number(value || 0)
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  while (bytes >= 1024 && index < units.length - 1) {
    bytes /= 1024
    index++
  }
  return `${bytes >= 100 || index === 0 ? bytes.toFixed(0) : bytes.toFixed(2)} ${units[index]}`
}

const formatWebsiteExpiration = (value?: string | null) => {
  if (!value) return '永久'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false })
}

const conf = reactive({
  tabs: {
    activeIndex: 0,
    list: [
      {
        name: 'PHP项目',
        nameKey: 'website.tabs.php',
        index: 0,
        value: 'php'
      },
      // {
      //   name: 'JAVA项目',
      //   index: 1
      // },
      // {
      //   name: 'Node项目',
      //   index: 2
      // },
      // {
      //   name: 'Go项目',
      //   index: 3
      // },
      // {
      //   name: 'Python项目',
      //   index: 4
      // },
      {
        name: '反向代理',
        nameKey: 'website.tabs.proxy',
        index: 5,
        value: 'proxy'
      },
      {
        name: 'HTML项目',
        nameKey: 'website.tabs.static',
        index: 6,
        value: 'static'
      }
      // {
      //   name: '其他项目',
      //   index: 7
      // }
    ],
    clickActive: (item: any) => {
      conf.tabs.activeIndex = item.index
      conf.website.params.type = item.value
      conf.website.getData()
    }
  },
  website: {
    data: [],
    total: 0,
    columns: computed(() => [
      { prop: 'name', label: t('website.websiteName', 'Website name'), width: 180 },
      { prop: 'domain', label: t('website.domain', 'Domain'), width: 180 },
      { prop: 'root_dir', label: t('website.rootDir', '根目录') },
      { prop: 'status', label: t('website.status', 'Status'), width: 130 },
      { prop: 'traffic', label: t('website.todayTraffic', 'Today traffic'), width: 120 },
      { prop: 'expiration', label: t('website.expiration', 'Expiration'), width: 180 },
      { prop: 'ssl', label: 'SSL', width: 100 },
      { prop: 'action', label: t('common.action', 'Action'), width: 320, fixed: 'right' as const }
    ]),
    params: {
      type: 'php',
      page: 1,
      pageSize: 10
    } as any,
    loading: true,
    getData: async () => {
      conf.website.loading = true
      const { data: res } = await Api.getWebsiteList(conf.website.params)
      conf.website.loading = false
      conf.website.total = res.total
      conf.website.data = res.data
    },
    handleAdd: () => {
      conf.drawer.open('add')
      conf.form.data.value = { type: conf.website.params.type, expires_at: null }
    }
  },
  drawer: {
    show: false,
    title: '创建网站',
    type: 'add',
    loading: false,
    open: (type: 'add' | 'edit', row?: any) => {
      conf.drawer.title = t('website.createWebsite', '创建网站')
      conf.drawer.type = type
      if (type === 'edit') {
        conf.drawer.title = t('website.setWebsite', '设置网站')
        const cloneRow = structuredClone(toRaw(row))
        const domain = cloneRow.domain?.split(',')
        conf.form.data.value = cloneRow
        conf.form.data.value.hostDomain = domain[0].trim()
        domain.shift()
        conf.form.data.value.otherDomain = domain.join('\n')
      }
      conf.drawer.show = true
    },
    onConfirm: () => {
      conf.form.instance?.validate(async (valid) => {
        if (!valid) return
        conf.form.data.value.hostDomain = typeof conf.form.data.value.hostDomain === 'string'
          ? conf.form.data.value.hostDomain.trim()
          : conf.form.data.value.hostDomain
        conf.form.data.value.otherDomain = typeof conf.form.data.value.otherDomain === 'string'
          ? conf.form.data.value.otherDomain.trim()
          : conf.form.data.value.otherDomain
        conf.form.data.value.root_dir = normalizeWebsiteRootDirInput(conf.form.data.value.root_dir)
        let otherDomain = ''
        if (conf.form.data.value.otherDomain) {
          otherDomain = conf.form.data.value.otherDomain?.split('\n')
        } else {
          otherDomain = ''
        }


        conf.form.data.value.domain = otherDomain != ''
          ? `${conf.form.data.value.hostDomain.trim()},${otherDomain}`
          : conf.form.data.value.hostDomain

        try {
          conf.drawer.loading = true
          const operation = conf.drawer.type === 'add' ? 'website.create' : 'website.update'
          await submitOperation(operation, buildWebsitePayload(structuredClone(toRaw(conf.form.data.value))))
          ElMessage({
            type: 'success',
            message: conf.drawer.type === 'add' ? t('website.createSuccess', '创建网站成功') : t('website.updateSuccess', '更新网站成功')
          })
          conf.drawer.show = false
          conf.website.getData()
        } catch (error: any) {
          if (isOperationCancelled(error)) return
          ElMessage({
            type: 'error',
            message: error.message || t('common.operationFailed', '操作失败')
          })
        } finally {
          conf.drawer.loading = false
        }

      })
    },
    onClose: () => {
      conf.form.data.value = {}
      conf.form.instance?.resetFields()
      conf.form.instance?.clearValidate()
      conf.drawer.show = false
    }
  },
  form: {
    instance: null as FormInstance | null,
    data: {
      value: {} as any,
      items: computed<FormItem[]>(() => {
        switch (conf.website.params.type) {
          case 'php':
          case 'static':
            return [
              {
                label: t('website.primaryDomain', '主域名'),
                type: 'input',
                placeholder: t('website.domainPortPlaceholder', '支持域名:端口'),
                prop: 'hostDomain',
                rules: [
                  { required: true, message: t('website.primaryDomainRequired', '请输入主域名'), trigger: 'blur' },
                  {
                    pattern: /^(([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))(:\d{1,5})?$/,
                    message: t('website.domainFormatError', '域名格式错误'),
                    trigger: 'blur'
                  }
                ],
                change: (value) => {
                  // 当域名改变时，自动设置目录
                  const domainPattern = /^(([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))(:\d{1,5})?$/
                  if (value && !conf.form.data.value.root_dir && domainPattern.test(value)) {
                    // 如果有端口号，去掉端口号
                    const domainWithoutPort = value.split(':')[0]
                    conf.form.data.value.root_dir = domainWithoutPort
                  }
                }
              },
              {
                label: t('website.otherDomains', '其他域名'),
                type: 'textarea',
                placeholder: t('website.otherDomainsPlaceholder', '一行一个域名，支持*和IP地址，支持"域名:端口"'),
                prop: 'otherDomain'
              },
              {
                label: t('website.rootDir', '根目录'),
                type: 'input',
                placeholder: t('website.rootDirPlaceholder', '相对于受管网站根目录的目录，例如 example.com'),
                prop: 'root_dir',
                rules: [
                  { required: true, message: t('website.rootDirRequired', '请选择根目录'), trigger: 'blur' },
                  { validator: validateManagedWebsiteRootDir, trigger: ['blur', 'change'] }
                ]
              },
              {
                label: t('common.remark', '备注'),
                type: 'textarea',
                prop: 'remark'
              },
              {
                label: '到期时间',
                type: 'custom',
                prop: 'expires_at'
              }
            ]
          case 'proxy':
            conf.form.data.value.pact ||= 'http'
            conf.form.data.value.tar_url ||= '$http_host'
            return [
              {
                label: t('website.primaryDomain', '主域名'),
                type: 'input',
                placeholder: t('website.domainPortPlaceholder', '支持域名:端口'),
                prop: 'hostDomain',
                rules: [
                  { required: true, message: t('website.primaryDomainRequired', '请输入主域名'), trigger: 'blur' },
                  { pattern: /^([0-9a-zA-Z-]{1,}\.)+([a-zA-Z]{2,})$/, message: t('website.domainFormatError', '域名格式错误'), trigger: 'blur' }
                ]
              },
              {
                label: t('website.otherDomains', '其他域名'),
                type: 'textarea',
                placeholder: t('website.otherDomainsPlaceholder', '一行一个域名，支持*和IP地址，支持"域名:端口"'),
                prop: 'otherDomain'
              },
              {
                label: t('website.proxyAddress', '代理地址'),
                type: 'custom',
                placeholder: t('website.proxyAddressPlaceholder', '例：127.0.0.1:8080'),
                prop: 'send_url',
                rules: [{ required: true, message: t('website.proxyAddressRequired', '请输入代理地址'), trigger: 'blur' }]
              },
              {
                label: t('common.remark', '备注'),
                type: 'textarea',
                prop: 'remark'
              },
              {
                label: '到期时间',
                type: 'custom',
                prop: 'expires_at'
              }
            ]
          default:
            return []
        }
      })
    }
  },
  dialog: {
    show: false,
    title: t('website.deleteConfirmTitle', '网站删除确认'),
    type: 'delete',
    row: {} as any,
    loading: false,
    confirmName: '',
    databaseId: 0,
    deleteFiles: false,
    databases: [] as any[],
    open: (type: 'delete', row?: any) => {
      conf.dialog.type = type
      conf.dialog.row = row
      conf.dialog.confirmName = ''
      conf.dialog.databaseId = 0
      conf.dialog.deleteFiles = false
      switch (type) {
        case 'delete':
          conf.dialog.title = t('website.deleteConfirmTitle', '网站删除确认')
          break
      }
      conf.dialog.show = true
      conf.dialog.databases = []
      if (!canReadDatabase()) return
      Api.getDatabaseList({ type: 'mysql', page: 1, pageSize: 100 })
        .then(({ data }) => {
          conf.dialog.databases = data?.data || []
        })
        .catch(() => {
          conf.dialog.databases = []
          ElMessage.warning(t('website.databaseListUnavailable', '当前角色无法读取数据库列表，将按“不关联数据库”继续删除'))
        })
    },
    close: () => {
      conf.dialog.show = false
    },
    confirm: async () => {
      if (conf.dialog.confirmName !== conf.dialog.row.name) {
        ElMessage.error(t('website.websiteNameMismatch', '网站名不匹配'))
        return
      }
      conf.dialog.loading = true
      try {
        const response = await Api.delWebsite({
          id: conf.dialog.row.id,
          confirmName: conf.dialog.confirmName,
          databaseId: conf.dialog.databaseId || undefined,
          deleteFiles: conf.dialog.deleteFiles
        })
        const { taskId, approvalId, status } = extractWebsiteOperationMeta(response)
        const responseMessage = [
          response?.message,
          response?.detail,
          response?.data?.message,
          response?.data?.detail
        ].find((item) => typeof item === 'string' && item.trim())
        if (taskId) {
          ElMessage.success(t('website.deleteTaskCreated', '安全删除任务已创建，完整快照验证成功后才会删除网站'))
          backupDrawer.open(conf.dialog.row)
          conf.dialog.show = false
          conf.website.getData()
          return
        }

        if (
          approvalId ||
          ['pending', 'waiting_approval', 'awaiting_approval', 'approval_pending'].includes(status) ||
          /审批|approval/i.test(String(responseMessage || ''))
        ) {
          ElMessage.success(t('website.deleteApprovalCreated', '已提交删除审批申请，等待审批通过后会自动生成删除任务'))
          conf.dialog.show = false
          conf.website.getData()
          return
        }

        if (!extractWebsiteTaskId(response) && !extractWebsiteApprovalId(response)) {
          ElMessage.error(t('website.deleteTaskMissing', '后端未返回删除任务，网站未确认进入删除流程'))
          return
        }
      } finally {
        conf.dialog.loading = false
      }
    }
  }
})

conf.website.getData()
webServer.load()
</script>

<template>
  <div class="website-container">
    <section v-loading="webServer.loading" class="web-server-card" :class="{ unavailable: !webServer.data.available }">
      <div class="web-server-card__identity">
        <div class="web-server-card__logo">
          {{ webServer.data.component === 'openresty' ? 'O' : webServer.data.available ? 'N' : '?' }}
        </div>
        <div class="web-server-card__copy">
          <span>{{ $t('website.currentWebServer') }}</span>
          <div>
            <h3>{{ webServer.data.available ? webServer.data.name : $t('website.webServerNotDetected') }}</h3>
            <el-tag
              :type="webServer.data.running ? 'success' : webServer.data.available ? 'warning' : 'info'"
              effect="plain"
              round
            >
              {{ webServer.data.running ? $t('website.running') : webServer.data.available ? $t('website.serviceStopped') : $t('website.notInstalled') }}
            </el-tag>
          </div>
          <p v-if="webServer.data.available">
            {{ webServer.data.version || $t('website.versionUnknown') }} · {{ $t('website.siteConfigDir') }} {{ webServer.data.siteConfigDir || '-' }}
          </p>
          <p v-else>{{ $t('website.installWebServerTip') }}</p>
        </div>
      </div>
      <div class="web-server-card__actions">
        <el-button :icon="Refresh" @click="webServer.load">{{ $t('website.refreshStatus') }}</el-button>
        <el-button
          type="primary"
          :icon="Setting"
          :disabled="!webServer.data.configurationAvailable"
          @click="webServer.configVisible = true"
        >
          {{ $t('website.manageConfigFiles') }}
        </el-button>
      </div>
    </section>

    <card-tabs :list="conf.tabs.list" :active-index="conf.tabs.activeIndex" :click-active="conf.tabs.clickActive" />
    <div class="tool-bar website-toolbar">
      <el-space class="btn-group website-toolbar__actions" :size="14" style="width: 100%;">
        <el-button type="primary" :disabled="!webServer.data.available" @click="conf.website.handleAdd">{{ $t('website.addSite') }}</el-button>
        <el-button @click="backupDrawer.open()">{{ $t('website.fullBackupManagement') }}</el-button>

        <!-- <el-dropdown>
            <el-button type="primary">
              <span class="el-dropdown-link">
                高级设置
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>修改默认页面</el-dropdown-item>
                <el-dropdown-item>默认站点</el-dropdown-item>
                <el-dropdown-item>PHP命令行版本</el-dropdown-item>
                <el-dropdown-item>HTTPS防窜站</el-dropdown-item>
                <el-dropdown-item>TLS设置</el-dropdown-item>
                <el-dropdown-item>全局设置</el-dropdown-item>
                <el-dropdown-item>关联数据库</el-dropdown-item>
              </el-dropdown-menu>
            </template>
</el-dropdown>
<el-button type="primary">
  <span>漏洞扫描（0）</span>
</el-button>
<el-button type="primary">
  <span style="font-size: 14px; margin-right: 8px">nignx</span>
  <el-icon>
    <CaretBottom />
  </el-icon>
</el-button>
<el-dropdown>
  <el-button type="primary">
    <span class="el-dropdown-link">
      全部分类
      <el-icon class="el-icon--right"><arrow-down /></el-icon>
    </span>
  </el-button>
  <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>修改默认页面</el-dropdown-item>
                <el-dropdown-item>默认站点</el-dropdown-item>
                <el-dropdown-item>PHP命令行版本</el-dropdown-item>
                <el-dropdown-item>HTTPS防窜站</el-dropdown-item>
                <el-dropdown-item>TLS设置</el-dropdown-item>
                <el-dropdown-item>全局设置</el-dropdown-item>
                <el-dropdown-item>关联数据库</el-dropdown-item>
              </el-dropdown-menu>
            </template>
</el-dropdown> -->

      </el-space>
      <div class="demo-form-inline website-toolbar__search">
        <div class="website-search-panel">
          <search-input
            v-model="conf.website.params.name"
            class="website-search-panel__input"
            :placeholder="$t('website.domainPlaceholder')"
            @search="conf.website.getData()"
          />
          <el-button class="website-search-panel__refresh" :icon="Refresh" type="primary" @click="conf.website.getData()" />
          <!-- <el-button :icon="Setting" type="primary" /> -->
        </div>
      </div>
    </div>
    <div class="box2">
      <custom-table v-model:page="conf.website.params.page" v-model:page-size="conf.website.params.pageSize" :loading="conf.website.loading" :empty-text="$t('common.noData')" :data="conf.website.data"
        :columns="conf.website.columns" :auto-pagination="false" :total="conf.website.total"
        @update:page="conf.website.getData" @update:page-size="() => { conf.website.params.page = 1; conf.website.getData() }">
        <template #root_dir="{ row }">
          <el-link
            v-if="row.root_dir"
            class="website-root-link"
            type="primary"
            :underline="false"
            :title="row.root_dir"
            @click="openWebsiteRoot(row.root_dir)"
          >
            <el-icon><FolderOpened /></el-icon>
            <span class="website-root-link__path">{{ row.root_dir }}</span>
          </el-link>
          <span v-else class="website-root-link__empty">—</span>
        </template>
        <template #action="{ row }">
          <div class="table-row-actions">
            <el-button type="primary" link :icon="Lock" @click="certificateDrawer.open(row)">SSL</el-button>
            <el-button type="primary" link :icon="FolderAdd" @click="backupDrawer.open(row)">{{ $t('website.backup') }}</el-button>
            <el-button type="primary" link :icon="Setting" @click="settingsDrawer.open(row)">{{ $t('website.settings') }}</el-button>
            <el-button type="danger" link :icon="Delete" @click="conf.dialog.open('delete', row)">{{ $t('common.delete') }}</el-button>
          </div>
        </template>
        <template #status="{ row }">
          <div class="website-status">
            <el-switch
              :model-value="Boolean(row.enabled)"
              :loading="statusLoading.has(row.id)"
              @change="toggleWebsiteStatus(row, Boolean($event))"
            />
            <span :class="{ expired: row.disabled_reason === 'expired' }">
              {{ row.enabled ? '运行中' : row.disabled_reason === 'expired' ? '已到期' : '已停用' }}
            </span>
          </div>
        </template>
        <template #traffic="{ row }">
          <div class="website-traffic">
            <strong>{{ formatWebsiteTraffic(row.today_traffic_bytes) }}</strong>
            <span>{{ Number(row.today_requests || 0).toLocaleString() }} 次请求</span>
          </div>
        </template>
        <template #expiration="{ row }">
          <el-tag
            :type="row.expires_at && new Date(row.expires_at).getTime() <= Date.now() ? 'danger' : row.expires_at ? 'warning' : 'info'"
            effect="plain"
          >
            {{ formatWebsiteExpiration(row.expires_at) }}
          </el-tag>
        </template>
        <template #ssl="{ row }">
          <el-tag v-if="row.ssl_enabled" :type="row.certificate_status === 'active' ? 'success' : 'warning'">
            {{ row.certificate_status === 'active' ? $t('common.enabled') : row.certificate_status === 'expired' ? $t('website.expired') : $t('website.expiringSoon') }}
          </el-tag>
          <el-tag v-else type="info">{{ $t('common.disabled') }}</el-tag>
        </template>
      </custom-table>
    </div>
    <!--创建网站弹窗-->
    <custom-drawer :visible="conf.drawer.show" :title="conf.drawer.title" :empty-text="$t('common.noData')" :loading="conf.drawer.loading"
      size="820px" :on-close="conf.drawer.onClose" :on-confirm="conf.drawer.onConfirm">
      <custom-form v-if="conf.drawer.show" :data="conf.form.data" :on-init="(el) => (conf.form.instance = el)">
        <template #send_url="{ row }">
          <el-input v-model="conf.form.data.value.send_url" :placeholder="row.placeholder">
            <template #prepend>
              <el-select v-model="conf.form.data.value.pact" style="width: 80px">
                <el-option label="http" value="http" />
                <el-option label="https" value="https" />
              </el-select>
            </template>
          </el-input>
        </template>
        <template #expires_at>
          <el-date-picker
            v-model="conf.form.data.value.expires_at"
            type="datetime"
            placeholder="不设置表示永久有效"
            clearable
            style="width: 100%"
          />
        </template>
      </custom-form>
    </custom-drawer>

    <custom-dialog v-model="conf.dialog.show" :title="conf.dialog.title">
      <template v-if="conf.dialog.type === 'delete'">
        <el-alert
          :title="$t('website.deleteSnapshotTip')"
          type="warning"
          show-icon
          :closable="false"
        />
        <el-form label-position="top" class="delete-form">
          <el-form-item :label="$t('website.databaseOptional')">
            <el-select v-model="conf.dialog.databaseId" style="width: 100%" :placeholder="$t('website.noDatabase')">
              <el-option :label="$t('website.noDatabase')" :value="0" />
              <el-option
                v-for="database in conf.dialog.databases"
                :key="database.id"
                :label="database.name"
                :value="database.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('website.fileHandling')">
            <el-checkbox v-model="conf.dialog.deleteFiles">
              {{ $t('website.deleteFilesAfterSnapshot') }}
            </el-checkbox>
          </el-form-item>
          <el-form-item :label="$t('website.confirmWebsiteName', { name: conf.dialog.row.name || '' })">
            <el-input v-model="conf.dialog.confirmName" :placeholder="conf.dialog.row.name" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="conf.dialog.close">{{ $t('common.cancel') }}</el-button>
        <el-button
          type="danger"
          :loading="conf.dialog.loading"
          :disabled="conf.dialog.confirmName !== conf.dialog.row.name"
          @click="conf.dialog.confirm"
        >
          {{ $t('website.createSnapshotAndDelete') }}
        </el-button>
      </template>
    </custom-dialog>

    <website-certificate-drawer
      v-model="certificateDrawer.show"
      :website="certificateDrawer.website"
      @changed="conf.website.getData()"
    />
    <website-backup-drawer
      v-model="backupDrawer.show"
      :website="backupDrawer.website"
      @changed="conf.website.getData()"
    />
    <web-server-config-drawer
      v-model="webServer.configVisible"
      @changed="webServer.load"
    />
    <website-settings-drawer
      v-model="settingsDrawer.show"
      :website="settingsDrawer.website"
      @changed="conf.website.getData()"
    />
  </div>
</template>

<style scoped lang="less">
.web-server-card {
  min-height: 112px;
  margin-bottom: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border: 1px solid rgba(var(--primary-color), 0.16);
  border-radius: 20px;
  background:
    radial-gradient(circle at top left, rgba(var(--primary-color), 0.1), transparent 34%),
    var(--surface-card);
  box-shadow: 0 10px 28px rgba(16, 24, 40, 0.05);

  &.unavailable {
    border-color: var(--border-subtle);
    background: var(--surface-card);
  }
}

.web-server-card__identity {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 15px;
}

.web-server-card__logo {
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(var(--primary-color), 0.16);
  border-radius: 18px;
  color: var(--el-color-primary);
  background: rgba(var(--primary-color), 0.09);
  font-size: 26px;
  font-weight: 800;
}

.web-server-card__copy {
  min-width: 0;

  > span {
    color: var(--text-tertiary);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
  }

  > div {
    margin-top: 5px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 20px;
    line-height: 1.3;
  }

  p {
    margin: 7px 0 0;
    overflow: hidden;
    color: var(--text-tertiary);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.web-server-card__actions {
  flex: 0 0 auto;
  display: flex;
  gap: 10px;
}

.website-container {
  .website-toolbar {
    align-items: center;
  }

  .website-toolbar__actions {
    flex: 1 1 420px;
    min-width: 0;
  }

  .website-toolbar__search {
    flex: 0 1 360px;
    width: min(100%, 360px);
    margin-left: auto;
  }
}

.website-search-panel {
  width: 100%;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.website-search-panel__input {
  flex: 1 1 auto;
  min-width: 0;
}

.website-search-panel__refresh {
  flex: 0 0 auto;
  min-width: 44px;
  padding-inline: 14px;
}

.website-root-link {
  max-width: 100%;
  vertical-align: middle;
}

.website-root-link :deep(.el-link__inner) {
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.website-root-link__path {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.website-root-link__empty {
  color: var(--text-tertiary, #94a3b8);
}

.website-status,
.website-traffic {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.website-status span {
  color: var(--text-secondary);
  font-size: 12px;

  &.expired {
    color: var(--el-color-danger);
  }
}

.website-traffic {
  align-items: flex-start;
  flex-direction: column;
  gap: 2px;

  strong {
    color: var(--text-primary);
    font-size: 13px;
  }

  span {
    color: var(--text-tertiary);
    font-size: 10px;
  }
}

.delete-form {
  margin-top: 16px;
}

@media (max-width: 1100px) {
  .website-container {
    .website-toolbar__search {
      flex-basis: 100%;
      width: 100%;
    }
  }
}

@media (max-width: 768px) {
  .web-server-card {
    align-items: stretch;
    flex-direction: column;
  }

  .web-server-card__actions {
    justify-content: flex-end;
  }

  .website-container {
    .website-toolbar {
      justify-content: flex-start;
      align-items: stretch;
    }

    .website-toolbar__actions,
    .website-toolbar__search {
      flex-basis: auto;
      width: 100%;
      margin-left: 0;
    }
  }

  .website-search-panel {
    padding: 12px;
    gap: 10px;
  }
}

@media (max-width: 560px) {
  .web-server-card__identity {
    align-items: flex-start;
  }

  .web-server-card__copy {
    p {
      white-space: normal;
    }
  }

  .web-server-card__actions {
    flex-direction: column;
  }

  .website-search-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .website-search-panel__refresh {
    width: 100%;
  }
}
</style>
