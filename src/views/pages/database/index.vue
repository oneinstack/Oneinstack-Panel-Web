<script setup lang="ts">
import CardTabs from '@/components/card-tabs.vue'
import { computed, reactive } from 'vue'
import { Api } from '@/api/Api'
import { ElMessage, FormInstance } from 'element-plus'
import { FormItem } from '@/components/custom-form.vue'
import System from '@/utils/System'
import { ColumnItem } from '@/components/custom-table.vue'

export interface ConfProps {
  conf: typeof conf
}

const conf = reactive({
  themeColor: {
    light: ['#F7911C'],
    dark: ['#EAB170']
  },
  showTips: true,
  credential: {
    show: false,
    database: '',
    username: '',
    password: '',
    open: (value: any) => {
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
        index: 3,
        value: 'redis'
      },
      // {
      //   name: 'PgSQL',
      //   index: 4
      // }
    ],
    clickActive: (item: any) => {
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
            { prop: 'name', label: '数据库名' },
            { prop: 'user', label: '用户名' },
            { prop: 'encoding', label: '字符集', placeholder: 'utf8mb4' },
            { prop: 'capacity', label: '容量', placeholder: '未配置' },
            { prop: 'p_addr', label: '数据库位置' },
            { prop: 'action', label: '操作' }
          ]
        case 'redis':
          return [
            { prop: 'key', label: '键' },
            { prop: 'type', label: '类型' },
            { prop: 'length', label: '长度' },
            { prop: 'expiration', label: '有效期' }
          ]
        default:
          return []
      }
    }),
    getData: async () => {
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
    title: '添加数据库',
    type: 'add',
    loading: false,
    open: (type: 'add') => {
      conf.drawer.type = type
      conf.drawer.show = true
      conf.drawer.title = '添加数据库'
    },
    onClose: () => {
      conf.form.instance?.clearValidate()
      conf.form.instance?.resetFields()
      conf.drawer.show = false
    },
    onConfirm: () => {
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
          ElMessage.success('数据库和专用用户创建成功')
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
                label: '数据库名',
                prop: 'name',
                type: 'custom',
                rules: [{ required: true, message: '请输入数据库名', trigger: 'blur' }]
              },
              {
                label: '添加至',
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
                rules: [{ required: true, message: '请选择', trigger: 'change' }]
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
  const text = `数据库：${conf.credential.database}\n用户名：${conf.credential.username}\n密码：${conf.credential.password}`
  await navigator.clipboard.writeText(text)
  ElMessage.success('账号密码已复制')
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
      title="数据库账号"
    >
      <el-alert
        title="该账号只拥有当前数据库权限，请妥善保存密码。"
        type="success"
        :closable="false"
        show-icon
        style="margin-bottom: 18px"
      />
      <el-form label-width="78px">
        <el-form-item label="数据库">
          <el-input :model-value="conf.credential.database" readonly />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input :model-value="conf.credential.username" readonly />
        </el-form-item>
        <el-form-item label="密码">
          <el-input :model-value="conf.credential.password" readonly show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="conf.credential.show = false">关闭</el-button>
        <el-button type="primary" @click="copyCredential">复制账号密码</el-button>
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
</style>
