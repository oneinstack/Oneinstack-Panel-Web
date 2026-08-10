<script setup lang="ts">
import SearchInput from '@/components/search-input.vue'
import { reactive } from 'vue'
import { Delete, Setting } from '@element-plus/icons-vue'
import type { ColumnItem } from '@/components/custom-table.vue'

const columns: ColumnItem[] = [
  { type: 'selection', width: 55 },
  { prop: 'date', label: '网站名', width: 180 },
  { prop: 'status', label: '状态', width: 180, slot: 'status' },
  { prop: 'backup', label: '备份', formatter: (row) => row.address },
  { prop: 'rootDirectory', label: '根目录', formatter: (row) => row.address },
  { prop: 'dailyTraffic', label: '日流量', formatter: (row) => row.address },
  { prop: 'expiresAt', label: '到期时间', formatter: (row) => row.address },
  { prop: 'remark', label: '备注', formatter: (row) => row.address },
  { prop: 'php', label: 'PHP', formatter: (row) => row.address },
  { prop: 'ssl', label: 'SSL证书', formatter: (row) => row.address },
  { prop: 'actionColumn', label: '操作', width: 180, fixed: 'right', slot: 'actionColumn', className: 'table-action-column' }
]

const conf = reactive({
  activeName: 0,
  tabs: [
    {
      name: '操作日志',
      index: 0
    },
    {
      name: '运行日志',
      index: 1
    },
    {
      name: '计划任务日志',
      index: 2
    }
  ],
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
          <el-tab-pane v-for="item in conf.tabs" :key="item.index" :label="item.name" :name="item.index" />
        </el-tabs>
      </div>
      <div class="tool-bar">
        <el-space :size="14" class="btn-group">
          <el-button type="primary" @click="conf.handleAdd">刷新日志</el-button>
          <el-button type="primary" @click="conf.handleAdd">清空日志</el-button>
          <el-button type="primary" @click="conf.handleAdd">IP操作统计</el-button>
        </el-space>
        <div class="demo-form-inline">
          <SearchInput placeholder="请输入关键词进行搜索" />
        </div>
      </div>

      <custom-table :data="conf.tableData" :columns="columns" :pagination="false" border style="width: 100%">
        <template #status="scope">
            <div style="display: flex; flex-direction: row; align-items: center; cursor: pointer">
              <a style="color: #64ffc9; text-decoration: underline" v-if="scope.row.status == 1">运行中</a>
              <a style="color: #ff8888; text-decoration: underline" v-if="scope.row.status == 2">已停用</a>
            </div>
        </template>
        <template #actionColumn>
            <div class="table-row-actions">
              <el-button plain type="primary" :icon="Setting" size="small">设置</el-button>
              <el-button link type="danger" :icon="Delete" size="small">删除</el-button>
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
