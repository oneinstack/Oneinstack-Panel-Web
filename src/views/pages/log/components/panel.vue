<script setup lang="ts">
import SearchInput from '@/components/search-input.vue'
import { computed, reactive } from 'vue'
import { Delete, Setting } from '@element-plus/icons-vue'
import type { ColumnItem } from '@/components/custom-table.vue'
import i18n from '@/lang'

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const columns = computed<ColumnItem[]>(() => [
  { type: 'selection', width: 55 },
  { prop: 'date', label: t('log.legacyPanel.websiteName', 'Website name'), width: 180 },
  { prop: 'status', label: t('common.status', 'Status'), width: 180, slot: 'status' },
  { prop: 'backup', label: t('log.legacyPanel.backup', 'Backup'), formatter: (row) => row.address },
  { prop: 'rootDirectory', label: t('log.legacyPanel.rootDirectory', 'Root directory'), formatter: (row) => row.address },
  { prop: 'dailyTraffic', label: t('log.legacyPanel.dailyTraffic', 'Daily traffic'), formatter: (row) => row.address },
  { prop: 'expiresAt', label: t('log.legacyPanel.expiresAt', 'Expiration time'), formatter: (row) => row.address },
  { prop: 'remark', label: t('common.remark', 'Remark'), formatter: (row) => row.address },
  { prop: 'php', label: 'PHP', formatter: (row) => row.address },
  { prop: 'ssl', label: t('log.legacyPanel.sslCertificate', 'SSL certificate'), formatter: (row) => row.address },
  { prop: 'actionColumn', label: t('common.action', 'Action'), width: 180, fixed: 'right', slot: 'actionColumn', className: 'table-action-column' }
])

const tabs = computed(() => [
  {
    name: t('log.legacyPanel.operationLogs', 'Operation logs'),
    index: 0
  },
  {
    name: t('log.legacyPanel.runtimeLogs', 'Runtime logs'),
    index: 1
  },
  {
    name: t('log.legacyPanel.scheduledTaskLogs', 'Scheduled task logs'),
    index: 2
  }
])

const conf = reactive({
  activeName: 0,
  drawer: false,
  tableData: [
    {
      date: 'www.baidu.com',
      status: 1,
      address: 'No. 189, Grove St, Los Angeles'
    },
    {
      date: '2016-05-02',
      status: 2,
      address: 'No. 189, Grove St, Los Angeles'
    },
    {
      date: '2016-05-04',
      status: 1,
      address: 'No. 189, Grove St, Los Angeles'
    },
    {
      date: '2016-05-01',
      status: 1,
      address: 'No. 189, Grove St, Los Angeles'
    }
  ],
  handleAdd: () => {
    conf.drawer = true
  },
  handleClick: () => {
    console.log('click')
  }
})
</script>

<template>
  <div>
    <div class="box2">
      <div class="category">
        <el-tabs v-model="conf.activeName" @tab-click="conf.handleClick">
          <el-tab-pane v-for="item in tabs" :key="item.index" :label="item.name" :name="item.index" />
        </el-tabs>
      </div>
      <div class="tool-bar">
        <el-space :size="14" class="btn-group">
          <el-button type="primary" @click="conf.handleAdd">{{ $t('log.legacyPanel.refreshLogs') }}</el-button>
          <el-button type="primary" @click="conf.handleAdd">{{ $t('log.legacyPanel.clearLogs') }}</el-button>
          <el-button type="primary" @click="conf.handleAdd">{{ $t('log.legacyPanel.ipOperationStats') }}</el-button>
        </el-space>
        <div class="demo-form-inline">
          <SearchInput :placeholder="$t('common.searchKeywordPlaceholder')" />
        </div>
      </div>

      <custom-table :data="conf.tableData" :columns="columns" :pagination="false" border style="width: 100%">
        <template #status="scope">
            <div style="display: flex; flex-direction: row; align-items: center; cursor: pointer">
              <a style="color: #64ffc9; text-decoration: underline" v-if="scope.row.status == 1">{{ $t('log.legacyPanel.statusRunning') }}</a>
              <a style="color: #ff8888; text-decoration: underline" v-if="scope.row.status == 2">{{ $t('log.legacyPanel.statusDisabled') }}</a>
            </div>
        </template>
        <template #actionColumn>
            <div class="table-row-actions">
              <el-button link type="primary" :icon="Setting" size="small">{{ $t('website.settings') }}</el-button>
              <el-button link type="danger" :icon="Delete" size="small">{{ $t('common.delete') }}</el-button>
            </div>
        </template>
      </custom-table>
      <div class="pagination">
        <el-pagination background layout="prev, pager, next" :total="1000" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.category {
  height: 60px;
  background: rgba(var(--category-item-bg-color), 0.6);
  border-radius: 4px;
}

:deep(.el-tabs__nav-wrap) {
  &::after {
    background: transparent;
  }
}
</style>
