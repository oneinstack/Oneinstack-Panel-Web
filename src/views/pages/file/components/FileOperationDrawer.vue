<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Refresh, Search, DocumentChecked } from '@element-plus/icons-vue'
import { Api } from '@/api/Api'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const actionLabels: Record<string, string> = {
  'file.create': '创建文件/目录',
  'file.upload': '上传文件',
  'file.download': '下载文件',
  'file.trash': '删除到回收站',
  'file.restore': '从回收站恢复',
  'file.delete_permanently': '彻底删除回收站文件',
  'file.empty_trash': '清空回收站',
  'file.attributes': '修改权限和所有者',  
  'file.read': '读取文件内容',
  'file.save': '保存文件内容',
  'file.remote_download': '远程下载到文件区',
  'file.copy': '复制文件/目录',
  'file.move': '移动文件/目录',
  'file.rename': '重命名文件/目录',
  'file.archive': '压缩文件/目录',
  'file.preview': '预览图片',
  'file.share.create': '创建文件外链分享',
  'file.share.revoke': '取消文件外链分享',
  'file.share.download': '通过外链下载文件',
  'file.favorite.create': '收藏',
  'file.favorite.cancel': '取消收藏'
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
const tableRef = ref<any>()

const resetTableScrollTop = async () => {
  await nextTick()
  tableRef.value?.setScrollTop?.(0)
  const bodyWrapper = tableRef.value?.$el?.querySelector('.el-table__body-wrapper .el-scrollbar__wrap')
  if (bodyWrapper) bodyWrapper.scrollTop = 0
}

const load = async (resetScroll = false) => {
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
    if (resetScroll) resetTableScrollTop()
  }
}

watch(
  () => props.modelValue,
  (opened) => {
    if (opened) load(true)
  }
)

const applyFilters = () => {
  state.page = 1
  load(true)
}

const handlePageChange = () => {
  load(true)
}

const displayTime = (value: string) =>
  value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-'
</script>

<template>
  <el-drawer v-model="visible" size="min(1180px, 94vw)" class="file-operation-drawer" destroy-on-close>
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
        <el-button :icon="Refresh" @click="load(true)">刷新</el-button>
      </div>

      <el-table
        ref="tableRef"
        v-loading="state.loading"
        :data="state.items"
        height="calc(100vh - 286px)"
        class="operation-table"
      >
        <el-table-column label="时间" min-width="158">
          <template #default="{ row }">{{ displayTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="170" class-name="operation-action-column">
          <template #default="{ row }">
            <el-tag class="action-tag" effect="plain">{{ actionLabels[row.action] || row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="文件路径" min-width="300" show-overflow-tooltip prop="path" />
        <el-table-column label="操作人" min-width="96">
          <template #default="{ row }">{{ row.username || '系统' }}</template>
        </el-table-column>
        <el-table-column label="来源 IP" min-width="128" prop="remoteIp" />
        <el-table-column label="结果" min-width="80">
          <template #default="{ row }">
            <el-tag class="result-tag" :type="row.outcome === 'success' ? 'success' : 'danger'" effect="light">
              {{ row.outcome === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="220" show-overflow-tooltip prop="message" />
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="state.page"
          v-model:page-size="state.pageSize"
          :total="state.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
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
  gap: 14px;
  min-width: 0;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(150px, max-content) minmax(132px, max-content) max-content max-content;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94)),
    var(--bg-card);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.75),
    0 10px 24px rgba(15, 23, 42, 0.035);

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 38px;
    border-radius: 11px;
    box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.2) inset;
  }

  :deep(.el-button) {
    width: max-content;
    min-height: 38px;
    padding-inline: 18px;
    border-radius: 11px;
    font-weight: 650;
    white-space: nowrap;
  }
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 8px 4px 0;

  :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }
}

:deep(.operation-table) {
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
}

:deep(.operation-table .el-table__header th) {
  height: 46px;
  color: #64748b;
  font-size: 12px;
  font-weight: 750;
  background: linear-gradient(180deg, #fbfcff, #f6f8fb);
}

:deep(.operation-table .el-table__row td) {
  padding: 9px 0;
  color: var(--text-secondary);
}

:deep(.operation-table .el-table__body tr:hover > td) {
  background: rgba(var(--primary-color), 0.035);
}

:deep(.operation-table .cell) {
  line-height: 1.45;
}

:deep(.operation-action-column .cell) {
  overflow: visible;
}

.action-tag {
  width: fit-content;
  max-width: 100%;
  min-height: 28px;
  height: auto;
  padding: 4px 10px;
  border-color: rgba(var(--primary-color), 0.24);
  border-radius: 9px;
  color: rgb(var(--primary-color));
  font-weight: 650;
  background: rgba(var(--primary-color), 0.045);

  :deep(.el-tag__content) {
    min-width: 0;
    overflow-wrap: anywhere;
    white-space: normal;
    line-height: 1.35;
    text-align: center;
  }
}

.result-tag {
  min-width: 44px;
  justify-content: center;
  border-radius: 8px;
  font-weight: 700;
}

@media (max-width: 1080px) {
  .filter-bar {
    grid-template-columns: minmax(220px, 1fr) minmax(150px, 1fr) minmax(132px, 1fr);
  }

  .filter-bar :deep(.el-button) {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .drawer-heading {
    align-items: flex-start;

    p {
      line-height: 1.5;
    }
  }

  .filter-bar {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .filter-bar :deep(.el-button) {
    width: 100%;
  }

  .pagination {
    justify-content: center;

    :deep(.el-pagination) {
      justify-content: center;
    }
  }
}
</style>
