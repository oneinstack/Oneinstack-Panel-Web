<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { Refresh, VideoPlay, VideoPause, Warning } from '@element-plus/icons-vue'
import { Api } from '@/api/Api'
import AddTask from './add-task.vue'
import formatCron from '@/utils/cronutils'
import System from '@/utils/System'
import i18n from '@/lang'

const tableRef = ref<InstanceType<typeof import('element-plus')['ElTable']>>()
const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

interface RuleForm {
  name: string
  region: string
  count: string
  desc: string
}

interface Task {
  id: number
  enabled: boolean
  task_type: 'shell' | 'template'
}

const multipleSelection = ref<Task[]>([])
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 清空表格选中状态的方法
const clearTableSelection = () => {
  if (tableRef.value) {
    tableRef.value.clearSelection()
  }
}

let searchValue = ref('')
const tableData = ref([])
const runningByTask = ref<Record<number, number>>({})

const getData = async () => {
  multipleSelection.value = []
  try {
    const [{ data: res }, { data: running }] = await Promise.all([
      Api.getPlanTaskList({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        name: searchValue.value
      }),
      Api.getRunningPlanTaskExecutions()
    ])
    runningByTask.value = (running || []).reduce((result: Record<number, number>, execution: any) => {
      result[execution.cron_job_id] = execution.id
      return result
    }, {})
    if (res) {
      tableData.value = res.data || []
      pagination.total = res.total || 0
    } else {
      ElMessage.error(res?.message || t('task.fetchFailed', 'Failed to load data'))
    }
  } catch (error) {
    ElMessage.error(t('task.fetchFailed', 'Failed to load data'))
    tableData.value = []
    pagination.total = 0
  }
}

const category = ref(['传统项目', 'swoole异步项目', 'thinkphp异步项目', '异步项目', '一键部署', '批量创建'])

const formInline = reactive({
  user: '',
  region: '',
  date: ''
})

const onSubmit = () => {
  console.log('submit!')
  pagination.pageSize = 10
  pagination.currentPage = 1
  searchValue.value = ''
  getData()
}

const enabledClick = () => {
  ElMessageBox.confirm('停用后将不再触发新的调度，已经开始的执行不会被中断。确定继续吗？', '设置计划任务状态', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      ElMessage({
        type: 'success',
        message: '退出成功'
      })
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消退出'
      })
    })
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive<RuleForm>({
  name: 'Hello',
  region: '',
  count: '',
  desc: ''
})
let action_type = ref(true)
let rulesForm = ref({
  name: '',
  task_type: 'template',
  template_id: 'disk-usage-report',
  template_params: {} as Record<string, string>,
  schedule: '',
  created_at: '',
  deleted_at: '',
  id: '',
  command: '',
  notify_on_failure: false,
  enabled: true,
  updated_at: ''
})

const filterDirection = ref('')
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return t('task.dateTime', `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`, {
    year,
    month,
    day,
    time: `${hours}:${minutes}:${seconds}`
  })
}

const addTaskVisible = ref(false)
const addTask = () => {
  action_type.value = true
  addTaskVisible.value = true
  rulesForm.value = {
    name: '',
    task_type: 'template',
    template_id: 'disk-usage-report',
    template_params: {},
    schedule: '',
    created_at: '',
    deleted_at: '',
    id: '',
    command: '',
    notify_on_failure: false,
    enabled: true,
    updated_at: ''
  }
}

const handleTaskAdded = (data: any) => {
  console.log('接收到子组件传递的数据:', data)
  // addTaskVisible.value = false
  getData()
}
const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  getData()
}

// 处理表格选中项变化的方法
const handleSelectionChange = (val: any[]) => {
  multipleSelection.value = val
}

// 批量删除方法
const batchDelete = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning(t('task.selectDeleteTasks', 'Select tasks to delete'))
    return
  }
  ElMessageBox.confirm(t('task.batchDeleteConfirm', 'Delete the selected tasks?'), t('task.confirmTitle', 'Prompt'), {
    confirmButtonText: t('task.confirm', 'Confirm'),
    cancelButtonText: t('task.cancel', 'Cancel'),
    type: 'warning'
  }).then(async () => {
    const ids = multipleSelection.value.map((item: Task) => item.id)
    try {
      await Api.deletePlanTask({ ids })
      ElMessage.success(t('task.deleteSuccess', 'Deleted successfully'))
      getData()
    } catch (error) {
      ElMessage.error(t('task.deleteFailed', 'Delete failed'))
    }
  }).catch(() => {
    ElMessage.info(t('task.deleteCanceled', 'Delete canceled'))
  })
}

// 批量禁止方法
const batchDisable = async () => {
  const validSelection = multipleSelection.value.filter(item => item.enabled === true)
  if (validSelection.length === 0) {
    ElMessage.warning(t('task.selectRunningTasks', 'Select enabled tasks to disable'))
    return
  }
  ElMessageBox.confirm(t('task.batchDisableConfirm', 'Disable the selected tasks?'), t('task.confirmTitle', 'Prompt'), {
    confirmButtonText: t('task.confirm', 'Confirm'),
    cancelButtonText: t('task.cancel', 'Cancel'),
    type: 'warning'
  }).then(async () => {
    const ids = validSelection.map(item => item.id)
    try {
      await Api.disablePlanTask({ ids })
      ElMessage.success(t('task.disableSuccess', 'Disabled successfully'))
      getData()
      clearTableSelection()
    } catch (error) {
      ElMessage.error(t('task.disableFailed', 'Disable failed'))
    }
  }).catch(() => {
    ElMessage.info(t('task.disableCanceled', 'Disable canceled'))
  })
}

// 批量开启方法
const batchEnable = async () => {
  const validSelection = multipleSelection.value.filter(item => item.enabled === false)
  if (validSelection.length === 0) {
    ElMessage.warning(t('task.selectStoppedTasks', 'Select stopped tasks to enable'))
    return
  }
  ElMessageBox.confirm(t('task.batchEnableConfirm', 'Enable the selected tasks?'), t('task.confirmTitle', 'Prompt'), {
    confirmButtonText: t('task.confirm', 'Confirm'),
    cancelButtonText: t('task.cancel', 'Cancel'),
    type: 'warning'
  }).then(async () => {
    const ids = validSelection.map(item => item.id)
    try {
      await Api.enablePlanTask({ ids })
      ElMessage.success(t('task.enableSuccess', 'Enabled successfully'))
      getData()
      clearTableSelection()
    } catch (error) {
      ElMessage.error(t('task.enableFailed', 'Enable failed'))
    }
  }).catch(() => {
    ElMessage.info(t('task.enableCanceled', 'Enable canceled'))
  })
}

// 单条数据删除方法
const deleteSingleTask = async (row: any) => {
  ElMessageBox.confirm(t('task.singleDeleteConfirm', 'Delete this task?'), t('task.confirmTitle', 'Prompt'), {
    confirmButtonText: t('task.confirm', 'Confirm'),
    cancelButtonText: t('task.cancel', 'Cancel'),
    type: 'warning'
  }).then(async () => {
    try {
      await Api.deletePlanTask({ ids: [row.id] })
      ElMessage.success(t('task.deleteSuccess', 'Deleted successfully'))
      getData()
      clearTableSelection()
    } catch (error) {
      ElMessage.error(t('task.deleteFailed', 'Delete failed'))
    }
  }).catch(() => {
    ElMessage.info(t('task.deleteCanceled', 'Delete canceled'))
  })
}

// 单条数据禁用方法
const disableSingleTask = async (row: any) => {
  if (row.enabled === false) {
    ElMessage.warning(t('task.alreadyDisabled', 'This task is already disabled'))
    return
  }
  ElMessageBox.confirm(t('task.singleDisableConfirm', 'Disable this task?'), t('task.confirmTitle', 'Prompt'), {
    confirmButtonText: t('task.confirm', 'Confirm'),
    cancelButtonText: t('task.cancel', 'Cancel'),
    type: 'warning'
  }).then(async () => {
    try {
      await Api.disablePlanTask({ ids: [row.id] })
      ElMessage.success(t('task.disableSuccess', 'Disabled successfully'))
      getData()
    } catch (error) {
      ElMessage.error(t('task.disableFailed', 'Disable failed'))
    }
  }).catch(() => {
    ElMessage.info(t('task.disableCanceled', 'Disable canceled'))
  })
}

// 单条数据开启方法
const enableSingleTask = async (row: any) => {
  if (row.enabled === true) {
    ElMessage.warning(t('task.alreadyEnabled', 'This task is already running'))
    return
  }
  ElMessageBox.confirm(t('task.singleEnableConfirm', 'Enable this task?'), t('task.confirmTitle', 'Prompt'), {
    confirmButtonText: t('task.confirm', 'Confirm'),
    cancelButtonText: t('task.cancel', 'Cancel'),
    type: 'warning'
  }).then(async () => {
    try {
      await Api.enablePlanTask({ ids: [row.id] })
      ElMessage.success(t('task.enableSuccess', 'Enabled successfully'))
      getData()
    } catch (error) {
      ElMessage.error(t('task.enableFailed', 'Enable failed'))
    }
  }).catch(() => {
    ElMessage.info(t('task.enableCanceled', 'Enable canceled'))
  })
}

// 更新单条数据方法
const updateSingleTask = async (row: any) => {
  action_type.value = false
  addTaskVisible.value = true
  rulesForm.value = {
    name: row.name,
    task_type: row.task_type || 'shell',
    template_id: row.template_id || '',
    template_params: row.template_params || {},
    schedule: row.schedule,
    created_at: row.created_at,
    deleted_at: row.deleted_at,
    id: row.id,
    command: row.command,
    notify_on_failure: Boolean(row.notify_on_failure),
    enabled: row.enabled,
    updated_at: row.updated_at
  }
  // 这里可以传递 row 数据到子组件进行编辑
  // 例如：addTaskVisible.value = { ...row }
}
// 查看单条数据日志方法
const updateSingleTaskLog = async (row: any) => {
  System.router.push(`/task/log?id=${row.id}`)
}

const runSingleTask = async (row: any) => {
  const { data } = await Api.runPlanTask({ id: row.id })
  if (data.status === 'skipped') {
    ElMessage.warning(t('task.skippedRunning', 'The previous execution is still running. This run was skipped.'))
    return
  }
  runningByTask.value[row.id] = data.id
  ElMessage.success(t('task.runStarted', 'Task started. View progress in logs.'))
}

const cancelRunningTask = async (row: any) => {
  const executionID = runningByTask.value[row.id]
  if (!executionID) return
  await ElMessageBox.confirm(t('task.cancelRunConfirm', 'Terminate this running task?'), t('task.cancelRunTitle', 'Cancel execution'), {
    confirmButtonText: t('task.terminate', 'Terminate'),
    cancelButtonText: t('task.back', 'Back'),
    type: 'warning'
  })
  await Api.cancelPlanTaskExecution(executionID)
  ElMessage.success(t('task.cancelSubmitted', 'Cancel request submitted'))
  await getData()
}
// 选择过滤函数，控制选择逻辑
const selectFilter = (row: any) => {
  return true
}

// 全选过滤函数，控制全选逻辑
const selectAllFilter = (rows: any[]) => {
  return rows.filter(row => selectFilter(row))
}

// 上一页
const prevPage = () => {
  if (pagination.currentPage > 1) {
    pagination.currentPage--
    getData()
  }
}

// 下一页
const nextPage = () => {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize)
  if (pagination.currentPage < totalPages) {
    pagination.currentPage++
    getData()
  }
}

// 处理每页数量变化
const handlePageSizeChange = (newSize: number) => {
  pagination.pageSize = newSize
  pagination.currentPage = 1
  getData()
}

const collectionHeaderCellClassName = (row: any) => {
  if(row.columnIndex != row.row.length -1){
    return {'border-right':'1px solid #8B8B8B30','height':'40px','text-align':'center'};
  }else{
    return {'height':'40px','text-align':'center'};
  }
}

onMounted(() => {
  getData()
})
</script>
<template>
  <div class="container">
    <div class="card-box">
      <el-card>
      <div class="task-toolbar">
        <el-space class="task-toolbar__actions">
          <el-button class="task-toolbar__button" type="primary" @click="addTask">{{ t('task.addTask', 'Add task') }}</el-button>
          <!-- <el-button type="primary">执行任务</el-button> -->
          <el-button class="task-toolbar__button" type="primary" @click="batchEnable">{{ t('task.startTask', 'Start task') }}</el-button>
          <el-button class="task-toolbar__button" type="primary" @click="batchDisable">{{ t('task.stopTask', 'Stop task') }}</el-button>
          <el-button class="task-toolbar__button" type="primary" @click="batchDelete">{{ t('task.deleteTask', 'Delete task') }}</el-button>
        </el-space>
        <div class="task-toolbar__search">
          <!-- <el-dropdown>
          <el-button type="primary" class="mr-2">
            <span class="el-dropdown-link">
              全部分类
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>分类</el-dropdown-item>
            </el-dropdown-menu>
          </template>
</el-dropdown> --> <search-input class="task-search-input" :placeholder="t('task.searchPlaceholder', 'Enter domain or remark')" v-model="searchValue"
            @search="getData()" />
          <el-button class="task-refresh-button" :icon="Refresh" type="primary" @click="onSubmit" />
          <!-- <el-button :icon="Setting" type="primary" @click="onSubmit" /> -->
        </div>
      </div>
    </el-card>
    </div>
    <div class="box2">
      <custom-table ref="tableRef" class="fileTable task-table" :data="tableData" style="width: 100%"
        @selection-change="handleSelectionChange" :select-on-indeterminate="false" :row-selectable="selectFilter"
        :row-key="(row: any) => row.id" :empty-text="t('task.noData', 'No data')">
        <el-table-column type="selection" width="48" :reserve-selection="true" :selectable="selectFilter" />
        <el-table-column prop="name" :label="t('task.taskName', 'Task name')" min-width="180" show-overflow-tooltip></el-table-column>
        <el-table-column prop="enabled" :label="t('task.status', 'Status')" min-width="130">
          <template #default="scope">
            <div class="status-cell">
              <el-tag v-if="runningByTask[scope.row.id]" class="status-tag" type="warning">{{ t('task.running', 'Running') }}</el-tag>
              <a class="status-link status-link--enabled"
                v-else-if="scope.row.enabled" @click="disableSingleTask(scope.row)"> {{ t('task.enabled', 'Enabled') }} <el-icon>
                  <VideoPlay />
                </el-icon>
              </a>
              <a class="status-link status-link--disabled" v-else-if="!scope.row.enabled"
                @click="enableSingleTask(scope.row)">
                <el-icon>
                  <VideoPause />
                </el-icon> {{ t('task.disabled', 'Disabled') }} </a>
              <!-- <a style="color: #ff8888; text-decoration: underline"  class="abox" v-else>
                <el-icon><Warning /></el-icon>
                运行异常
              </a> -->
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('task.type', 'Type')" min-width="150">
          <template #default="{ row }">
            <div class="type-tags">
            <el-tag class="type-tag" :type="(row.task_type || 'shell') === 'template' ? 'success' : 'warning'">
              {{ (row.task_type || 'shell') === 'template' ? t('task.templateType', 'Safe template') : t('task.shellType', 'Advanced Shell') }}
            </el-tag>
            <el-tag v-if="row.notify_on_failure" class="type-tag" type="info">{{ t('task.failureNotify', 'Failure notification') }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="address" :label="t('task.schedule', 'Schedule')" min-width="220">
          <template #default="scope">
            <div class="schedule-cell">
              <span v-html="formatCron(scope.row.schedule)"></span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="last_run_at" :label="t('task.lastRunAt', 'Last run time')" min-width="190">
          <template #default="scope">
            <div class="last-run-cell">
              <span>{{ scope.row.last_run_at ? formatDate(scope.row.last_run_at) : t('task.notExecuted', 'Not executed') }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="address" :label="t('task.action', 'Action')" min-width="340" class-name="task-actions-column table-action-column">
          <template #default="scope">
            <div class="row-actions table-row-actions">
            <el-button link type="primary" size="small" @click="enableSingleTask(scope.row)" v-if="!scope.row.enabled">
              {{ t('task.enable', 'Enable') }} </el-button>
            <el-button link type="primary" size="small" @click="disableSingleTask(scope.row)" v-if="scope.row.enabled">
              {{ t('task.disable', 'Disable') }} </el-button>
            <el-button link type="primary" size="small" @click="deleteSingleTask(scope.row)"> {{ t('task.delete', 'Delete') }} </el-button>
            <el-button link type="primary" size="small" @click="updateSingleTask(scope.row)"> {{ t('task.update', 'Update') }} </el-button>
            <el-button link type="primary" size="small" @click="runSingleTask(scope.row)"> {{ t('task.runNow', 'Run now') }} </el-button>
            <el-button
              v-if="runningByTask[scope.row.id]"
              link type="danger" size="small"
              @click="cancelRunningTask(scope.row)"
            >
              {{ t('task.cancelRun', 'Cancel run') }}
            </el-button>
            <el-button link type="primary" size="small" @click="updateSingleTaskLog(scope.row)">
              {{ t('task.viewLogs', 'View logs') }}
            </el-button>
            </div>
          </template>
        </el-table-column>
        <!-- 自定义表格底部栏用于分页 -->
        <template #footer>
          <tr>
            <td colspan="6">
              <div class="table-pagination">
                <el-select v-model="pagination.pageSize" @change="handlePageSizeChange">
                  <el-option label="10" value="10"></el-option>
                  <el-option label="20" value="20"></el-option>
                  <el-option label="50" value="50"></el-option>
                </el-select>
                <span>{{ t('task.perPage', '/page') }}</span>
                <el-button @click="prevPage" :disabled="pagination.currentPage === 1">{{ t('task.prevPage', 'Previous') }}</el-button>
                <span>{{ pagination.currentPage }} / {{ Math.ceil(pagination.total / pagination.pageSize) }}</span>
                <el-button @click="nextPage"
                  :disabled="pagination.currentPage === Math.ceil(pagination.total / pagination.pageSize)">{{ t('task.nextPage', 'Next') }}</el-button>
                <span>{{ t('task.totalRecords', 'Total {total} records', { total: pagination.total }) }}</span>
              </div>
            </td>
          </tr>
        </template>
      </custom-table>
    </div>
    <AddTask v-model="addTaskVisible" :type="action_type" @taskAdded="handleTaskAdded" :formData="rulesForm" />
  </div>
</template>
<style scoped lang="less">
.task-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.task-toolbar__actions {
  flex-wrap: wrap;
}

.task-toolbar__button {
  min-width: 88px;
  min-height: 40px;
  border-radius: 10px;
  font-weight: 650;
}

.task-toolbar__search {
  min-width: 280px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-left: auto;
}

.task-search-input {
  width: min(320px, 36vw);
}

.task-refresh-button {
  min-width: 44px;
  min-height: 40px;
  border-radius: 10px;
}

:deep(.task-table) {
  --el-table-border-color: rgba(226, 232, 240, 0.86);
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.04);
}

:deep(.task-table th.el-table__cell) {
  height: 48px;
  color: #64748b;
  font-size: 12px;
  font-weight: 750;
  text-align: left;
  background: linear-gradient(180deg, #fbfcff, #f6f8fb);
}

:deep(.task-table td.el-table__cell) {
  padding: 10px 0;
  color: var(--text-secondary);
}

:deep(.task-table .cell) {
  line-height: 1.45;
}

:deep(.task-table .el-table__body tr:hover > td) {
  background: rgba(var(--primary-color), 0.035);
}

.status-cell,
.schedule-cell,
.last-run-cell {
  display: flex;
  align-items: center;
  min-width: 0;
}

.status-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 28px;
  padding: 3px 9px;
  border-radius: 999px;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.18s ease;
}

.status-link--enabled {
  color: #16a34a;
  background: rgba(34, 197, 94, 0.1);
}

.status-link--disabled {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.status-link:hover {
  transform: translateY(-1px);
  filter: brightness(0.96);
}

.status-tag {
  border-radius: 999px;
  font-weight: 650;
}

.type-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.type-tag {
  min-height: 26px;
  height: auto;
  padding-block: 3px;
  border-radius: 8px;
  font-weight: 650;
}

.schedule-cell,
.last-run-cell {
  color: #475569;
  overflow-wrap: anywhere;
}

:deep(.task-actions-column .cell) {
  overflow: visible;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 4px 10px;
  flex-wrap: wrap;
}

.row-actions :deep(.el-button) {
  min-height: 26px;
  margin-left: 0;
  padding: 0;
  font-weight: 650;
  white-space: nowrap;
}

.row-actions :deep(.el-button.is-link:hover) {
  color: rgb(var(--primary-color));
}

.table-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  padding: 14px 10px 4px;
  color: var(--text-secondary);
}

.table-pagination :deep(.el-select) {
  width: 92px;
}


.abox {
  display: flex;
  align-items: center;
  /* 垂直居中 */
  justify-content: center;
  /* 水平居中 */
}

@media (max-width: 1180px) {
  .task-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .task-toolbar__search {
    width: 100%;
    min-width: 0;
    margin-left: 0;
    justify-content: flex-start;
  }

  .task-search-input {
    width: min(100%, 420px);
  }
}

@media (max-width: 640px) {
  .task-toolbar__actions,
  .task-toolbar__search {
    width: 100%;
  }

  .task-toolbar__button,
  .task-refresh-button {
    flex: 1 1 calc(50% - 8px);
  }

  .task-search-input {
    flex: 1 1 100%;
    width: 100%;
  }
}
</style>
