<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Api } from '@/api/modules'
import type { ArtifactCleanupTask, ArtifactInventory } from '@/api/modules/system'
import { formatBytes } from '@/utils/fileSize'
import { hasOperationAccess } from '@/utils/access'
import { isOperationCancelled, submitOperation } from '@/utils/operationPreview'
import i18n from '@/lang'

const t = (key: string, fallback: string, params?: Record<string, unknown>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}

const canClean = computed(() => hasOperationAccess('systemManagement', 'write', {
  scopes: ['system.settings'], actions: ['artifact.cleanup']
}))
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const inventory = ref<ArtifactInventory['inventory'] | null>(null)
const taskBusy = ref(false)
const tasks = ref<ArtifactCleanupTask[]>([])

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [inventoryResponse, taskResponse] = await Promise.all([
      Api.getArtifactInventory(), Api.getArtifactCleanupTasks()
    ])
    inventory.value = inventoryResponse.data?.inventory || null
    taskBusy.value = Boolean(inventoryResponse.data?.taskBusy)
    tasks.value = Array.isArray(taskResponse.data) ? taskResponse.data : []
  } catch (reason: any) {
    error.value = reason?.response?.data?.message || reason?.message || t('systemManagement.cleanup.loadFailed', '读取存储清单失败')
  } finally {
    loading.value = false
  }
}

const label = (candidate: any) => {
  if (candidate.kind === 'uninstall_archive') return t('systemManagement.cleanup.archive', '卸载归档')
  if (candidate.kind === 'download_partial') return t('systemManagement.cleanup.partial', '未完成下载')
  return t('systemManagement.cleanup.cache', '在线下载缓存')
}

const taskStatus = (status: string) => {
  const labels: Record<string, string> = {
    queued: t('systemManagement.cleanup.queued', '待执行'),
    running: t('systemManagement.cleanup.executing', '执行中'),
    succeeded: t('systemManagement.cleanup.succeeded', '已完成'),
    failed: t('systemManagement.cleanup.failed', '失败'),
    interrupted: t('systemManagement.cleanup.interrupted', '已中断')
  }
  return labels[status] || status
}

const reason = (candidate: any) => {
  const labels: Record<string, string> = {
    MANUAL_CONFIRMATION_REQUIRED: t('systemManagement.cleanup.manualArchive', '历史归档仅支持人工预览确认'),
    UNSAFE_ARCHIVE_CONTENT: t('systemManagement.cleanup.unsafe', '含符号链接、挂载点或不支持的文件，禁止清理'),
    UNSAFE_ARTIFACT_PATH: t('systemManagement.cleanup.unsafe', '路径含符号链接或挂载文件，禁止清理'),
    LATEST_RECOVERY_SNAPSHOT: t('systemManagement.cleanup.latestRecovery', '最近一份归档可能仍用于恢复配置，禁止清理'),
    ACTIVE_RECOVERY_REFERENCE: t('systemManagement.cleanup.activeRecovery', 'MongoDB 保留数据标记仍引用该归档，禁止清理'),
    CONFIRMED_RETENTION_EXPIRED: t('systemManagement.cleanup.expiredArchive', '已确认的 30 天保留期到期'),
    RETENTION_EXPIRED: t('systemManagement.cleanup.expiredCache', '缓存保留期到期'),
    CACHE_CAPACITY: t('systemManagement.cleanup.capacity', '缓存超过 2 GiB 上限'),
    MANUAL_CLEANUP: t('systemManagement.cleanup.manualCache', '可人工清理，后续在线安装需要重新下载'),
    UNVERIFIED_CACHE: t('systemManagement.cleanup.unverifiedCache', '旧缓存缺少校验标记，仅支持人工预览确认')
  }
  return labels[candidate.reasonCode] || candidate.reason
}

const clean = async (candidate: any) => {
  if (!canClean.value || submitting.value || !candidate.eligible || taskBusy.value) return
  submitting.value = true
  try {
    await submitOperation('artifact.cleanup', { candidateId: candidate.id })
    ElMessage.success(t('systemManagement.cleanup.submitted', '清理任务已创建，请查看任务结果'))
    await load()
    window.setTimeout(() => { void load() }, 1500)
  } catch (reason: any) {
    if (!isOperationCancelled(reason)) {
      ElMessage.error(reason?.response?.data?.message || reason?.message || t('systemManagement.cleanup.submitFailed', '清理任务创建失败'))
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => { void load() })
</script>

<template>
  <section class="artifact-cleanup-section">
    <header class="section-header">
      <div>
        <h2>{{ t('systemManagement.cleanup.title', '存储清理') }}</h2>
        <p>{{ t('systemManagement.cleanup.description', '查看 Panel 生成的下载缓存和组件卸载归档。删除归档后只能通过外部备份或重新安装恢复旧程序与配置。') }}</p>
      </div>
      <el-button :loading="loading" @click="load">{{ t('systemManagement.cleanup.refresh', '刷新') }}</el-button>
    </header>

    <el-alert v-if="error" type="error" :title="error" show-icon :closable="false" />
    <el-alert
      v-if="inventory?.space.warning"
      type="warning"
      :title="t('systemManagement.cleanup.lowSpace', '根分区剩余空间偏低，请核对安全清理候选')"
      show-icon :closable="false"
    />
    <p v-if="inventory" class="space-summary">
      {{ t('systemManagement.cleanup.available', '根分区可用') }}：{{ formatBytes(inventory.space.availableBytes) }}
      / {{ formatBytes(inventory.space.totalBytes) }}
      <span v-if="taskBusy">{{ t('systemManagement.cleanup.busy', '组件任务正在运行，清理已暂缓') }}</span>
    </p>

    <el-table :data="inventory?.candidates || []" v-loading="loading" row-key="id" max-height="520" empty-text="—">
      <el-table-column :label="t('systemManagement.cleanup.type', '类型')" width="125">
        <template #default="{ row }">{{ label(row) }}</template>
      </el-table-column>
      <el-table-column prop="component" :label="t('systemManagement.cleanup.component', '组件')" width="105" />
      <el-table-column prop="path" :label="t('systemManagement.cleanup.path', '路径')" min-width="310" show-overflow-tooltip />
      <el-table-column :label="t('systemManagement.cleanup.size', '占用')" width="110">
        <template #default="{ row }">{{ formatBytes(row.bytes) }}</template>
      </el-table-column>
      <el-table-column :label="t('systemManagement.cleanup.reason', '清理条件')" min-width="230">
        <template #default="{ row }">{{ reason(row) }}</template>
      </el-table-column>
      <el-table-column :label="t('systemManagement.cleanup.action', '操作')" width="130" fixed="right">
        <template #default="{ row }">
          <el-button type="danger" link :disabled="!canClean || !row.eligible || taskBusy || submitting" @click="clean(row)">
            {{ t('systemManagement.cleanup.preview', '预览清理') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <h3>{{ t('systemManagement.cleanup.taskHistory', '清理记录') }}</h3>
    <el-table :data="tasks" row-key="id" max-height="250" empty-text="—">
      <el-table-column prop="createdAt" :label="t('systemManagement.cleanup.createdAt', '创建时间')" min-width="180" />
      <el-table-column :label="t('systemManagement.cleanup.type', '类型')" min-width="130">
        <template #default="{ row }">{{ label(row) }}</template>
      </el-table-column>
      <el-table-column :label="t('systemManagement.cleanup.status', '状态')" min-width="100">
        <template #default="{ row }">{{ taskStatus(row.status) }}</template>
      </el-table-column>
      <el-table-column prop="bytes" :label="t('systemManagement.cleanup.size', '占用')" min-width="100">
        <template #default="{ row }">{{ formatBytes(row.bytes) }}</template>
      </el-table-column>
      <el-table-column prop="errorMessage" :label="t('systemManagement.cleanup.error', '失败原因')" min-width="220" show-overflow-tooltip />
    </el-table>
  </section>
</template>

<style scoped>
.artifact-cleanup-section { display: grid; gap: 16px; }
.section-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.section-header h2 { margin: 0 0 8px; }
.section-header p { margin: 0; color: var(--el-text-color-secondary); }
.space-summary { margin: 0; }
.space-summary span { margin-left: 16px; color: var(--el-color-warning); }
.artifact-cleanup-section h3 { margin: 12px 0 0; }
</style>
