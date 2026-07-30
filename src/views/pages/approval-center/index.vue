<script setup lang="ts">
import CustomTable, { type ColumnItem } from '@/components/custom-table.vue'
import SearchInput from '@/components/search-input.vue'
import { Api } from '@/api/Api'
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

interface ApprovalRequest {
  id: string
  module: string
  action: string
  resourceId?: string
  resourceName?: string
  riskLevel?: string
  status: string
  reason?: string
  requestedByName?: string
  approvedByName?: string
  reviewComment?: string
  boundTaskType?: string
  boundTaskId?: string
  createdAt?: string
  expiresAt?: string
  payloadSnapshot?: Record<string, any>
  result?: Record<string, any>
}

type TagType = 'success' | 'warning' | 'info' | 'primary' | 'danger'

const loading = reactive({
  bootstrap: false,
  approvals: false,
  approvalAction: false,
  approvalDetail: false
})

const currentUser = ref<any>(null)
const approvalState = reactive({
  keyword: '',
  mineTabs: {
    activeIndex: 0,
    list: [
      { name: '全部', index: 0, value: false },
      { name: '我的', index: 1, value: true }
    ],
    clickActive: (item: { index: number; value: boolean }) => {
      approvalState.mineTabs.activeIndex = item.index
      approvalState.filters.mine = item.value
      approvalState.filters.page = 1
      void loadApprovals()
    }
  },
  filters: {
    page: 1,
    pageSize: 10,
    keyword: '',
    status: '',
    module: '',
    mine: false
  },
  total: 0,
  list: [] as ApprovalRequest[],
  columns: [
    { prop: 'resourceName', label: '资源', minWidth: 260 },
    { prop: 'action', label: '动作', minWidth: 180 },
    { prop: 'module', label: '模块', minWidth: 120 },
    { prop: 'riskLevel', label: '风险', minWidth: 110 },
    { prop: 'status', label: '状态', minWidth: 120 },
    { prop: 'requestedByName', label: '申请人', minWidth: 140 },
    { prop: 'createdAt', label: '申请时间', minWidth: 180 },
    { prop: 'actionColumn', label: '操作', width: 220 }
  ] as ColumnItem[]
})

const approvalDialog = reactive({
  show: false,
  data: null as ApprovalRequest | null,
  comment: '',
  mode: 'detail' as 'detail' | 'approve' | 'reject',
  open: async (row: ApprovalRequest, mode: 'detail' | 'approve' | 'reject') => {
    approvalDialog.mode = mode
    approvalDialog.comment = mode === 'detail' ? '' : row.reviewComment || ''
    approvalDialog.show = true
    loading.approvalDetail = true
    try {
      const response = await Api.getApprovalDetail(row.id)
      approvalDialog.data = response.data
    } catch (error: any) {
      ElMessage.error(error?.message || '获取审批详情失败')
      approvalDialog.show = false
    } finally {
      loading.approvalDetail = false
    }
  }
})

const canReviewApproval = computed(
  () =>
    Boolean(
      currentUser.value?.isSuperAdmin ||
      currentUser.value?.isAdmin ||
      currentUser.value?.canApprove ||
      currentUser.value?.scopes?.approval?.review ||
      currentUser.value?.scopes?.approval?.execute
    )
)

const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : '—'
const statusLabelMap: Record<string, string> = {
  pending: '待审批',
  completed: '已通过',
  rejected: '已拒绝',
  executing: '执行中',
  executed: '已执行',
  expired: '已过期',
  canceled: '已取消'
}
const statusTypeMap: Record<string, TagType> = {
  pending: 'warning',
  completed: 'success',
  rejected: 'danger',
  executing: 'primary',
  executed: 'success',
  expired: 'info',
  canceled: 'info',
}
const riskTypeMap: Record<string, TagType> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  critical: 'danger'
}
const approvalStatusLabel = (status: string) => statusLabelMap[status] || status || '—'
const approvalStatusType = (status: string): TagType => statusTypeMap[status] || 'info'
const approvalRiskType = (risk?: string): TagType => riskTypeMap[(risk || '').toLowerCase()] || 'info'
const isPendingApproval = (row: ApprovalRequest) => row.status === 'pending'

const loadBootstrap = async () => {
  loading.bootstrap = true
  try {
    const response = await Api.getCurrentUserAccess()
    currentUser.value = response.data
  } finally {
    loading.bootstrap = false
  }
}

const loadApprovals = async () => {
  loading.approvals = true
  try {
    const response = await Api.getApprovals(approvalState.filters)
    approvalState.list = response.data?.items || []
    approvalState.total = response.data?.total || 0
  } finally {
    loading.approvals = false
  }
}

const searchApprovals = () => {
  approvalState.filters.page = 1
  approvalState.filters.keyword = approvalState.keyword.trim()
  void loadApprovals()
}

const resetApprovals = () => {
  approvalState.keyword = ''
  approvalState.mineTabs.activeIndex = 0
  approvalState.filters.page = 1
  approvalState.filters.keyword = ''
  approvalState.filters.status = ''
  approvalState.filters.module = ''
  approvalState.filters.mine = false
  void loadApprovals()
}

const submitApprovalAction = async () => {
  if (!approvalDialog.data) return
  loading.approvalAction = true
  try {
    if (approvalDialog.mode === 'approve') {
      await Api.approveApproval(approvalDialog.data.id, { comment: approvalDialog.comment.trim() })
      ElMessage.success('审批已通过')
    } else if (approvalDialog.mode === 'reject') {
      await Api.rejectApproval(approvalDialog.data.id, { comment: approvalDialog.comment.trim() })
      ElMessage.success('审批已拒绝')
    }
    approvalDialog.show = false
    await loadApprovals()
  } catch (error: any) {
    ElMessage.error(error?.message || '审批操作失败')
  } finally {
    loading.approvalAction = false
  }
}

onMounted(async () => {
  try {
    await loadBootstrap()
    await loadApprovals()
  } catch (error: any) {
    ElMessage.error(error?.message || '页面初始化失败')
  }
})
</script>

<template>
  <div v-loading="loading.bootstrap" class="approval-page">
    <section class="panel-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <search-input v-model:model-value="approvalState.keyword" placeholder="搜索资源、动作或申请人" @search="searchApprovals" />
          <el-select v-model="approvalState.filters.status" placeholder="审批状态" clearable class="toolbar-select">
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="completed" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已执行" value="executed" />
            <el-option label="已过期" value="expired" />
          </el-select>
          <el-select v-model="approvalState.filters.module" placeholder="所属模块" clearable class="toolbar-select">
            <el-option label="website" value="website" />
            <el-option label="database" value="database" />
          </el-select>
          <div class="mini-tabs">
            <button
              v-for="item in approvalState.mineTabs.list"
              :key="item.index"
              type="button"
              class="mini-tabs__item"
              :class="{ 'is-active': approvalState.mineTabs.activeIndex === item.index }"
              @click="approvalState.mineTabs.clickActive(item)"
            >
              {{ item.name }}
            </button>
          </div>
        </div>
        <div class="toolbar-right">
          <el-button @click="resetApprovals">重置</el-button>
          <el-button type="primary" @click="searchApprovals">查询</el-button>
        </div>
      </div>

      <custom-table
        :loading="loading.approvals"
        :columns="approvalState.columns"
        :data="approvalState.list"
        :total="approvalState.total"
        :auto-pagination="false"
        @update:page="(page) => { approvalState.filters.page = page; loadApprovals() }"
      >
        <template #resourceName="{ row }">
          <div class="resource-cell">
            <strong>{{ row.resourceName || row.resourceId || '未命名资源' }}</strong>
            <small>{{ row.id }}</small>
          </div>
        </template>
        <template #riskLevel="{ row }">
          <el-tag :type="approvalRiskType(row.riskLevel)" effect="light" round>
            {{ row.riskLevel || 'unknown' }}
          </el-tag>
        </template>
        <template #status="{ row }">
          <el-tag :type="approvalStatusType(row.status)" effect="light" round>
            {{ approvalStatusLabel(row.status) }}
          </el-tag>
        </template>
        <template #createdAt="{ row }">
          <span>{{ formatTime(row.createdAt) }}</span>
        </template>
        <template #actionColumn="{ row }">
          <div class="action-wrap">
            <el-button
              v-if="isPendingApproval(row)"
              link
              type="success"
              :disabled="!canReviewApproval"
              @click="approvalDialog.open(row, 'approve')"
            >
              通过
            </el-button>
            <el-button
              v-if="isPendingApproval(row)"
              link
              type="danger"
              :disabled="!canReviewApproval"
              @click="approvalDialog.open(row, 'reject')"
            >
              拒绝
            </el-button>
            <el-button link type="primary" @click="approvalDialog.open(row, 'detail')">详情</el-button>

          </div>
        </template>
      </custom-table>
    </section>

    <custom-dialog
      v-model:show="approvalDialog.show"
      :title="approvalDialog.mode === 'detail' ? '审批详情' : approvalDialog.mode === 'approve' ? '审批通过' : '审批拒绝'"
      width="720px"
    >
      <div v-loading="loading.approvalDetail" class="dialog-form dialog-form--scrollable">
        <template v-if="approvalDialog.data">
          <div class="approval-detail-head">
            <div class="approval-detail-title">
              <span class="approval-detail-label">审批资源</span>
              <h4>{{ approvalDialog.data.resourceName || approvalDialog.data.resourceId || '未命名资源' }}</h4>
              <p>{{ approvalDialog.data.action }} · {{ approvalDialog.data.module }}</p>
            </div>
            <el-tag :type="approvalStatusType(approvalDialog.data.status)" effect="light" round>
              {{ approvalStatusLabel(approvalDialog.data.status) }}
            </el-tag>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span>申请人</span>
              <strong class="detail-value">{{ approvalDialog.data.requestedByName || '—' }}</strong>
            </div>
            <div class="detail-item">
              <span>审批人</span>
              <strong class="detail-value">{{ approvalDialog.data.approvedByName || '—' }}</strong>
            </div>
            <div class="detail-item">
              <span>风险等级</span>
              <strong class="detail-value detail-value--compact">{{ approvalDialog.data.riskLevel || '—' }}</strong>
            </div>
            <div class="detail-item">
              <span>绑定任务</span>
              <strong class="detail-value detail-value--compact">{{ approvalDialog.data.boundTaskType || '—' }} {{ approvalDialog.data.boundTaskId || '' }}</strong>
            </div>
            <div class="detail-item">
              <span>申请时间</span>
              <strong class="detail-value detail-value--compact">{{ formatTime(approvalDialog.data.createdAt) }}</strong>
            </div>
            <div class="detail-item">
              <span>过期时间</span>
              <strong class="detail-value detail-value--compact">{{ formatTime(approvalDialog.data.expiresAt) }}</strong>
            </div>
          </div>

          <div class="detail-block">
            <span>申请原因</span>
            <p>{{ approvalDialog.data.reason || '—' }}</p>
          </div>
          <div class="detail-block">
            <span>审批意见</span>
            <p>{{ approvalDialog.data.reviewComment || '—' }}</p>
          </div>
          <div class="detail-block" v-if="approvalDialog.data.payloadSnapshot">
            <span>请求快照</span>
            <pre>{{ JSON.stringify(approvalDialog.data.payloadSnapshot, null, 2) }}</pre>
          </div>
          <div class="detail-block" v-if="approvalDialog.data.result">
            <span>执行结果</span>
            <pre>{{ JSON.stringify(approvalDialog.data.result, null, 2) }}</pre>
          </div>
          <el-form v-if="approvalDialog.mode !== 'detail'" label-position="top">
            <el-form-item :label="approvalDialog.mode === 'approve' ? '通过意见' : '拒绝原因'">
              <el-input
                v-model="approvalDialog.comment"
                type="textarea"
                :rows="4"
                :placeholder="approvalDialog.mode === 'approve' ? '可填写执行说明' : '请填写拒绝原因'"
              />
            </el-form-item>
          </el-form>
        </template>
      </div>
      <template #footer>
        <el-button @click="approvalDialog.show = false">关闭</el-button>
        <el-button
          v-if="approvalDialog.mode !== 'detail'"
          :type="approvalDialog.mode === 'approve' ? 'primary' : 'danger'"
          :loading="loading.approvalAction"
          @click="submitApprovalAction"
        >
          {{ approvalDialog.mode === 'approve' ? '确认通过' : '确认拒绝' }}
        </el-button>
      </template>
    </custom-dialog>
  </div>
</template>

<style scoped lang="less">
.approval-page {
  padding-bottom: 28px;
}

.panel-card {
  padding: 22px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.toolbar,
.toolbar-left,
.toolbar-right,
.action-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar {
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.toolbar-left,
.toolbar-right {
  flex-wrap: wrap;
}

.toolbar-select {
  width: 172px;
}

.mini-tabs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(var(--primary-color), 0.05);
}

.mini-tabs__item {
  min-width: 64px;
  height: 34px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.mini-tabs__item.is-active {
  color: rgb(var(--primary-color));
  background: var(--surface-card);
  box-shadow: 0 8px 20px rgba(var(--primary-color), 0.14);
}

.resource-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.resource-cell strong,
.detail-item strong,
.approval-detail-head h4 {
  color: var(--text-primary);
}

.resource-cell small,
.approval-detail-label,
.approval-detail-head p,
.detail-block p,
.detail-item span,
.detail-block span {
  color: var(--text-secondary);
}

.approval-detail-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  padding: 0 2px;
}

.approval-detail-title {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.approval-detail-label,
.detail-item span,
.detail-block span {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.approval-detail-head h4 {
  margin: 0;
  font-size: 22px;
  line-height: 1.18;
  font-weight: 720;
}

.approval-detail-head p {
  margin: 0;
  font-size: 14px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.detail-item,
.detail-block {
  padding: 16px 18px;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(var(--primary-color), 0.028), rgba(var(--primary-color), 0.012)),
    var(--surface-subtle);
  box-shadow: inset 0 0 0 1px rgba(var(--primary-color), 0.04);
}

.detail-item {
  min-height: 84px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.detail-value {
  display: block;
  font-size: 18px;
  line-height: 1.35;
  font-weight: 680;
  word-break: break-word;
}

.detail-value--compact {
  font-size: 16px;
  line-height: 1.45;
  font-weight: 620;
}

.detail-block {
  margin-bottom: 14px;
}

.detail-block p {
  margin: 10px 0 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
}

.detail-block pre {
  margin: 10px 0 0;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(17, 24, 39, 0.04);
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
}

.dialog-form {
  padding-top: 8px;
}

.dialog-form--scrollable {
  max-height: min(70vh, 820px);
  padding-right: 6px;
  overflow-y: auto;
}

.dialog-form--scrollable::-webkit-scrollbar {
  width: 8px;
}

.dialog-form--scrollable::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.45);
}

@media (max-width: 960px) {
  .panel-card {
    padding: 18px;
  }

  .toolbar-select {
    width: 100%;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .approval-detail-head h4,
  .detail-value {
    font-size: 18px;
  }

  .detail-value--compact {
    font-size: 15px;
  }
}
</style>
