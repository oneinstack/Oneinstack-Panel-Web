<script setup lang="ts">
import sapp from '@/sstore/sapp'
import System from '@/utils/System'
import { CircleClose, Setting } from '@element-plus/icons-vue'
import type { ConfProps } from './index.vue'
import { Api } from '@/api/Api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive } from 'vue'
import DatabaseBackupDrawer from './components/DatabaseBackupDrawer.vue'

const { conf } = defineProps<ConfProps>()

conf.list.getData()

const backupPanel = reactive({
  visible: false,
  library: null as any
})

const openBackupPanel = (row: any) => {
  backupPanel.library = row
  backupPanel.visible = true
}

const createBackup = async (row: any) => {
  await Api.createDatabaseBackup({ libraryId: row.id })
  ElMessage.success('备份任务已创建')
  openBackupPanel(row)
}

const requestPanelPassword = async (title: string) => {
  const { value } = await ElMessageBox.prompt(
    '为保护数据库密码，请输入当前面板登录密码完成二次认证。',
    title,
    {
      inputType: 'password',
      inputPlaceholder: '当前面板登录密码',
      inputValidator: (value: string) => !!value || '请输入当前面板登录密码',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    }
  )
  return value
}

const viewCredential = async (row: any) => {
  try {
    const panelPassword = await requestPanelPassword('查看数据库账号')
    const { data } = await Api.revealDatabaseCredential(row.id, { panelPassword })
    conf.credential.open(data)
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }
}

const updateCredential = async (row: any) => {
  try {
    const panelPassword = await requestPanelPassword('修改数据库密码')
    const { value: password } = await ElMessageBox.prompt(
      '输入 12–128 位新密码；留空则由服务端生成高强度随机密码。',
      `修改 ${row.name} 的账号密码`,
      {
        inputType: 'password',
        inputPlaceholder: '留空自动生成随机密码',
        inputValidator: (value: string) =>
          !value || (value.length >= 12 && value.length <= 128) || '密码长度必须为 12–128 位',
        confirmButtonText: '修改密码',
        cancelButtonText: '取消'
      }
    )
    const { data } = await Api.updateDatabaseCredential(row.id, {
      panelPassword,
      password
    })
    ElMessage.success('数据库账号密码已修改')
    conf.credential.open(data)
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
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
    <div class="tool-bar">
      <el-space class="btn-group" :size="14">
        <el-button type="primary" @click="conf.drawer.open('add')">添加数据库</el-button>
        <!-- <el-button type="primary">root密码</el-button> -->
        <el-button type="primary" @click="System.router.push('/database/remote')">远程数据库</el-button>
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
        <el-button :icon="Setting" type="primary" />
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
          <el-button type="primary" link @click="viewCredential(row)">查看账号</el-button>
          <el-button type="primary" link @click="updateCredential(row)">修改密码</el-button>
          <el-button type="primary" link @click="createBackup(row)">备份</el-button>
          <el-button type="primary" link @click="openBackupPanel(row)">备份管理</el-button>
          <el-button type="danger" link @click="deleteDatabase(row)">删除</el-button>
        </template>
      </custom-table>
    </div>
    <database-backup-drawer v-model="backupPanel.visible" :library="backupPanel.library" />
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
</style>
