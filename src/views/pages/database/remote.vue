<script setup lang="ts">
import { computed, reactive, toRaw } from 'vue'
import { Back } from '@element-plus/icons-vue'
import { Api } from '@/api/Api'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { FormItem } from '@/components/custom-form.vue'
import System from '@/utils/System'
import i18n from '@/lang'

const requestedConnectionType = String(System.getRouterParams().type || 'mysql')
const connectionType = ['mysql', 'redis'].includes(requestedConnectionType)
  ? requestedConnectionType
  : 'mysql'
const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}

const conf: Record<string, any> = reactive({
  themeColor: {
    light: ['#F7911C'],
    dark: ['#EAB170']
  },
  list: {
    loading: true,
    data: [],
    params: {
      type: connectionType
    },
    columns: computed(() => [
      { prop: 'addr', label: t('database.remote.databaseAddress', 'Database address') },
      { prop: 'port', label: t('database.remote.port', 'Port') },
      { prop: 'root', label: t('common.username', 'Username') },
      { prop: 'passwordConfigured', label: t('database.remote.passwordStatus', 'Password status') },
      { prop: 'remark', label: t('common.remark', 'Remark') },
      { prop: 'action', label: t('common.action', 'Action') }
    ]),
    getData: async () => {
      conf.list.loading = true
      const { data } = await Api.getConnlist(conf.list.params)
      conf.list.loading = false
      conf.list.data = data
    },
    syncData: async (id: number) => {
      await Api.syncDatabaseConn({ id })
      ElMessage.success(t('database.remote.syncSuccess', 'Sync succeeded'))
    },
    testData: async (row: any) => {
      await Api.testDatabaseConn({ ...row, password: '' })
      ElMessage.success(t('database.remote.testSuccess', 'Connection test succeeded'))
    },
    deleteData: async (row: any) => {
      try {
        await ElMessageBox.confirm(
          t('database.remote.removeConfirmMessage', 'Remove {address} from the panel? This only deletes the connection and synced records in the panel, not the remote database.', { address: `${row.addr}:${row.port}` }),
          t('database.remote.removeConnection', 'Remove database connection'),
          {
            type: 'warning',
            confirmButtonText: t('database.remote.confirmRemove', 'Confirm removal'),
            cancelButtonText: t('common.cancel', 'Cancel')
          }
        )
        await Api.deleteDatabaseConn({ id: row.id })
        ElMessage.success(t('database.remote.connectionRemoved', 'Database connection removed'))
        await conf.list.getData()
      } catch (error: any) {
        if (error === 'cancel' || error === 'close') return
        throw error
      }
    }
  },
  drawer: {
    show: false,
    title: '',
    type: 'add',
    loading: false,
    open: (type: 'add' | 'edit', row?: any) => {
      conf.drawer.title = t('database.remote.addDatabase', 'Add database')
      if (type === 'edit') {
        conf.drawer.title = t('database.remote.editDatabase', 'Edit database')
        const cloneRow = structuredClone(toRaw(row))
        cloneRow.password = ''
        conf.form.data.value = cloneRow
      }
      conf.drawer.type = type
      conf.drawer.show = true
    },
    onClose: () => {
      conf.form.instance?.clearValidate()
      conf.form.instance?.resetFields()
      conf.drawer.show = false
    },
    onConfirm: () => {
      conf.form.instance?.validate(async (valid: boolean) => {
        if (!valid) return
        conf.drawer.loading = true
        try {
          const api = conf.drawer.type === 'add' ? Api.addDatabaseConn : Api.updateDatabaseConn
          await api(conf.form.data.value)
          conf.form.data.value.password = ''
          ElMessage.success(conf.drawer.type === 'add' ? t('database.remote.addSuccess', 'Connection tested and added') : t('database.remote.saveSuccess', 'Connection tested and saved'))
          await conf.list.getData()
          conf.drawer.show = false
        } finally {
          conf.drawer.loading = false
        }
      })
    }
  },
  form: {
    instance: null as FormInstance | null,
    data: {
      value: {
        type: connectionType
      } as any,
      items: computed<FormItem[]>((): FormItem[] => {
        switch (conf.list.params.type) {
          case 'mysql':
          case 'redis':
            return [
              {
                label: t('database.remote.databaseAddress', 'Database address'),
                prop: 'addr',
                type: 'input',
                rules: [{ required: true, message: t('database.remote.inputDatabaseAddress', 'Enter database address'), trigger: 'blur' }]
              },
              {
                label: t('database.remote.port', 'Port'),
                prop: 'port',
                type: 'input',
                rules: [{ required: true, message: t('database.remote.inputPort', 'Enter port'), trigger: 'blur' }]
              },
              {
                label: t('common.username', 'Username'),
                prop: 'root',
                type: 'input',
                rules: [{ required: true, message: t('database.remote.inputUsername', 'Enter username'), trigger: 'blur' }]
              },
              {
                label: t('common.password', 'Password'),
                prop: 'password',
                type: 'password',
                placeholder: conf.drawer.type === 'edit' ? t('database.remote.keepPasswordPlaceholder', 'Leave blank to keep existing password') : '',
                rules: [{
                  required: conf.list.params.type === 'mysql' && conf.drawer.type === 'add',
                  message: t('database.remote.inputPassword', 'Enter password'),
                  trigger: 'blur'
                }]
              },
              {
                label: t('common.remark', 'Remark'),
                prop: 'remark',
                type: 'textarea'
              }
            ]
          default:
            return []
        }
      })
    }
  }
})

conf.list.getData()
</script>

<template>
  <div class="database-container">
    <div class="container">
      <div class="tool-bar">
        <div class="btn-group">
          <el-button type="primary" @click="conf.drawer.open('add')">{{ $t('database.remote.addRemoteServer') }}</el-button>
        </div>
      </div>
      <div class="box2">
        <div class="drawerHeader">
          <div class="back" @click="System.router.back()">
            <el-icon><Back /></el-icon>
            <span>{{ $t('common.back') }}</span>
          </div>
          <span class="title">{{ $t('database.remote.remoteServer') }}</span>
        </div>
        <custom-table :loading="conf.list.loading" :data="conf.list.data" :columns="conf.list.columns">
          <template #empty>
            <div style="margin-top: 40px">
              <span>
                {{ $t('database.remote.emptyPrefix') }}
                <a
                  class="cursor-pointer"
                  style="color: var(--el-color-primary); text-decoration: underline"
                  @click="conf.drawer.open('add')"
                >
                  {{ $t('database.remote.emptyAction') }}
                </a>
              </span>
            </div>
          </template>
          <template #passwordConfigured="{ row }">
            <el-tag :type="row.passwordConfigured ? 'success' : 'info'">
              {{ row.passwordConfigured ? $t('database.remote.passwordConfigured') : $t('database.notConfigured') }}
            </el-tag>
          </template>
          <template #action="{ row }">
            <el-button type="primary" link @click="conf.drawer.open('edit', row)">{{ $t('common.edit') }}</el-button>
            <el-button type="primary" link @click="conf.list.testData(row)">{{ $t('database.remote.test') }}</el-button>
            <el-button type="primary" link @click="conf.list.syncData(row.id)">{{ $t('common.sync') }}</el-button>
            <el-button type="danger" link @click="conf.list.deleteData(row)">{{ $t('common.remove') }}</el-button>
          </template>
        </custom-table>
      </div>
    </div>

    <custom-drawer
      :visible="conf.drawer.show"
      :title="conf.drawer.title"
      :loading="conf.drawer.loading"
      :on-close="conf.drawer.onClose"
      :on-confirm="conf.drawer.onConfirm"
    >
      <template v-if="conf.drawer.type === 'add' || conf.drawer.type === 'edit'">
        <custom-form :data="conf.form.data" :on-init="(el) => (conf.form.instance = el)"></custom-form>
      </template>
    </custom-drawer>
  </div>
</template>

<style scoped lang="less">


.drawerHeader {
  padding: 20px 0;
  display: flex;
  flex-direction: row;
  align-items: center;

  .back {
    margin-right: 20px;
    display: flex;
    align-items: center;
    color: var(--font-color-gray);
    cursor: pointer;
    border-right: 0.4px solid var(--font-color-gray);
    padding-right: 10px;

    span {
      margin-left: 5px;
    }
  }

  .title {
    font-size: 16px;
    font-weight: 600;
    color: var(--font-color-black);
  }
}
</style>
