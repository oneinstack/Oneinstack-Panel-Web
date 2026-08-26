<script setup lang="ts">
import { useAppStore } from '@/stores/modules/app';
import System from '@/utils/System'
import { ArrowDown, CircleClose, DataAnalysis, Delete, Download, Files, FolderAdd, Key, Link, Lock, MoreFilled, Setting } from '@element-plus/icons-vue'
import type { ConfProps } from './index.vue'
import { Api } from '@/api/modules'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, watch, type CSSProperties } from 'vue'
import DatabaseBackupDrawer from './components/DatabaseBackupDrawer.vue'
import i18n from '@/lang'
import DatabaseEnvironmentEmpty from './components/DatabaseEnvironmentEmpty.vue'
import { useSoftwareTaskStore } from '@/stores/modules/softwareTask';
import InstallTaskDrawer from '../software/components/InstallTaskDrawer.vue'

const sapp = useAppStore()
const softwareTaskStore = useSoftwareTaskStore()

const { conf } = defineProps<ConfProps>()
const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}

const phpMyAdminCatalog = reactive({
  loading: true,
  installing: false,
  items: [] as any[],
  getData: async () => {
    phpMyAdminCatalog.loading = true
    try {
      const { data } = await Api.getSoftList({ page: 1, pageSize: 100 })
      phpMyAdminCatalog.items = data?.data ?? []
    } finally {
      phpMyAdminCatalog.loading = false
    }
  }
})

const phpMyAdminItem = computed(() =>
  phpMyAdminCatalog.items.find((item: any) => item.key === 'phpmyadmin')
)
const phpItem = computed(() =>
  phpMyAdminCatalog.items.find((item: any) => item.key === 'php')
)
const webServerItem = computed(() =>
  phpMyAdminCatalog.items.find((item: any) =>
    ['webserver', 'openresty', 'apache', 'caddy'].includes(item.key) && item.installed
  )
)
const phpMyAdminInstalled = computed(() => phpMyAdminItem.value?.installed === true)
const phpMyAdminTask = computed(() => softwareTaskStore.activeForKey('phpmyadmin'))
const phpMyAdminVersion = computed(() => {
  const versions = (phpMyAdminItem.value?.versions ?? []) as string[]
  const phpVersion = String(phpItem.value?.install_version || '')
  const match = phpVersion.match(/^(\d+)\.(\d+)/)
  if (match) {
    const major = Number(match[1])
    const minor = Number(match[2])
    if (major < 7 || (major === 7 && minor <= 1)) {
      return versions.find((version) => version === '4.4.15.10') || versions[0] || ''
    }
  }
  return phpMyAdminItem.value?.recommendedVersion ||
    versions.find((version) => version === '5.2.3') || versions[0] || ''
})
const phpMyAdminDescription = computed(() => {
  if (phpMyAdminTask.value) return t('database.phpMyAdmin.taskRunning', 'The installation task is running in the background. Click to view realtime progress and logs.')
  if (phpMyAdminInstalled.value) {
    return t('database.phpMyAdmin.installedDescription', 'Installed {version}. You can open it directly or enter management for a database.', { version: phpMyAdminItem.value.install_version || '' })
  }
  if (!phpItem.value?.installed) return t('database.phpMyAdmin.phpRequired', 'Install the PHP runtime before installing phpMyAdmin.')
  if (!webServerItem.value) return t('database.phpMyAdmin.webServerRequired', 'Install Nginx, OpenResty, Apache, or Caddy before installing phpMyAdmin.')
  return t('database.phpMyAdmin.installDescription', 'phpMyAdmin {version}, compatible with PHP {phpVersion}, will be installed.', {
    phpVersion: phpItem.value.install_version || '',
    version: phpMyAdminVersion.value
  })
})

const isDarkAppearance = computed(() =>
  sapp.theme === 'dark' || document.documentElement.classList.contains('dark')
)

const getPhpMyAdminStatusStyle = (type: 'success' | 'warning' | 'info'): CSSProperties => {
  const baseStyle: CSSProperties = {
    minHeight: '28px',
    padding: '2px 10px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '650',
    lineHeight: '1.2',
    whiteSpace: 'nowrap',
    boxShadow: 'none'
  }

  if (isDarkAppearance.value) {
    if (type === 'success') {
      return {
        ...baseStyle,
        borderColor: 'rgb(var(--success-color))',
        color: 'rgb(var(--success-color))',
        background: 'transparent'
      }
    }

    if (type === 'warning') {
      return {
        ...baseStyle,
        borderColor: 'rgb(var(--primary-color))',
        color: 'rgb(var(--primary-color))',
        background: 'transparent'
      }
    }

    return {
      ...baseStyle,
      borderColor: 'rgba(148, 163, 184, 0.72)',
      color: '#94a3b8',
      background: 'transparent'
    }
  }

  if (type === 'success') {
    return {
      ...baseStyle,
      borderColor: 'rgb(var(--success-color))',
      color: 'rgb(var(--success-color))',
      background: 'rgba(var(--success-color), 0.08)'
    }
  }

  if (type === 'warning') {
    return {
      ...baseStyle,
      borderColor: 'rgb(var(--primary-color))',
      color: 'rgb(var(--primary-color))',
      background: 'rgba(var(--primary-color), 0.08)'
    }
  }

  return {
    ...baseStyle,
    borderColor: 'rgba(148, 163, 184, 0.32)',
    color: '#64748b',
    background: 'rgba(148, 163, 184, 0.08)'
  }
}

const phpMyAdminDrawer = reactive({
  visible: false,
  taskId: ''
})

const showPhpMyAdminTask = (taskId?: string) => {
  if (!taskId) return
  phpMyAdminDrawer.taskId = taskId
  phpMyAdminDrawer.visible = true
}

const routeToPrerequisite = async (name: string, component: string) => {
  try {
    await ElMessageBox.confirm(
      t('database.phpMyAdmin.prerequisiteConfirm', 'phpMyAdmin requires {name}. Go to Software store to install it?', { name }),
      t('database.phpMyAdmin.missingPrerequisite', 'Missing {name}', { name }),
      {
        type: 'warning',
        confirmButtonText: t('database.phpMyAdmin.installPrerequisite', 'Install {name}', { name }),
        cancelButtonText: t('database.phpMyAdmin.skipInstall', 'Not now')
      }
    )
  } catch {
    return false
  }
  System.router.push(`/software?component=${component}`)
  return false
}

const installPhpMyAdmin = async () => {
  if (phpMyAdminTask.value) {
    showPhpMyAdminTask(phpMyAdminTask.value.id)
    return
  }
  const item = phpMyAdminItem.value
  if (!item) {
    ElMessage.warning(t('database.phpMyAdmin.packageUnavailable', 'Center does not currently provide a phpMyAdmin package. Sync Software store first.'))
    return
  }
  if (item.installable === false) {
    ElMessage.warning(t('database.phpMyAdmin.installPaused', 'Center has paused phpMyAdmin installation.'))
    return
  }
  if (!phpItem.value?.installed) {
    await routeToPrerequisite('PHP', 'php')
    return
  }
  if (!webServerItem.value) {
    await routeToPrerequisite('Web Server', 'nginx')
    return
  }
  if (!phpMyAdminVersion.value) {
    ElMessage.warning(t('database.phpMyAdmin.compatibleVersionUnavailable', 'Center does not provide a phpMyAdmin version compatible with the current PHP.'))
    return
  }

  phpMyAdminCatalog.installing = true
  try {
    const request = { key: item.key, version: phpMyAdminVersion.value }
    const { data: result } = await Api.installSoft(request)
    softwareTaskStore.acceptCreated(result, request)
    showPhpMyAdminTask(result.taskId)
    ElMessage.success(t('database.phpMyAdmin.taskCreated', 'phpMyAdmin installation task created'))
  } finally {
    phpMyAdminCatalog.installing = false
  }
}

const openPhpMyAdmin = (database?: string) => {
  if (!phpMyAdminInstalled.value) {
    void installPhpMyAdmin()
    return
  }
  const target = new URL(window.location.href)
  target.protocol = 'http:'
  target.port = ''
  target.pathname = '/phpMyAdmin/index.php'
  target.search = ''
  target.hash = ''
  if (database) target.searchParams.set('db', database)
  window.open(target.toString(), '_blank', 'noopener,noreferrer')
}

const connectionState = reactive({
  loading: true,
  data: [] as any[],
  getData: async () => {
    connectionState.loading = true
    try {
      const { data } = await Api.getConnlist({ type: 'mysql' })
      connectionState.data = data ?? []
    } finally {
      connectionState.loading = false
    }
  }
})

const showEnvironmentEmpty = computed(() => {
  if (connectionState.loading || conf.environment.loading) return false
  const hasRemoteConnection = connectionState.data.some((item: any) => !item.managed)
  const hasManagedLocalConnection = connectionState.data.some((item: any) => item.managed)
  const hasUsableConnection = hasRemoteConnection ||
    (conf.environment.mysql && hasManagedLocalConnection)
  return !hasUsableConnection
})

void Promise.allSettled([
  conf.environment.getData(),
  connectionState.getData(),
  conf.list.getData(),
  phpMyAdminCatalog.getData()
])

watch(
  () => softwareTaskStore.terminalRevision,
  () => void phpMyAdminCatalog.getData().catch(() => undefined)
)

onMounted(() => {
  void softwareTaskStore.loadAll().catch(() => undefined)
})

const backupPanel = reactive({
  visible: false,
  library: null as any
})

const verifyPanelPasswordDialog = reactive({
  visible: false,
  title: '',
  password: '',
  resolve: null as null | ((value: string) => void),
  reject: null as null | ((reason?: string) => void)
})

const credentialPasswordDialog = reactive({
  visible: false,
  title: '',
  password: '',
  resolve: null as null | ((value: string) => void),
  reject: null as null | ((reason?: string) => void)
})

const openBackupPanel = (row: any) => {
  backupPanel.library = row
  backupPanel.visible = true
}

const createBackup = async (row: any) => {
  const databaseName = row.name || row.databaseName || row.id || t('database.database', '数据库')

  try {
    await ElMessageBox.confirm(
      t('database.backup.createConfirmMessage', '确认立即备份数据库“{name}”吗？备份任务创建后会在后台执行。', { name: databaseName }),
      t('database.backup.createConfirmTitle', '备份确认'),
      {
        confirmButtonText: t('database.backup.confirmCreate', '确认备份'),
        cancelButtonText: t('common.cancel', '取消'),
        type: 'warning'
      }
    )
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }

  await Api.createDatabaseBackup({ libraryId: row.id })
  ElMessage.success(t('database.backup.backupTaskCreated', 'Backup task created'))
  openBackupPanel(row)
}

const closeVerifyPanelPasswordDialog = (reason: 'cancel' | 'close' = 'close') => {
  const reject = verifyPanelPasswordDialog.reject
  verifyPanelPasswordDialog.visible = false
  verifyPanelPasswordDialog.title = ''
  verifyPanelPasswordDialog.password = ''
  verifyPanelPasswordDialog.resolve = null
  verifyPanelPasswordDialog.reject = null
  reject?.(reason)
}

const confirmVerifyPanelPasswordDialog = () => {
  if (!verifyPanelPasswordDialog.password) {
    ElMessage.warning(t('database.security.inputPanelPassword', 'Enter current panel login password'))
    return
  }
  const resolve = verifyPanelPasswordDialog.resolve
  verifyPanelPasswordDialog.visible = false
  verifyPanelPasswordDialog.title = ''
  verifyPanelPasswordDialog.resolve = null
  verifyPanelPasswordDialog.reject = null
  const password = verifyPanelPasswordDialog.password
  verifyPanelPasswordDialog.password = ''
  resolve?.(password)
}

const requestPanelPassword = async (title: string) => {
  return await new Promise<string>((resolve, reject) => {
    verifyPanelPasswordDialog.visible = true
    verifyPanelPasswordDialog.title = title
    verifyPanelPasswordDialog.password = ''
    verifyPanelPasswordDialog.resolve = resolve
    verifyPanelPasswordDialog.reject = reject
  })
}

const verifyPanelPassword = async (title: string) => {
  const password = await requestPanelPassword(title)
  await Api.verifyPanelPassword({ password })
  return password
}

const closeCredentialPasswordDialog = (reason: 'cancel' | 'close' = 'close') => {
  const reject = credentialPasswordDialog.reject
  credentialPasswordDialog.visible = false
  credentialPasswordDialog.title = ''
  credentialPasswordDialog.password = ''
  credentialPasswordDialog.resolve = null
  credentialPasswordDialog.reject = null
  reject?.(reason)
}

const confirmCredentialPasswordDialog = () => {
  const password = credentialPasswordDialog.password.trim()
  if (password && (password.length < 12 || password.length > 128)) {
    ElMessage.warning(t('database.security.passwordLengthWarning', 'Password length must be 12-128 characters'))
    return
  }
  const resolve = credentialPasswordDialog.resolve
  credentialPasswordDialog.visible = false
  credentialPasswordDialog.title = ''
  credentialPasswordDialog.password = ''
  credentialPasswordDialog.resolve = null
  credentialPasswordDialog.reject = null
  resolve?.(password)
}

const requestCredentialPassword = async (title: string) => {
  return await new Promise<string>((resolve, reject) => {
    credentialPasswordDialog.visible = true
    credentialPasswordDialog.title = title
    credentialPasswordDialog.password = ''
    credentialPasswordDialog.resolve = resolve
    credentialPasswordDialog.reject = reject
  })
}

const viewCredential = async (row: any) => {
  try {
    const panelPassword = await verifyPanelPassword(t('database.security.viewDatabaseAccount', 'View database account'))
    const { data } = await Api.revealDatabaseCredential(row.id, { panelPassword })
    conf.credential.open(data)
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    if (error?.status === 401 || error?.response?.status === 401) {
      ElMessage.error(t('database.security.panelPasswordIncorrect', 'Current panel login password is incorrect'))
      return
    }
    throw error
  }
}

const updateCredential = async (row: any) => {
  try {
    const panelPassword = await verifyPanelPassword(t('database.security.modifyDatabasePassword', 'Modify database password'))
    const password = await requestCredentialPassword(t('database.security.modifyAccountPasswordTitle', 'Modify account password for {name}', { name: row.name }))
    const { data } = await Api.updateDatabaseCredential(row.id, {
      panelPassword,
      password: password || undefined
    })
    ElMessage.success(t('database.security.passwordUpdated', 'Database account password updated'))
    conf.credential.open(data)
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    if (error?.status === 401 || error?.response?.status === 401) {
      ElMessage.error(t('database.security.panelPasswordIncorrect', 'Current panel login password is incorrect'))
      return
    }
    throw error
  }
}

const deleteDatabase = async (row: any) => {
  try {
    const { value } = await ElMessageBox.prompt(
      t('database.deleteConfirmMessage', 'This permanently deletes database "{name}" and its dedicated user, but does not delete existing backups. Enter the database name to confirm:', { name: row.name }),
      t('database.deleteDatabase', 'Delete database'),
      {
        type: 'warning',
        confirmButtonText: t('database.permanentlyDelete', 'Permanently delete'),
        cancelButtonText: t('common.cancel', 'Cancel'),
        inputPlaceholder: row.name,
        inputValidator: (value: string) => value === row.name || t('database.backup.databaseNameMismatch', 'Database name does not match')
      }
    )
    await Api.deleteDatabaseLib({ id: row.id, confirmName: value })
    ElMessage.success(t('database.deleteSuccess', 'Database and dedicated user deleted'))
    await conf.list.getData()
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }
}

const handleMoreAction = async (command: string, row: any) => {
  switch (command) {
    case 'backup':
      await createBackup(row)
      break
    case 'backup-manager':
      openBackupPanel(row)
      break
    case 'delete':
      await deleteDatabase(row)
      break
  }
}
</script>

<template>
  <div v-if="conf.showTips" class="tip">
    <div class="flex items-center fit-width">
      <v-s-icon name="warning" size="22" :color="conf.themeColor[sapp.theme]" />
      <span class="ellipsis" style="margin-left: 32px; flex: 1;">
        {{ t('database.backupScheduleTipPrefix', '请在添加数据库后，务必到[') }}
        <span style="color: var(--el-color-primary)">{{ t('layout.menu.cron', '计划任务') }}</span>
        {{ t('database.backupScheduleTipSuffix', ']添加定时备份任务，以确保您的数据安全。温馨提示：通过第三方或者 MySQL 命令行创建的数据库需要点击“从服务器获取”才能在计划任务中备份') }}
      </span>
    </div>
    <el-icon class="cursor-pointer" size="26" color="#A2A2A2" @click="conf.showTips = false" style="margin-left: 24px;"><CircleClose /></el-icon>
  </div>
  <div class="container">
    <div class="phpmyadmin-card">
      <div class="phpmyadmin-card__icon">
        <el-icon><DataAnalysis /></el-icon>
      </div>
      <div class="phpmyadmin-card__content">
        <div class="phpmyadmin-card__title">
          <strong>{{ t('database.phpMyAdmin.quickTitle', 'phpMyAdmin 快捷管理') }}</strong>
          <span
            v-if="phpMyAdminInstalled"
            class="phpmyadmin-card__status phpmyadmin-card__status--success"
            :style="getPhpMyAdminStatusStyle('success')"
          >{{ t('database.phpMyAdmin.installed', '已安装') }}</span>
          <span
            v-else-if="phpMyAdminTask"
            class="phpmyadmin-card__status phpmyadmin-card__status--warning"
            :style="getPhpMyAdminStatusStyle('warning')"
          >{{ t('database.phpMyAdmin.installing', '安装中') }}</span>
          <span
            v-else
            class="phpmyadmin-card__status phpmyadmin-card__status--info"
            :style="getPhpMyAdminStatusStyle('info')"
          >{{ t('database.phpMyAdmin.notInstalled', '未安装') }}</span>
        </div>
        <span>{{ phpMyAdminDescription }}</span>
      </div>
      <div class="phpmyadmin-card__actions">
        <el-button
          v-if="phpMyAdminTask"
          type="primary"
          plain
          @click="showPhpMyAdminTask(phpMyAdminTask.id)"
        >
          {{ t('database.phpMyAdmin.viewProgress', '查看安装进度') }}
        </el-button>
        <el-button
          v-else-if="phpMyAdminInstalled"
          type="primary"
          :icon="Link"
          @click="openPhpMyAdmin()"
        >
          {{ t('database.phpMyAdmin.open', '打开 phpMyAdmin') }}
        </el-button>
        <el-button
          v-else
          type="primary"
          :icon="Download"
          :loading="phpMyAdminCatalog.loading || phpMyAdminCatalog.installing"
          @click="installPhpMyAdmin"
        >
          {{ t('database.phpMyAdmin.quickInstall', '快捷安装') }}
        </el-button>
        <el-button @click="System.router.push('/software?component=phpmyadmin')">{{ t('database.phpMyAdmin.versionDetail', '版本与详情') }}</el-button>
      </div>
    </div>
    <div class="tool-bar">
      <el-space class="btn-group" :size="14">
        <el-button type="primary" :disabled="showEnvironmentEmpty" @click="conf.drawer.open('add')">{{ t('database.addDatabase', '添加数据库') }}</el-button>
        <el-button type="primary" @click="System.router.push('/database/remote?type=mysql')">{{ t('database.remoteDatabase', '远程数据库') }}</el-button>
      </el-space>
      <div class="demo-form-inline">
        <search-input
          v-model="conf.list.params.name"
          :placeholder="t('database.searchDatabasePlaceholder', '请输入数据库名称')"
          style="margin-right: 18px"
          @search="conf.list.getData"
        />
      </div>
    </div>
    <div class="box2">
      <custom-table
        v-model:page="conf.list.params.page"
        v-model:page-size="conf.list.params.pageSize"
        :loading="conf.list.loading"
        :data="conf.list.data"
        :auto-pagination="false"
        :total="conf.list.total"
        :columns="conf.list.columns"
        @update:page="conf.list.getData"
        @update:page-size="() => { conf.list.params.page = 1; conf.list.getData() }"
      >
        <template #empty>
          <database-environment-empty
            v-if="showEnvironmentEmpty"
            type="mysql"
            :installed="conf.environment.mysql"
          />
          <div v-else style="margin-top: 40px">
            <span>
              {{ t('database.emptyListPrefix', '您的数据库列表为空，您可以') }}
              <a
                class="cursor-pointer"
                style="color: var(--el-color-primary); text-decoration: underline"
                @click="conf.drawer.open('add')"
              >
                {{ t('database.emptyListAction', '添加一个数据库') }}
              </a>
            </span>
          </div>
        </template>
        <template #action="{ row }">
          <div class="database-row-actions table-row-actions">
            <el-button
              v-if="phpMyAdminInstalled"
              type="primary"
              link
              :icon="Link"
              @click="openPhpMyAdmin(row.name)"
            >{{ t('database.quickManage', '快捷管理') }}</el-button>
            <el-button type="primary" link :icon="Key" @click="viewCredential(row)">{{ t('database.viewAccount', '查看账号') }}</el-button>
            <el-button type="primary" link :icon="Lock" @click="updateCredential(row)">{{ t('database.modifyPassword', '修改密码') }}</el-button>
            <el-dropdown trigger="click" popper-class="table-action-popper" @command="(command: string) => handleMoreAction(command, row)">
              <el-button type="primary" link :icon="MoreFilled">
                {{ t('database.more', '更多') }}
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu class="table-action-menu">
                  <el-dropdown-item command="backup"><el-icon><FolderAdd /></el-icon>{{ t('database.backup.backupNow', '立即备份') }}</el-dropdown-item>
                  <el-dropdown-item command="backup-manager"><el-icon><Files /></el-icon>{{ t('database.backup.manageBackups', '备份管理') }}</el-dropdown-item>
                  <el-dropdown-item class="table-action-menu__danger" command="delete" divided>
                    <el-icon><Delete /></el-icon>{{ t('database.deleteDatabase', '删除数据库') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </custom-table>
    </div>
    <database-backup-drawer v-model="backupPanel.visible" :library="backupPanel.library" />
    <custom-dialog
      v-model:show="verifyPanelPasswordDialog.visible"
      :title="verifyPanelPasswordDialog.title"
      width="560px"
      :show-close="false"
      :on-close="() => closeVerifyPanelPasswordDialog('close')"
    >
      <div class="verify-password-dialog">
        <div class="verify-password-dialog__desc">
          {{ t('database.security.verifyPanelPasswordTip', '为保护数据库密码，请输入当前面板登录密码完成二次认证。') }}
        </div>
        <el-input
          v-model="verifyPanelPasswordDialog.password"
          type="password"
          show-password
          autocomplete="current-password"
          :placeholder="t('database.security.panelPasswordPlaceholder', '请输入当前面板登录密码')"
          @keyup.enter="confirmVerifyPanelPasswordDialog"
        />
      </div>
      <template #footer>
        <el-button @click="closeVerifyPanelPasswordDialog('cancel')">{{ t('common.cancel', '取消') }}</el-button>
        <el-button type="primary" @click="confirmVerifyPanelPasswordDialog">{{ t('common.confirm', '确定') }}</el-button>
      </template>
    </custom-dialog>
    <custom-dialog
      v-model:show="credentialPasswordDialog.visible"
      :title="credentialPasswordDialog.title"
      width="620px"
      :show-close="false"
      :on-close="() => closeCredentialPasswordDialog('close')"
    >
      <div class="credential-password-dialog">
        <div class="credential-password-dialog__desc">
          {{ t('database.security.newPasswordTip', '输入 12–128 位新密码；留空则由服务端生成高强度随机密码。') }}
        </div>
        <el-input
          v-model="credentialPasswordDialog.password"
          type="password"
          show-password
          autocomplete="new-password"
          :placeholder="t('database.security.newPasswordPlaceholder', '请输入新密码，留空则自动生成随机密码')"
          @keyup.enter="confirmCredentialPasswordDialog"
        />
        <div
          v-if="
            credentialPasswordDialog.password &&
            (credentialPasswordDialog.password.trim().length < 12 ||
              credentialPasswordDialog.password.trim().length > 128)
          "
          class="credential-password-dialog__error"
        >
          {{ t('database.security.passwordLengthWarning', '密码长度必须为 12–128 位') }}
        </div>
      </div>
      <template #footer>
        <el-button @click="closeCredentialPasswordDialog('cancel')">{{ t('common.cancel', '取消') }}</el-button>
        <el-button type="primary" @click="confirmCredentialPasswordDialog">{{ t('database.modifyPassword', '修改密码') }}</el-button>
      </template>
    </custom-dialog>
    <install-task-drawer
      v-model="phpMyAdminDrawer.visible"
      :task-id="phpMyAdminDrawer.taskId"
      :close-on-click-modal="true"
      @retry="installPhpMyAdmin"
    />
  </div>
</template>

<style scoped lang="less">
.database-container {
  .tip {
    width: 100%;
    min-height: 60px;
    margin-top: 20px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    background: var(--surface-card);
    box-shadow: var(--shadow-xs);

    span {
      color: var(--text-tertiary);
      font-size: 13px;
    }
  }

  .phpmyadmin-card {
    margin-bottom: 14px;
    padding: 14px 16px;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    background:
      linear-gradient(110deg, color-mix(in srgb, var(--el-color-primary) 7%, transparent), transparent 48%),
      var(--surface-card);
    box-shadow: var(--shadow-xs);

    &__icon {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border-radius: 11px;
      color: var(--el-color-primary);
      background: color-mix(in srgb, var(--el-color-primary) 12%, var(--surface-card));

      .el-icon {
        font-size: 20px;
      }
    }

    &__content {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 5px;

      > span {
        color: var(--text-tertiary);
        font-size: 12px;
        line-height: 1.45;
      }
    }

    &__title {
      display: flex;
      align-items: center;
      gap: 8px;

      strong {
        color: var(--text-primary);
        font-size: 14px;
        font-weight: 650;
      }
    }

    &__actions {
      display: flex;
      align-items: center;
      gap: 8px;

      :deep(.el-button) {
        min-height: 36px;
        padding: 8px 14px;
        border-radius: 9px;
        font-size: 13px;
      }
    }

    &__status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }
  }

  .database-row-actions {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 6px;
    white-space: nowrap;

    :deep(.el-button) {
      margin-left: 0;
      padding-inline: 4px;
    }

    :deep(.el-dropdown) {
      display: inline-flex;
      align-items: center;
    }
  }
}

@media (max-width: 920px) {
  .database-container .phpmyadmin-card {
    grid-template-columns: 40px minmax(0, 1fr);

    &__actions {
      grid-column: 1 / -1;
      justify-content: flex-end;
    }
  }
}

.verify-password-dialog {
  &__desc {
    margin-bottom: 18px;
    color: var(--text-secondary);
    line-height: 1.7;
  }
}

.credential-password-dialog {
  &__desc {
    margin-bottom: 18px;
    color: var(--text-secondary);
    line-height: 1.7;
  }

  &__error {
    margin-top: 10px;
    color: var(--el-color-danger);
    font-size: 13px;
    line-height: 1.6;
  }
}
</style>
