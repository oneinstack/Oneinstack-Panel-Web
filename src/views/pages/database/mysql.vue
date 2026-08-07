<script setup lang="ts">
import sapp from '@/sstore/sapp'
import System from '@/utils/System'
import { ArrowDown, CircleClose, DataAnalysis, Download, Link, Setting } from '@element-plus/icons-vue'
import type { ConfProps } from './index.vue'
import { Api } from '@/api/Api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, watch } from 'vue'
import DatabaseBackupDrawer from './components/DatabaseBackupDrawer.vue'
import DatabaseEnvironmentEmpty from './components/DatabaseEnvironmentEmpty.vue'
import softwareTaskStore from '@/sstore/softwareTask'
import InstallTaskDrawer from '../software/components/InstallTaskDrawer.vue'

const { conf } = defineProps<ConfProps>()

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
  if (phpMyAdminTask.value) return '安装任务正在后台运行，点击可查看实时进度与日志。'
  if (phpMyAdminInstalled.value) {
    return `已安装 ${phpMyAdminItem.value.install_version || ''}，可直接打开或按数据库进入管理。`
  }
  if (!phpItem.value?.installed) return '安装 phpMyAdmin 前需要先安装 PHP 运行环境。'
  if (!webServerItem.value) return '安装 phpMyAdmin 前需要先安装 Nginx、OpenResty、Apache 或 Caddy。'
  return `将安装与 PHP ${phpItem.value.install_version || ''} 兼容的 phpMyAdmin ${phpMyAdminVersion.value}。`
})

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
      `phpMyAdmin 需要先安装 ${name}。是否前往软件商城安装？`,
      `缺少 ${name}`,
      {
        type: 'warning',
        confirmButtonText: `安装 ${name}`,
        cancelButtonText: '暂不安装'
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
    ElMessage.warning('Center 当前没有提供 phpMyAdmin 安装包，请先同步软件商城')
    return
  }
  if (item.installable === false) {
    ElMessage.warning('Center 当前已暂停 phpMyAdmin 安装')
    return
  }
  if (!phpItem.value?.installed) {
    await routeToPrerequisite('PHP', 'php')
    return
  }
  if (!webServerItem.value) {
    await routeToPrerequisite('Web 服务', 'nginx')
    return
  }
  if (!phpMyAdminVersion.value) {
    ElMessage.warning('Center 没有提供与当前 PHP 兼容的 phpMyAdmin 版本')
    return
  }

  phpMyAdminCatalog.installing = true
  try {
    const request = { key: item.key, version: phpMyAdminVersion.value }
    const { data: result } = await Api.installSoft(request)
    softwareTaskStore.acceptCreated(result, request)
    showPhpMyAdminTask(result.taskId)
    ElMessage.success('phpMyAdmin 安装任务已创建')
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
  const databaseName = row.name || row.databaseName || row.id || '当前数据库'

  try {
    await ElMessageBox.confirm(
      `确认立即备份数据库“${databaseName}”吗？备份任务创建后会在后台执行。`,
      '备份确认',
      {
        confirmButtonText: '确认备份',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }

  await Api.createDatabaseBackup({ libraryId: row.id })
  ElMessage.success('备份任务已创建')
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
    ElMessage.warning('请输入当前面板登录密码')
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
    ElMessage.warning('密码长度必须为 12–128 位')
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
    const panelPassword = await verifyPanelPassword('查看数据库账号')
    const { data } = await Api.revealDatabaseCredential(row.id, { panelPassword })
    conf.credential.open(data)
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    if (error?.status === 401 || error?.response?.status === 401) {
      ElMessage.error('当前面板登录密码错误')
      return
    }
    throw error
  }
}

const updateCredential = async (row: any) => {
  try {
    const panelPassword = await verifyPanelPassword('修改数据库密码')
    const password = await requestCredentialPassword(`修改 ${row.name} 的账号密码`)
    const { data } = await Api.updateDatabaseCredential(row.id, {
      panelPassword,
      password: password || undefined
    })
    ElMessage.success('数据库账号密码已修改')
    conf.credential.open(data)
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    if (error?.status === 401 || error?.response?.status === 401) {
      ElMessage.error('当前面板登录密码错误')
      return
    }
    throw error
  }
}

const deleteDatabase = async (row: any) => {
  try {
    const { value } = await ElMessageBox.prompt(
      `此操作将永久删除数据库“${row.name}”及其专用用户，且不会删除现有备份。请输入数据库名确认：`,
      '删除数据库',
      {
        type: 'warning',
        confirmButtonText: '永久删除',
        cancelButtonText: '取消',
        inputPlaceholder: row.name,
        inputValidator: (value: string) => value === row.name || '数据库名不匹配'
      }
    )
    await Api.deleteDatabaseLib({ id: row.id, confirmName: value })
    ElMessage.success('数据库和专用用户已删除')
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
        请在添加数据库后，务必到[
        <span style="color: var(--el-color-primary)">计划任务</span>
        ]添加定时备份任务，以确保您的数据安全。温馨提示：通过第三方或者MySQL命令行创建的数据库需要点击"从服务器获取"才能在计划任务中备份
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
          <strong>phpMyAdmin 快捷管理</strong>
          <el-tag v-if="phpMyAdminInstalled" type="success" effect="plain">已安装</el-tag>
          <el-tag v-else-if="phpMyAdminTask" type="warning" effect="plain">安装中</el-tag>
          <el-tag v-else type="info" effect="plain">未安装</el-tag>
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
          查看安装进度
        </el-button>
        <el-button
          v-else-if="phpMyAdminInstalled"
          type="primary"
          :icon="Link"
          @click="openPhpMyAdmin()"
        >
          打开 phpMyAdmin
        </el-button>
        <el-button
          v-else
          type="primary"
          :icon="Download"
          :loading="phpMyAdminCatalog.loading || phpMyAdminCatalog.installing"
          @click="installPhpMyAdmin"
        >
          快捷安装
        </el-button>
        <el-button @click="System.router.push('/software?component=phpmyadmin')">版本与详情</el-button>
      </div>
    </div>
    <div class="tool-bar">
      <el-space class="btn-group" :size="14">
        <el-button type="primary" :disabled="showEnvironmentEmpty" @click="conf.drawer.open('add')">添加数据库</el-button>
        <!-- <el-button type="primary">root密码</el-button> -->
        <el-button type="primary" @click="System.router.push('/database/remote?type=mysql')">远程数据库</el-button>
        <!-- <el-button type="primary">phpMyAdmin</el-button>
        <el-dropdown>
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
          <span style="font-size: 14px; margin-right: 8px">nignx</span>
          <el-icon><CaretBottom /></el-icon>
        </el-button>
        <el-dropdown>
          <el-button type="primary">
            <span class="el-dropdown-link">
              全部
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>分类1</el-dropdown-item>
              <el-dropdown-item>分类2</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown> -->
      </el-space>
      <div class="demo-form-inline">
        <search-input
          v-model="conf.list.params.name"
          placeholder="请输入数据库名称"
          style="margin-right: 18px"
          @search="conf.list.getData"
        />
      </div>
    </div>
    <div class="box2">
      <custom-table
        v-model:page="conf.list.params.page"
        :loading="conf.list.loading"
        :data="conf.list.data"
        :auto-pagination="false"
        :total="conf.list.total"
        :page-size="conf.list.params.pageSize"
        :columns="conf.list.columns"
        @update:page="conf.list.getData"
      >
        <template #empty>
          <database-environment-empty
            v-if="showEnvironmentEmpty"
            type="mysql"
            :installed="conf.environment.mysql"
          />
          <div v-else style="margin-top: 40px">
            <span>
              您的数据库列表为空，您可以
              <a
                class="cursor-pointer"
                style="color: var(--el-color-primary); text-decoration: underline"
                @click="conf.drawer.open('add')"
              >
                添加一个数据库
              </a>
            </span>
          </div>
        </template>
        <template #action="{ row }">
          <div class="database-row-actions">
            <el-button
              v-if="phpMyAdminInstalled"
              type="primary"
              link
              :icon="Link"
              @click="openPhpMyAdmin(row.name)"
            >快捷管理</el-button>
            <el-button type="primary" link @click="viewCredential(row)">查看账号</el-button>
            <el-button type="primary" link @click="updateCredential(row)">修改密码</el-button>
            <el-dropdown trigger="click" @command="(command: string) => handleMoreAction(command, row)">
              <el-button type="primary" link>
                更多
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="backup">立即备份</el-dropdown-item>
                  <el-dropdown-item command="backup-manager">备份管理</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <span class="database-danger-action">删除数据库</span>
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
          为保护数据库密码，请输入当前面板登录密码完成二次认证。
        </div>
        <el-input
          v-model="verifyPanelPasswordDialog.password"
          type="password"
          show-password
          autocomplete="current-password"
          placeholder="请输入当前面板登录密码"
          @keyup.enter="confirmVerifyPanelPasswordDialog"
        />
      </div>
      <template #footer>
        <el-button @click="closeVerifyPanelPasswordDialog('cancel')">取消</el-button>
        <el-button type="primary" @click="confirmVerifyPanelPasswordDialog">确认</el-button>
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
          输入 12–128 位新密码；留空则由服务端生成高强度随机密码。
        </div>
        <el-input
          v-model="credentialPasswordDialog.password"
          type="password"
          show-password
          autocomplete="new-password"
          placeholder="请输入新密码，留空则自动生成随机密码"
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
          密码长度必须为 12–128 位
        </div>
      </div>
      <template #footer>
        <el-button @click="closeCredentialPasswordDialog('cancel')">取消</el-button>
        <el-button type="primary" @click="confirmCredentialPasswordDialog">修改密码</el-button>
      </template>
    </custom-dialog>
    <install-task-drawer
      v-model="phpMyAdminDrawer.visible"
      :task-id="phpMyAdminDrawer.taskId"
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
    margin-bottom: 18px;
    padding: 18px 20px;
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) auto;
    align-items: center;
    gap: 16px;
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    background:
      linear-gradient(110deg, color-mix(in srgb, var(--el-color-primary) 7%, transparent), transparent 48%),
      var(--surface-card);
    box-shadow: var(--shadow-xs);

    &__icon {
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      border-radius: 13px;
      color: var(--el-color-primary);
      background: color-mix(in srgb, var(--el-color-primary) 12%, var(--surface-card));

      .el-icon {
        font-size: 24px;
      }
    }

    &__content {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 7px;

      > span {
        color: var(--text-tertiary);
        font-size: 13px;
        line-height: 1.5;
      }
    }

    &__title {
      display: flex;
      align-items: center;
      gap: 10px;

      strong {
        color: var(--text-primary);
        font-size: 15px;
        font-weight: 650;
      }
    }

    &__actions {
      display: flex;
      align-items: center;
      gap: 10px;
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

.database-danger-action {
  color: var(--el-color-danger);
}

@media (max-width: 920px) {
  .database-container .phpmyadmin-card {
    grid-template-columns: 48px minmax(0, 1fr);

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
