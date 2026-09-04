<script setup lang="ts">
import CardTabs from '@/components/card-tabs.vue'
import { computed, reactive } from 'vue'
import { Api } from '@/api/modules'
import { ElMessage, FormInstance } from 'element-plus'
import { FormItem } from '@/components/custom-form.vue'
import System from '@/utils/System'
import { ColumnItem } from '@/components/custom-table.vue'
import i18n from '@/lang'
import { hasOperationAccess } from '@/utils/access'

export interface ConfProps {
  conf: typeof conf
}

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const canReadDatabase = computed(() => hasOperationAccess('database', 'read'))
const canWriteDatabase = computed(() => hasOperationAccess('database', 'write'))

const conf = reactive({
  themeColor: {
    light: ['#F7911C'],
    dark: ['#EAB170']
  },
  showTips: true,
  environment: {
    loading: true,
    mysql: false,
    redis: false,
    getData: async () => {
      if (!canReadDatabase.value) {
        conf.environment.loading = false
        return
      }
      conf.environment.loading = true
      try {
        const { data } = await Api.getStorageInfo()
        conf.environment.mysql = Boolean(data?.mysql)
        conf.environment.redis = Boolean(data?.redis)
      } finally {
        conf.environment.loading = false
      }
    }
  },
  credential: {
    show: false,
    database: '',
    username: '',
    password: '',
    open: (value: any) => {
      if (!canReadDatabase.value) return
      conf.credential.database = value.database || ''
      conf.credential.username = value.username || ''
      conf.credential.password = value.password || ''
      conf.credential.show = true
    }
  },
  tabs: {
    activeIndex: 0,
    list: [
      {
        name: 'MySQL',
        nameKey: 'database.mysql',
        index: 0,
        value: 'mysql'
      },
      // {
      //   name: 'SQLServer',
      //   index: 1
      // },
      // {
      //   name: 'MongoDB',
      //   index: 2
      // },
      {
        name: 'Redis',
        nameKey: 'database.redis',
        index: 3,
        value: 'redis'
      },
      // {
      //   name: 'PgSQL',
      //   index: 4
      // }
    ],
    clickActive: (item: any) => {
      if (!canReadDatabase.value) return
      if (conf.tabs.activeIndex === item.index) return
      conf.list.params = {
        page: 1,
        pageSize: 10,
        type: 'mysql'
      }
      conf.tabs.activeIndex = item.index
      conf.list.params.type = item.value
      conf.form.data.value.type = item.value
      conf.list.loading = false
      conf.list.total = 0
      conf.list.data = []
      System.router.push(`/database/${item.value}`)
    }
  },
  list: {
    loading: true,
    data: [],
    total: 0,
    params: {
      page: 1,
      pageSize: 10,
      type: 'mysql'
    } as any,
    columns: computed<ColumnItem[]>(() => {
      switch (conf.list.params.type) {
        case 'mysql':
          return [
            { prop: 'name', label: t('database.databaseName', 'Database name') },
            { prop: 'user', label: t('common.username', 'Username') },
            { prop: 'encoding', label: t('database.encoding', 'Charset'), placeholder: 'utf8mb4' },
            { prop: 'capacity', label: t('database.capacity', 'Capacity'), placeholder: t('database.notConfigured', 'Not configured') },
            { prop: 'p_addr', label: t('database.databaseLocation', 'Database location') },
            { prop: 'action', label: t('common.action', 'Action'), width: 520, fixed: 'right' }
          ]
        case 'redis':
          return [
            { prop: 'key', label: t('database.key', 'Key') },
            { prop: 'type', label: t('common.type', 'Type') },
            { prop: 'length', label: t('database.length', 'Length') },
            { prop: 'expiration', label: t('database.expiration', 'Expiration') }
          ]
        default:
          return []
      }
    }),
    getData: async () => {
      if (!canReadDatabase.value) {
        conf.list.data = []
        conf.list.total = 0
        conf.list.loading = false
        return
      }
      conf.list.loading = true
      const api = conf.list.params.type === 'redis' ? Api.getRedisList : Api.getDatabaseList
      const { data: res } = await api(conf.list.params)
      conf.list.loading = false
      conf.list.total = res.total
      conf.list.data = res[conf.list.params.type === 'redis' ? 'keys' : 'data']
    }
  },
  drawer: {
    show: false,
    title: 'Add database',
    type: 'add',
    loading: false,
    open: (type: 'add') => {
      if (!canWriteDatabase.value) return
      conf.drawer.type = type
      conf.drawer.show = true
      conf.drawer.title = t('database.addDatabase', 'Add database')
    },
    onClose: () => {
      conf.form.instance?.clearValidate()
      conf.form.instance?.resetFields()
      conf.drawer.show = false
    },
    onConfirm: () => {
      if (!canWriteDatabase.value) return
      conf.form.instance?.validate(async (valid) => {
        if (!valid) return
        conf.drawer.loading = true
        try {
          const request = {
            id: conf.form.data.value.id,
            name: conf.form.data.value.name,
            encoding: conf.form.data.value.encoding,
            type: 'mysql'
          }
          const { data: credential } = await Api.addDatabaseLib(request)
          ElMessage.success(t('database.createSuccess', 'Database and dedicated user created'))
          await conf.list.getData()
          conf.drawer.show = false
          conf.credential.open(credential)
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
        encoding: 'utf8',
        type: 'mysql'
      } as any,
      items: computed<FormItem[]>(() => {
        switch (conf.list.params.type) {
          case 'mysql':
            return [
              {
                label: t('database.databaseName', 'Database name'),
                prop: 'name',
                type: 'custom',
                rules: [{ required: true, message: t('database.databaseNameRequired', 'Enter database name'), trigger: 'blur' }]
              },
              {
                label: t('database.addTo', 'Add to'),
                prop: 'id',
                asyncOptions: async () => {
                  const { data } = await Api.getConnlist(conf.list.params)
                  if (!data.length) {
                    conf.form.data.value.id = undefined
                    return []
                  }
                  conf.form.data.value.id = data[0].id
                  return data.map((item: any) => ({
                    label: item.remark ? `${item.remark}(${item.addr})` : item.addr,
                    value: item.id
                  }))
                },
                type: 'select',
                rules: [{ required: true, message: t('common.selectPlaceholder', 'Select'), trigger: 'change' }]
              }
            ]
          default:
            return []
        }
      })
    }
  }
})

const routeName = (System.getRouterPath() as string).match(/(?<=\/database\/)\w*/)?.[0]
conf.tabs.activeIndex = conf.tabs.list.find((item) => item.value === routeName)!.index
conf.list.params.type = routeName

const copyCredential = async () => {
  if (!canReadDatabase.value) return
  const text = `${t('database.database', 'Database')}: ${conf.credential.database}\n${t('common.username', 'Username')}: ${conf.credential.username}\n${t('common.password', 'Password')}: ${conf.credential.password}`
  try {
    let copied = false
    if (window.isSecureContext && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text)
        copied = true
      } catch {
        // Continue with the compatibility copy below.
      }
    }

    if (!copied) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      textarea.style.pointerEvents = 'none'
      document.body.appendChild(textarea)
      try {
        textarea.focus()
        textarea.select()
        copied = document.execCommand('copy')
      } finally {
        textarea.remove()
      }
    }

    if (!copied) throw new Error(t('database.credentialCopyFailed', 'Copy failed. Check browser clipboard permission.'))
    ElMessage.success(t('database.credentialCopied', 'Account and password copied'))
  } catch (error: any) {
    // ElMessage.error(error?.message || t('database.credentialCopyFailed', 'Copy failed. Check browser clipboard permission.'))
  }
}
</script>

<template>
  <div class="database-container">
    <card-tabs :list="conf.tabs.list" :active-index="conf.tabs.activeIndex" :click-active="conf.tabs.clickActive" />
    <router-view :conf="conf" />

    <custom-drawer
      :visible="conf.drawer.show"
      :title="conf.drawer.title"
      :loading="conf.drawer.loading"
      :on-close="conf.drawer.onClose"
      :on-confirm="conf.drawer.onConfirm"
    >
      <template v-if="conf.drawer.type === 'add'">
        <custom-form :data="conf.form.data" :on-init="(el) => (conf.form.instance = el)">
          <template #name="{ row }">
            <el-input v-model="conf.form.data.value.name" :placeholder="row.placeholder">
              <template #append>
                <el-select v-model="conf.form.data.value.encoding" style="width: 120px">
                  <el-option label="utf8" value="utf8" />
                  <el-option label="utf8mb4" value="utf8mb4" />
                  <el-option label="gbk" value="gbk" />
                  <el-option label="big5" value="big5" />
                </el-select>
              </template>
            </el-input>
          </template>
        </custom-form>
      </template>
    </custom-drawer>

    <custom-dialog
      v-model:show="conf.credential.show"
      :title="t('database.databaseAccount', '数据库账号')"
    >
      <el-alert
        :title="t('database.credentialTip', '该账号只拥有当前数据库权限，请妥善保存密码。')"
        type="success"
        :closable="false"
        show-icon
        style="margin-bottom: 18px"
      />
      <el-form label-width="78px">
        <el-form-item :label="t('database.database', '数据库')">
          <el-input :model-value="conf.credential.database" readonly />
        </el-form-item>
        <el-form-item :label="t('common.username', '用户名')">
          <el-input :model-value="conf.credential.username" readonly />
        </el-form-item>
        <el-form-item :label="t('common.password', '密码')">
          <el-input :model-value="conf.credential.password" readonly show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="conf.credential.show = false">{{ t('common.close', '关闭') }}</el-button>
        <el-button v-if="canReadDatabase" type="primary" @click="copyCredential">{{ t('database.copyCredential', '复制账号密码') }}</el-button>
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

@media (max-width: 640px) {
  .database-container {
    :deep(.tip) {
      align-items: flex-start;
      padding: 12px;
      gap: 10px;
    }

    :deep(.tip .fit-width) {
      align-items: flex-start;
    }

    :deep(.tip .ellipsis) {
      margin-left: 10px !important;
      overflow: visible;
      white-space: normal;
      line-height: 1.65;
    }

    :deep(.tip > .el-icon) {
      margin-left: 0 !important;
      flex: 0 0 auto;
    }

    :deep(.demo-form-inline),
    :deep(.demo-form-inline .search-input) {
      width: 100%;
    }
  }
}
</style>
