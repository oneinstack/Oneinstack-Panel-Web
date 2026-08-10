<script setup lang="ts">
import sapp from '@/sstore/sapp'
import System from '@/utils/System'
import { CircleClose, Setting } from '@element-plus/icons-vue'
import type { ConfProps } from './index.vue'
import { Api } from '@/api/Api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive } from 'vue'
import DatabaseBackupDrawer from './components/DatabaseBackupDrawer.vue'
import i18n from '@/lang'

const { conf } = defineProps<ConfProps>()
const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}

conf.list.getData()

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
</script>

<template>
  <div v-if="conf.showTips" class="tip">
    <div class="flex items-center fit-width">
      <v-s-icon name="warning" size="22" :color="conf.themeColor[sapp.theme]" />
      <span class="ellipsis" style="margin-left: 32px; flex: 1;">
        {{ $t('database.backupScheduleTipPrefix') }}
        <span style="color: var(--el-color-primary)">{{ $t('layout.menu.cron') }}</span>
        {{ $t('database.backupScheduleTipSuffix') }}
      </span>
    </div>
    <el-icon class="cursor-pointer" size="26" color="#A2A2A2" @click="conf.showTips = false" style="margin-left: 24px;"><CircleClose /></el-icon>
  </div>
  <div class="container">
    <div class="tool-bar">
      <el-space class="btn-group" :size="14">
        <el-button type="primary" @click="conf.drawer.open('add')">{{ $t('database.addDatabase') }}</el-button>
        <el-button type="primary" @click="System.router.push('/database/remote')">{{ $t('database.remoteDatabase') }}</el-button>
      </el-space>
      <div class="demo-form-inline">
        <search-input
          v-model="conf.list.params.name"
          :placeholder="$t('database.searchDatabasePlaceholder')"
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
          <div style="margin-top: 40px">
            <span>
              {{ $t('database.emptyListPrefix') }}
              <a
                class="cursor-pointer"
                style="color: var(--el-color-primary); text-decoration: underline"
                @click="conf.drawer.open('add')"
              >
                {{ $t('database.emptyListAction') }}
              </a>
            </span>
          </div>
        </template>
        <template #action="{ row }">
          <el-button type="primary" link @click="viewCredential(row)">{{ $t('database.viewAccount') }}</el-button>
          <el-button type="primary" link @click="updateCredential(row)">{{ $t('database.modifyPassword') }}</el-button>
          <el-button type="primary" link @click="createBackup(row)">{{ $t('database.backup.backup') }}</el-button>
          <el-button type="primary" link @click="openBackupPanel(row)">{{ $t('database.backup.manageBackups') }}</el-button>
          <el-button type="danger" link @click="deleteDatabase(row)">{{ $t('common.delete') }}</el-button>
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
          {{ $t('database.security.verifyPanelPasswordTip') }}
        </div>
        <el-input
          v-model="verifyPanelPasswordDialog.password"
          type="password"
          show-password
          autocomplete="current-password"
          :placeholder="$t('database.security.panelPasswordPlaceholder')"
          @keyup.enter="confirmVerifyPanelPasswordDialog"
        />
      </div>
      <template #footer>
        <el-button @click="closeVerifyPanelPasswordDialog('cancel')">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="confirmVerifyPanelPasswordDialog">{{ $t('common.confirm') }}</el-button>
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
          {{ $t('database.security.newPasswordTip') }}
        </div>
        <el-input
          v-model="credentialPasswordDialog.password"
          type="password"
          show-password
          autocomplete="new-password"
          :placeholder="$t('database.security.newPasswordPlaceholder')"
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
          {{ $t('database.security.passwordLengthWarning') }}
        </div>
      </div>
      <template #footer>
        <el-button @click="closeCredentialPasswordDialog('cancel')">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="confirmCredentialPasswordDialog">{{ $t('database.modifyPassword') }}</el-button>
      </template>
    </custom-dialog>
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
