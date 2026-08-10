<script setup lang="ts">
import { reactive } from 'vue'
import { ConfProps } from './index.vue'
import { Api } from '@/api/Api'
import { WarningFilled } from '@element-plus/icons-vue'
import System from '@/utils/System'

const { conf: parentConf } = defineProps<ConfProps>()

const conf = reactive({
  ...parentConf,
  server: {
    options: [] as { label: string; value: number }[],
    getOptions: async () => {
      const { data } = await Api.getConnlist(conf.list.params)
      conf.server.options = data.map((item: any) => ({
        label: item.remark ? `${item.remark}(${item.addr})` : item.addr,
        value: item.id
      }))
      if (conf.server.options.length) {
        await conf.server.onChange(conf.server.options[0].value)
      } else {
        conf.list.params.id = 0
        conf.dbList.params.id = 0
        conf.dbList.data = []
        conf.list.data = []
      }
    },
    onChange: async (value: number) => {
      conf.list.params.id = value
      conf.dbList.params.id = value
      await conf.dbList.getData()
      const firstDatabase = conf.dbList.data[0]
      if (firstDatabase) {
        await handleTabClick({ paneName: firstDatabase.name })
      } else {
        conf.list.data = []
      }
    }
  },
  dbList: {
    params: {
      page: 1,
      pageSize: 999,
      id: 0,
      type: 'redis'
    },
    data: [] as any[],
    getData: async () => {
      const { data: res } = await Api.getDatabaseList(conf.dbList.params)
      conf.dbList.data = res.data
    }
  }
})

conf.list.loading = false

const handleTabClick = async ({ paneName }: { paneName: string | number | undefined }) => {
  conf.list.params.r_db = paneName
  await conf.list.getData()
}

conf.server.getOptions()
</script>

<template>
  <div class="container">
    <div class="tool-bar">
      <el-space class="btn-group">
        <el-button type="primary" @click="System.router.push('/database/remote?type=redis')">{{ $t('database.remote.remoteServer') }}</el-button>
      </el-space>
      <div class="demo-form-inline flex" style="gap: 16px">
        <span class="flex items-center" style="color: var(--el-color-primary); gap: 8px">
          <el-icon :size="18"><WarningFilled /></el-icon>
          {{ $t('database.redisPanel.currentServerHint') }}
        </span>
        <el-select
          v-model="conf.list.params.id"
          :placeholder="$t('database.redisPanel.selectServer')"
          style="width: 200px"
          :no-data-text="$t('common.noData')"
          @change="conf.server.onChange"
        >
          <el-option v-for="item in conf.server.options" v-bind="item" />
        </el-select>
      </div>
    </div>
    <div class="box2">
      <el-tabs v-if="conf.dbList.data.length" v-model="conf.list.params.r_db" @tab-click="handleTabClick">
        <el-tab-pane v-for="item in conf.dbList.data" :key="item.index" :label="`DB${item.name}`" :name="item.name" />
      </el-tabs>
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
          <div class="no-data">
            <img src="/static/images/empty.webp" alt="" />
            <span>{{ $t('common.noData') }}</span>
          </div>
        </template>
      </custom-table>
    </div>
  </div>
</template>

<style scoped lang="less">
.no-data {
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  color: var(--font-color-gray-light);
}
</style>
