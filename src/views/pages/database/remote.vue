<script setup lang="ts">
import { computed, reactive, toRaw } from 'vue'
import { Hide, View, CopyDocument, Back } from '@element-plus/icons-vue'
import { Api } from '@/api/Api'
import { ElMessage, FormInstance } from 'element-plus'
import { FormItem } from '@/components/custom-form.vue'
import System from '@/utils/System'
import { useI18n } from 'vue-i18n'
const {t} = useI18n();
const conf = reactive({
  themeColor: {
    light: ['#F7911C'],
    dark: ['#EAB170']
  },
  list: {
    loading: true,
    data: [],
    params: {
      type: 'mysql'
    },
    columns: [
      { prop: 'addr', label: t('database.databaseAddress')  },
      { prop: 'port', label: t('database.port') },
      { prop: 'root', label: t('commons.login.username')  },
      { prop: 'password', label: t('commons.login.password')  },
      { prop: 'remark', label: t('commons.remark') },
      { prop: 'action', label: t('commons.action'),align:'center' }
    ],
    getData: async () => {
      conf.list.loading = true
      const { data } = await Api.getConnlist(conf.list.params)
      conf.list.loading = false
      conf.list.data = data
    },
    syncData: async (id: number) => {
      await Api.syncDatabaseConn({ id })
      ElMessage.success('同步成功！')
    }
  },
  password: {
    show: {} as { [key: number]: boolean },
    copy: async (value: string) => {
      await navigator.clipboard.writeText(value)
      ElMessage.success('复制成功！')
    }
  },
  drawer: {
    show: false,
    title: t('commons.button.add') + t('database.database'),
    type: 'add',
    loading: false,
    open: (type: 'add' | 'edit', row?: any) => {
      conf.drawer.title = t('commons.button.add') + t('database.database')
      if (type === 'edit') {
        conf.drawer.title = t('commons.button.edit') + t('database.database')
        const cloneRow = structuredClone(toRaw(row))
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
      conf.form.instance?.validate(async (valid) => {
        if (!valid) return
        conf.drawer.loading = true
        const api = conf.drawer.type === 'add' ? Api.addDatabaseConn : Api.updateDatabaseConn
        await api(conf.form.data.value)
        conf.drawer.loading = false
        ElMessage.success(conf.drawer.type === 'add' ? '添加成功！' : '编辑成功！')
        conf.list.getData()
        conf.drawer.show = false
      })
    }
  },
  form: {
    instance: null as FormInstance | null,
    data: {
      value: {
        type: 'mysql'
      } as any,
      items: computed<FormItem[]>(() => {
        switch (conf.list.params.type) {
          case 'mysql':
            return [
              {
                label: t('database.databaseAddress'),
                prop: 'addr',
                type: 'input',
                rules: [{ required: true, message: t('commons.rule.databaseAddress'), trigger: 'blur' }]
              },
              {
                label: t('database.port'),
                prop: 'port',
                type: 'input',
                rules: [{ required: true, message: t('commons.rule.port'), trigger: 'blur' }]
              },
              {
                label: t('commons.login.username'),
                prop: 'root',
                type: 'input',
                rules: [{ required: true, message: t('commons.rule.username'), trigger: 'blur' }]
              },
              {
                label: t('commons.login.password'),
                prop: 'password',
                type: 'password',
                rules: [{ required: true, message: t('commons.rule.password'), trigger: 'blur' }]
              },
              {
                label: t('commons.remark'),
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
  <div class="database-container flex-col">
    <div class="container flex-col">
      <div class="tool-bar">
        <div class="btn-group">
          <el-button type="primary" @click="conf.drawer.open('add')">{{ $t('commons.button.add') }}{{ $t('database.remoteServer') }}</el-button>
        </div>
      </div>
      <div class="box2 flex-col" style="flex: 1;">
        <div class="drawerHeader">
          <div class="back" @click="System.router.back()">
            <el-icon><Back /></el-icon>
            <span>{{ $t('commons.button.back') }}</span>
          </div>
          <span class="title">{{ $t('commons.button.add') }}{{ $t('database.remoteServer') }}</span>
        </div>
        <custom-table :loading="conf.list.loading" :data="conf.list.data" :columns="conf.list.columns">
          <template #empty>
            <div style="margin-top: 40px">
              <span>
                {{ $t('database.tableRemoteNoData')  }}
                <a
                  class="cursor-pointer"
                  style="color: var(--el-color-primary); text-decoration: underline"
                  @click="conf.drawer.open('add')"
                >
                  {{ $t('commons.button.add') }}{{ $t('database.remoteServer') }}
                </a>
              </span>
            </div>
          </template>
          <template #password="{ row, index }">
            <div class="flex items-center" style="gap: 8px">
              <span>
                {{ conf.password.show[index] ? row.password : ''.padEnd(row.password.length, '*') }}
              </span>
              <el-icon
                class="hover-opacity cursor-pointer"
                :size="18"
                @click="conf.password.show[index] = !conf.password.show[index]"
              >
                <View v-if="conf.password.show[index]" />
                <Hide v-else />
              </el-icon>
              <el-icon class="hover-opacity cursor-pointer" @click="conf.password.copy(row.password)">
                <CopyDocument />
              </el-icon>
            </div>
          </template>
          <template #action="{ row }">
            <el-button type="primary" link @click="conf.drawer.open('edit', row)">{{ $t('commons.button.edit') }}</el-button>
            <el-button type="primary" link @click="conf.list.syncData(row.id)">{{ $t('commons.button.sync') }}</el-button>
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
.database-container {
  height: 100%;
  .container{
    margin-top: 24px;
    flex:1;
  }
}

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
