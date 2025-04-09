<script setup lang="ts">
import SearchInput from '@/components/search-input.vue'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n();
const conf = reactive({
  activeName: 0,
  tabs: [
    {
      name: t('log.operation'),
      index: 0
    },
    {
      name: t('log.run'),
      index: 1
    },
    {
      name: t('log.task'),
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
          <el-button type="primary" @click="conf.handleAdd">{{ $t('log.refresh') }}</el-button>
          <el-button type="primary" @click="conf.handleAdd">{{ $t('log.clear') }}</el-button>
          <el-button type="primary" @click="conf.handleAdd">{{ $t('log.ipOperation') }}</el-button>
        </el-space>
        <div class="demo-form-inline">
          <SearchInput :placeholder="t('log.searchPlaceholder')" />
        </div>
      </div>

      <el-table :data="conf.tableData">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="date" :label="$t('log.user')" width="180" />
        <el-table-column prop="status" :label="$t('log.operationType')" width="180">
          <template #default="scope">
            <div style="display: flex; flex-direction: row; align-items: center; cursor: pointer">
              <a style="color: #64ffc9; text-decoration: underline" v-if="scope.row.status == 1">{{ $t('log.running') }}</a>
              <a style="color: #ff8888; text-decoration: underline" v-if="scope.row.status == 2">{{ $t('log.stop') }}</a>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="address" :label="$t('log.detail')" />
        <el-table-column prop="address" :label="$t('log.operationTime')" />
        <el-table-column prop="address" :label="$t('commons.action')" align="center">
          <template #default>
            <el-button link type="primary">{{ $t('commons.button.setting') }}</el-button>
            <el-button link type="primary">{{ $t('commons.button.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
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
