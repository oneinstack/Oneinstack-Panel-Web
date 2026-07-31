<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Refresh, Search, DocumentChecked } from '@element-plus/icons-vue'
import { Api } from '@/api/Api'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const actionLabels: Record<string, string> = {
  'file.read': '读取文件',
  'file.create': '新建',
  'file.upload': '上传',
  'file.download': '下载',
  'file.trash': '移入回收站',
  'file.restore': '恢复',
  'file.delete_permanently': '彻底删除',
  'file.empty_trash': '清空回收站',
  'file.attributes': '修改属性',
  'file.save': '保存文件',
  'file.remote_download': 'URL 下载'
}

const state = reactive({
  loading: false,
  items: [] as any[],
  total: 0,
  page: 1,
  pageSize: 20,
  filters: {
    q: '',
    action: '',
    outcome: '' as '' | 'success' | 'failure'
  }
})

const load = async () => {
  state.loading = true
  try {
    const { data } = await Api.getFileOperations({
      page: state.page,
      pageSize: state.pageSize,
      q: state.filters.q || undefined,
      action: state.filters.action || undefined,
      outcome: state.filters.outcome
    })
    state.items = data?.items ?? []
    state.total = data?.total ?? 0
  } finally {
    state.loading = false
  }
}

watch(
  () => props.modelValue,
  (opened) => {
    if (opened) load()
  }
)

const applyFilters = () => {
  state.page = 1
  load()
}

const displayTime = (value: string) =>
  value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-'
</script>

<template>
  <el-drawer v-model="visible" size="980px" class="file-operation-drawer" destroy-on-close>
    <template #header>
      <div class="drawer-heading">
        <div class="heading-icon"><el-icon><DocumentChecked /></el-icon></div>
        <div>
          <h3>文件操作记录</h3>
          <p>记录具体路径、操作账号、来源 IP 和执行结果，并纳入防篡改审计链。</p>
        </div>
      </div>
    </template>

    <div class="drawer-content">
      <div class="filter-bar">
        <el-input
          v-model="state.filters.q"
          clearable
          placeholder="搜索路径、账号或来源 IP"
          @keyup.enter="applyFilters"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="state.filters.action" clearable placeholder="全部操作">
          <el-option v-for="(label, value) in actionLabels" :key="value" :label="label" :value="value" />
        </el-select>
        <el-select v-model="state.filters.outcome" clearable placeholder="全部结果">
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failure" />
        </el-select>
        <el-button type="primary" @click="applyFilters">查询</el-button>
        <el-button :icon="Refresh" @click="load">刷新</el-button>
      </div>

      <el-table v-loading="state.loading" :data="state.items" height="calc(100vh - 260px)">
        <el-table-column label="时间" width="178">
          <template #default="{ row }">{{ displayTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130">
          <template #default="{ row }">
            <el-tag effect="plain">{{ actionLabels[row.action] || row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="文件路径" min-width="280" show-overflow-tooltip prop="path" />
        <el-table-column label="操作人" width="128">
          <template #default="{ row }">{{ row.username || '系统' }}</template>
        </el-table-column>
        <el-table-column label="来源 IP" width="140" prop="remoteIp" />
        <el-table-column label="结果" width="88">
          <template #default="{ row }">
            <el-tag :type="row.outcome === 'success' ? 'success' : 'danger'" effect="light">
              {{ row.outcome === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="170" show-overflow-tooltip prop="message" />
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="state.page"
          v-model:page-size="state.pageSize"
          :total="state.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @current-change="load"
          @size-change="applyFilters"
        />
      </div>
    </div>
  </el-drawer>
</template>

<style scoped lang="less">
.drawer-heading {
  display: flex;
  align-items: center;
  gap: 14px;

  h3 {
    margin: 0 0 4px;
    color: var(--text-primary);
    font-size: 20px;
  }

  p {
    margin: 0;
    color: var(--text-tertiary);
    font-size: 13px;
  }
}

.heading-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 12px;
  color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.1);
  font-size: 21px;
}

.drawer-content {
  display: flex;
  height: 100%;
  flex-direction: column;
  gap: 16px;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 150px 130px auto auto;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--bg-card);
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 2px;
}

@media (max-width: 900px) {
  .filter-bar {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
