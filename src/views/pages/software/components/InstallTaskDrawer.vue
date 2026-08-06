<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import softwareTaskStore from '@/sstore/softwareTask'

const props = defineProps<{
  modelValue: boolean
  taskId: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'retry', taskId: string): void
}>()

const logElement = ref<HTMLElement>()
const autoScroll = ref(true)
const downloading = ref(false)
const now = ref(Date.now())
const clock = window.setInterval(() => {
  now.value = Date.now()
}, 1000)

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})
const task = computed(() => softwareTaskStore.tasks[props.taskId])
const isUninstall = computed(() => task.value?.operation === 'uninstall')
const isServiceTask = computed(() =>
  ['start', 'stop', 'restart', 'reload'].includes(task.value?.operation || '')
)
const isConfigurationTask = computed(() => task.value?.operation === 'configure')
const operationLabel = computed(() => {
  const labels: Record<string, string> = {
    install: '安装',
    upgrade: '升级',
    uninstall: '卸载',
    start: '启动',
    stop: '停止',
    restart: '重启',
    reload: '平滑重载',
    configure: '配置发布'
  }
  return labels[task.value?.operation || ''] || '任务'
})
const logs = computed(() => softwareTaskStore.logs[props.taskId] || '等待脚本输出...')
const terminal = computed(() => softwareTaskStore.isTerminal(task.value?.status))
const failed = computed(() => ['failed', 'interrupted'].includes(task.value?.status))
const cancelable = computed(() => !!task.value && !terminal.value && !task.value.cancelRequested)
const progressStatus = computed(() => {
  if (task.value?.status === 'succeeded') return 'success' as const
  if (failed.value) return 'exception' as const
  return undefined
})
const statusText = computed(() => {
  const labels: Record<string, string> = {
    queued: '排队中',
    resolving: '正在获取安装包',
    prechecking: '正在检查环境',
    installing: '正在安装',
    upgrading: '正在升级',
    uninstalling: '正在卸载',
    starting: '正在启动服务',
    stopping: '正在停止服务',
    restarting: '正在重启服务',
    reloading: '正在平滑重载服务',
    configuring: '正在写入配置',
    verifying: '正在启动并验证',
    finalizing: '正在保存状态',
    canceling: '正在取消',
    rolling_back: '正在回滚',
    succeeded: `${operationLabel.value}成功`,
    failed: `${operationLabel.value}失败`,
    canceled: '已取消',
    interrupted: '任务已中断'
  }
  return labels[task.value?.status] || task.value?.status || '正在加载'
})
const elapsed = computed(() => {
  if (!task.value?.createdAt) return '0 秒'
  const end = task.value.finishedAt ? Date.parse(task.value.finishedAt) : now.value
  const seconds = Math.max(0, Math.floor((end - Date.parse(task.value.createdAt)) / 1000))
  if (seconds < 60) return `${seconds} 秒`
  const minutes = Math.floor(seconds / 60)
  return `${minutes} 分 ${seconds % 60} 秒`
})
const createdAtText = computed(() => {
  if (!task.value?.createdAt) return '时间未知'
  const value = new Date(task.value.createdAt)
  if (Number.isNaN(value.getTime())) return '时间未知'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(value)
})
const fallbackErrorCode = computed(() => {
  if (isConfigurationTask.value) return 'CONFIG_APPLY_FAILED'
  if (isServiceTask.value) return 'SERVICE_ACTION_FAILED'
  if (isUninstall.value) return 'UNINSTALL_FAILED'
  return 'INSTALL_FAILED'
})
const metaCards = computed(() => [
  {
    label: '任务 ID',
    value: task.value?.id || '-',
    className: 'task-meta-card--mono task-meta-card--wide'
  },
  {
    label: terminal.value ? '任务类型' : '创建时间',
    value: terminal.value ? '历史任务' : createdAtText.value,
    className: terminal.value ? 'task-meta-card--accent' : ''
  },
  {
    label: '当前阶段',
    value: task.value?.phase || task.value?.status || 'waiting',
    className: 'task-meta-card--mono'
  },
  {
    label: '已用时',
    value: elapsed.value,
    className: 'task-meta-card--strong'
  }
])
const summaryItems = computed(() => [
  { label: '组件', value: task.value?.component || '-' },
  { label: '版本', value: task.value?.requestedVersion || '-' },
  { label: '错误码', value: task.value?.errorCode || (failed.value ? fallbackErrorCode.value : '-') },
  { label: '回滚状态', value: task.value?.rollbackStatus || 'not_required' }
])

const stages = computed(() => {
  const currentProgress = task.value?.progress || 0
  const definitions = isServiceTask.value
    ? [
        { key: 'resolving', name: '获取控制脚本', end: 5 },
        { key: task.value?.operation || 'restart', name: `${operationLabel.value}服务`, end: 96 },
        { key: 'finalizing', name: '保存任务状态', end: 100 }
      ]
    : isConfigurationTask.value
    ? [
        { key: 'resolving', name: '获取配置脚本', end: 5 },
        { key: 'config_apply', name: '备份、校验并发布', end: 96 },
        { key: 'finalizing', name: '保存任务状态', end: 100 }
      ]
    : isUninstall.value
    ? [
        { key: 'resolving', name: '获取卸载包', end: 5 },
        { key: 'uninstall', name: '卸载组件', end: 96 },
        { key: 'finalizing', name: '保存状态', end: 100 }
      ]
    : [
        { key: 'resolving', name: '获取安装包', end: 5 },
        { key: 'precheck', name: '环境预检', end: 12 },
        {
          key: task.value?.operation === 'upgrade' ? 'upgrade' : 'install',
          name: task.value?.operation === 'upgrade' ? '升级软件' : '安装软件',
          end: 72
        },
        { key: 'configure', name: '写入配置', end: 84 },
        { key: 'verify', name: '启动并验证', end: 96 },
        { key: 'finalizing', name: '保存状态', end: 100 }
      ]
  return definitions.map((stage) => ({
    ...stage,
    active: task.value?.phase === stage.key ||
      (stage.key === 'install' && task.value?.phase === 'installing') ||
      (stage.key === 'upgrade' && task.value?.phase === 'upgrading'),
    done: currentProgress >= stage.end || task.value?.status === 'succeeded'
  }))
})

const loadTask = async () => {
  if (!props.modelValue || !props.taskId) return
  await softwareTaskStore.track(props.taskId)
  await softwareTaskStore.fetchLog(props.taskId)
}

const cancelTask = async () => {
  const uninstall = isUninstall.value
  const serviceTask = isServiceTask.value
  const configurationTask = isConfigurationTask.value
  await ElMessageBox.confirm(
    configurationTask
      ? '取消后系统会终止配置脚本；如果配置已经发布，会自动恢复发布前快照。确定继续吗？'
      : serviceTask
      ? `取消后系统会终止${operationLabel.value}脚本并重新核验服务状态，确定继续吗？`
      : uninstall
      ? '取消后系统会安全终止卸载脚本并重新核验组件状态；已经完成的组件步骤可能无法自动恢复。确定继续吗？'
      : '取消可能触发回滚，正在执行的不可中断步骤会先等待安全退出。确定继续吗？',
    configurationTask
      ? '取消配置发布任务'
      : serviceTask ? `取消${operationLabel.value}任务` : uninstall ? '取消卸载任务' : '取消安装任务',
    {
      type: 'warning',
      confirmButtonText: '确认取消',
      cancelButtonText: configurationTask
        ? '继续发布'
        : serviceTask ? `继续${operationLabel.value}` : uninstall ? '继续卸载' : '继续安装'
    }
  )
  await softwareTaskStore.cancel(props.taskId)
}

const copyDiagnostics = async () => {
  const value = [
    `Task: ${task.value?.id}`,
    `Component: ${task.value?.component}`,
    `Version: ${task.value?.requestedVersion}`,
    `Status: ${task.value?.status}`,
    `Error: ${task.value?.errorCode || '-'}`,
    '',
    logs.value
  ].join('\n')
  await navigator.clipboard.writeText(value)
  ElMessage.success('诊断信息已复制')
}

const downloadLog = async () => {
  if (!props.taskId || downloading.value) return
  downloading.value = true
  try {
    await softwareTaskStore.downloadLog(props.taskId)
    ElMessage.success('完整任务日志已开始下载')
  } catch (error: any) {
    ElMessage.error(error?.message || '下载任务日志失败')
  } finally {
    downloading.value = false
  }
}

watch(
  () => [props.modelValue, props.taskId],
  () => void loadTask().catch(() => undefined),
  { immediate: true }
)
watch(logs, async () => {
  if (!autoScroll.value) return
  await nextTick()
  if (logElement.value) {
    logElement.value.scrollTop = logElement.value.scrollHeight
  }
})

onBeforeUnmount(() => {
  window.clearInterval(clock)
})
</script>

<template>
  <el-drawer
    v-model="visible"
    class="install-task-drawer"
    size="840px"
    :show-close="false"
    :close-on-click-modal="terminal"
    :destroy-on-close="false"
  >
    <template #header>
      <div class="task-header">
        <button type="button" class="task-back" @click="visible = false">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </button>
        <div class="task-heading">
          <div class="task-title">
            <strong>{{ task?.component || '软件任务' }}</strong>
            <span class="task-operation">{{ operationLabel }}</span>
            <small v-if="task?.requestedVersion">{{ task.requestedVersion }}</small>
          </div>
        </div>
        <el-tag
          class="task-status"
          :type="task?.status === 'succeeded' ? 'success' : failed ? 'danger' : 'primary'"
          effect="plain"
          round
        >
          {{ statusText }}
        </el-tag>
      </div>
    </template>

    <div v-if="task" class="task-content">
      <section class="overview">
        <div class="overview-hero">
          <div class="overview-copy">
            <div class="overview-label">
              <span class="overview-label__title">当前进度</span>
              <span class="overview-phase">{{ task.phase || task.status }}</span>
            </div>
            <h3>{{ statusText }}</h3>
            <p>{{ task.message || '任务已创建，正在准备执行。' }}</p>
          </div>
          <div class="overview-progress-card">
            <small>完成度</small>
            <strong>{{ task.progress }}%</strong>
            <span>{{ terminal ? '任务已结束' : '实时刷新中' }}</span>
          </div>
        </div>
        <div class="overview-track">
          <el-progress
            :percentage="task.progress"
            :status="progressStatus"
            :stroke-width="10"
            :show-text="false"
            :indeterminate="task.phaseProgress === undefined && !terminal"
            :duration="3"
          />
        </div>
        <div class="overview-foot">
          <div
            v-for="item in metaCards"
            :key="item.label"
            class="overview-foot__item"
            :class="item.className"
          >
            <small>{{ item.label }}</small>
            <strong>{{ item.value }}</strong>
          </div>
          <div class="overview-foot__item">
            <small>任务状态</small>
            <strong>{{ task.status }}</strong>
          </div>
          <div class="overview-foot__item">
            <small>执行模式</small>
            <strong>{{ isConfigurationTask ? '配置发布' : isServiceTask ? '服务动作' : isUninstall ? '卸载任务' : '安装任务' }}</strong>
          </div>
          <div class="overview-foot__item">
            <small>日志状态</small>
            <strong>{{ autoScroll ? '自动滚动开启' : '手动查看' }}</strong>
          </div>
        </div>
      </section>

      <section class="stage-section">
        <div class="section-heading">
          <div>
            <span class="section-heading__eyebrow">EXECUTION FLOW</span>
            <h4>任务执行路径</h4>
          </div>
          <span class="section-heading__hint">按阶段展示当前安装流程</span>
        </div>
        <div class="stage-list">
          <div
            v-for="(stage, index) in stages"
            :key="stage.key"
            class="stage"
            :class="{ active: stage.active, done: stage.done, pending: !stage.active && !stage.done }"
          >
            <span class="stage-dot">{{ stage.done ? '✓' : index + 1 }}</span>
            <div class="stage-copy">
              <small>STEP {{ String(index + 1).padStart(2, '0') }}</small>
              <span>{{ stage.name }}</span>
            </div>
          </div>
        </div>
      </section>

      <el-alert
        v-if="failed"
        class="failure"
        type="error"
        :closable="false"
        show-icon
        :title="task.errorMessage || task.message || '任务执行失败'"
      >
        <template #default>
          <div class="failure__row">
            错误码：{{ task.errorCode || fallbackErrorCode }}
          </div>
          <div v-if="task.rollbackStatus && task.rollbackStatus !== 'not_required'" class="failure__row">
            回滚状态：{{ task.rollbackStatus }}
          </div>
          <div v-if="task.recoveryStatus" class="failure__row">
            重启核验：{{ task.recoveryStatus }} · {{ task.recoveryMessage }}
          </div>
        </template>
      </el-alert>

      <section class="diagnostic-grid">
        <section class="log-section">
          <div class="log-toolbar">
            <div class="log-toolbar__title">
              <span class="log-live-dot"></span>
              <div class="log-toolbar__copy">
                <strong>实时任务日志</strong>
                <span>安装脚本输出会持续追加到这里，便于定位当前步骤。</span>
              </div>
            </div>
            <el-checkbox v-model="autoScroll">自动滚动</el-checkbox>
          </div>
          <pre ref="logElement" class="task-log">{{ logs }}</pre>
        </section>

        <aside class="summary-panel">
          <div class="section-heading section-heading--aside">
            <div>
              <span class="section-heading__eyebrow">DIAGNOSTICS</span>
              <h4>诊断摘要</h4>
            </div>
          </div>
          <div class="summary-panel__card">
            <small>当前结果</small>
            <strong>{{ statusText }}</strong>
            <p>{{ task.errorMessage || task.message || '暂无附加说明' }}</p>
          </div>
          <div class="summary-panel__list">
            <div v-for="item in summaryItems" :key="item.label" class="summary-panel__item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </aside>
      </section>
    </div>
    <el-skeleton v-else :rows="8" animated />

    <template #footer>
      <div class="task-actions">
        <div class="task-actions__group task-actions__group--tools">
          <el-button :loading="downloading" @click="downloadLog">下载完整日志</el-button>
          <el-button v-if="failed" @click="copyDiagnostics">复制诊断信息</el-button>
        </div>
        <div class="task-actions__group task-actions__group--main">
          <el-button v-if="cancelable" type="danger" plain @click="cancelTask">取消任务</el-button>
          <el-button
            v-if="failed && !isUninstall && !isServiceTask && !isConfigurationTask"
            type="primary"
            class="task-actions__retry"
            @click="emit('retry', taskId)"
          >
            重新填写并重试
          </el-button>
          <el-button
            :type="failed && !cancelable ? 'info' : 'primary'"
            :plain="failed && !cancelable"
            @click="visible = false"
          >
            {{ terminal ? '完成' : '后台运行' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped lang="less">
.log-toolbar,
.task-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
}

.task-header {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 24px;
}

.task-back {
  flex: 0 0 auto;
  min-height: 38px;
  padding: 0 20px 0 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-right: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  background: transparent;
  cursor: pointer;
  transition: color 0.18s ease;

  &:hover {
    color: rgb(var(--primary-color));
  }

  .el-icon {
    font-size: 18px;
  }

  span {
    font-size: 15px;
  }
}

.task-heading {
  min-width: 0;
  flex: 1;
}

.task-title {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 760;
  line-height: 1.2;
  text-transform: capitalize;

  strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .task-operation {
    padding: 5px 11px;
    border-radius: 999px;
    color: var(--text-secondary);
    background: color-mix(in srgb, var(--surface-subtle) 74%, white);
    font-size: 11px;
    font-weight: 700;
  }

  small {
    color: var(--text-tertiary);
    font-size: 14px;
    font-weight: 600;
  }
}

.task-status {
  flex: 0 0 auto;
  min-height: 34px;
  padding-inline: 14px;
  border-width: 1.5px;
  font-size: 13px;
  font-weight: 720;
}

.task-meta-card--wide {
  grid-column: span 2;
}

.task-meta-card--mono strong,
.task-meta-card--wide strong {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.task-meta-card--accent strong {
  color: var(--el-color-warning);
}

.task-meta-card--strong strong {
  font-size: 18px;
}

.task-content {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;

  > * {
    opacity: 0;
    transform: translateY(10px);
    animation: taskSectionEnter 0.34s ease forwards;
  }

  > *:nth-child(1) { animation-delay: 0.04s; }
  > *:nth-child(2) { animation-delay: 0.1s; }
  > *:nth-child(3) { animation-delay: 0.16s; }
  > *:nth-child(4) { animation-delay: 0.22s; }
}

.overview,
.stage-section,
.summary-panel {
  padding: 22px;
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 253, 0.96));
  box-shadow: 0 14px 32px rgba(16, 24, 40, 0.05);
}

.overview {
  border-color: rgba(var(--primary-color), 0.12);
  background:
    radial-gradient(circle at top right, rgba(var(--primary-color), 0.1), transparent 30%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(247, 249, 253, 0.95));
  box-shadow: 0 18px 40px rgba(16, 24, 40, 0.07);
}

.overview-hero {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
}

.overview-copy {
  min-width: 0;
  flex: 1;

  h3 {
    margin: 0 0 10px;
    color: var(--text-primary);
    font-size: 34px;
    font-weight: 800;
    line-height: 1.12;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 15px;
    line-height: 1.7;
    word-break: break-word;
  }
}

.overview-label {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.overview-label__title {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.overview-phase {
  padding: 4px 10px;
  border-radius: 999px;
  color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.08);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
}

.overview-progress-card {
  flex: 0 0 auto;
  min-width: 170px;
  padding: 20px 18px 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(var(--primary-color), 0.12);
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(var(--primary-color), 0.08), rgba(var(--primary-color), 0.04));

  small {
    color: var(--text-tertiary);
    font-size: 11px;
    font-weight: 700;
  }

  strong {
    color: rgb(var(--primary-color));
    font-size: 44px;
    font-weight: 820;
    line-height: 1;
  }

  span {
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.5;
  }
}

.overview-track {
  margin-bottom: 18px;
}

.overview-foot {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.overview-foot__item {
  min-width: 0;
  padding: 13px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.64);
  display: grid;
  gap: 6px;

  small {
    color: var(--text-placeholder);
    font-size: 11px;
    font-weight: 650;
  }

  strong {
    min-width: 0;
    overflow: hidden;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.section-heading {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;

  h4 {
    margin: 4px 0 0;
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 760;
  }
}

.section-heading__eyebrow {
  color: var(--text-tertiary);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.16em;
}

.section-heading__hint {
  color: var(--text-placeholder);
  font-size: 12px;
  line-height: 1.5;
}

.section-heading--aside {
  margin-bottom: 18px;
}

.stage-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.stage {
  min-width: 0;
  min-height: 92px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  color: var(--text-tertiary);
  background: var(--surface-card);
  box-shadow: 0 8px 18px rgba(16, 24, 40, 0.04);
  transition: all 0.2s ease;
}

.stage-dot {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border-default);
  border-radius: 13px;
  color: var(--text-placeholder);
  background: var(--surface-subtle);
  font-size: 13px;
  font-weight: 780;
}

.stage-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  small {
    color: var(--text-placeholder);
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 0.14em;
  }

  span {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.35;
  }
}

.stage.pending {
  background: color-mix(in srgb, var(--surface-card) 92%, #f8fafc);
}

.stage.active {
  border-color: rgba(var(--primary-color), 0.28);
  color: var(--el-color-primary);
  background: linear-gradient(180deg, rgba(var(--primary-color), 0.08), rgba(var(--primary-color), 0.04));
  box-shadow: 0 14px 28px rgba(var(--primary-color), 0.08);

  .stage-dot {
    border-color: var(--el-color-primary);
    color: #fff;
    background: var(--el-color-primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-color), 0.1);
  }
}

.stage.done {
  border-color: rgba(var(--success-color), 0.2);
  color: var(--el-color-success);
  background: linear-gradient(180deg, rgba(var(--success-color), 0.07), rgba(var(--success-color), 0.03));

  .stage-dot {
    color: #fff;
    border-color: var(--el-color-success);
    background: var(--el-color-success);
  }

  .stage-copy small {
    color: rgb(var(--success-color));
  }
}

.failure {
  margin: 0;
  padding: 8px 6px;
  border-radius: 18px;
  border-color: color-mix(in srgb, var(--el-color-danger) 22%, var(--border-subtle));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.failure__row + .failure__row {
  margin-top: 6px;
}

.diagnostic-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.8fr);
  gap: 16px;
}

.log-section {
  height: 520px;
  min-height: 520px;
  max-height: 520px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 22px;
  background: var(--surface-card);
  box-shadow: 0 10px 28px rgba(16, 24, 40, 0.06);
}

.log-toolbar {
  min-height: 64px;
  padding: 0 18px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-card);

  strong {
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 700;
  }
}

.log-toolbar__title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-toolbar__copy {
  display: flex;
  flex-direction: column;
  gap: 3px;

  span {
    color: var(--text-tertiary);
    font-size: 11px;
    line-height: 1.5;
  }
}

.log-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--success-color));
  box-shadow: 0 0 0 4px rgba(var(--success-color), 0.1);
}

.task-log {
  box-sizing: border-box;
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  margin: 0;
  padding: 18px 18px 22px;
  overflow-x: auto;
  overflow-y: scroll;
  overscroll-behavior: contain;
  color: #d7e0ee;
  background: linear-gradient(180deg, rgba(20, 29, 46, 0.98), rgba(11, 18, 32, 1));
  font: 12px/1.75 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  scrollbar-color: #475467 #101827;
}

.summary-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-panel__card {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(var(--primary-color), 0.08), rgba(var(--primary-color), 0.03));

  small {
    display: block;
    color: var(--text-tertiary);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  strong {
    display: block;
    margin-top: 8px;
    color: var(--text-primary);
    font-size: 22px;
    font-weight: 780;
    line-height: 1.2;
  }

  p {
    margin: 10px 0 0;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.7;
    word-break: break-word;
  }
}

.summary-panel__list {
  display: grid;
  gap: 12px;
}

.summary-panel__item {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.8);

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    min-width: 0;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 700;
    text-align: right;
    word-break: break-word;
  }
}

.task-actions {
  width: 100%;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}

.task-actions__group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.task-actions__group--tools {
  margin-right: 0;
}

.task-actions__retry {
  box-shadow: 0 10px 24px rgba(var(--primary-color), 0.2);
}

@keyframes taskSectionEnter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.install-task-drawer) {
  top: 16px;
  right: 16px;
  bottom: auto;
  height: calc(100% - 32px);
  position: relative;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 28px;
  background: var(--surface-page);
  box-shadow: -24px 22px 64px rgba(16, 24, 40, 0.16);
}

:deep(.install-task-drawer .el-drawer__header) {
  flex: 0 0 auto;
  min-height: 88px;
  padding: 0 36px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-card);
}

:deep(.install-task-drawer .el-drawer__body) {
  flex: 1 1 auto;
  min-height: 0;
  padding: 20px !important;
  overflow: auto;
  background: transparent;
}

:deep(.install-task-drawer .el-drawer__footer) {
  flex: 0 0 auto;
  margin: 0;
  padding: 16px 0 2px;
  border-top: 1px solid var(--border-subtle);
  border-right: 0;
  border-bottom: 0;
  border-left: 0;
  background: transparent;
  box-shadow: none;
}

:deep(.install-task-drawer .el-drawer__footer .el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 960px) {
  .overview-foot,
  .diagnostic-grid {
    grid-template-columns: 1fr;
  }

  .task-meta-card--wide {
    grid-column: auto;
  }

  .overview-hero {
    flex-direction: column;
  }

  .overview-progress-card {
    min-width: 0;
  }
}

@media (max-width: 760px) {
  .log-section {
    height: 420px;
    min-height: 420px;
    max-height: 420px;
  }

  :deep(.install-task-drawer) {
    top: 8px;
    right: 8px;
    height: calc(100% - 16px);
    gap: 10px;
    padding: 10px;
    border-radius: 18px;
  }

  :deep(.install-task-drawer .el-drawer__header) {
    min-height: 76px;
    padding: 0 20px;
  }

  :deep(.install-task-drawer .el-drawer__body) {
    padding: 20px !important;
  }

  :deep(.install-task-drawer .el-drawer__footer) {
    padding: 12px 0 2px;
  }

  .task-header {
    gap: 16px;
  }

  .task-status {
    display: none;
  }

  .task-title {
    font-size: 18px;
  }

  .stage-list {
    grid-template-columns: 1fr;
  }

  .task-actions {
    align-items: stretch;
  }

  .task-actions__group {
    justify-content: flex-end;
  }

  .task-actions__group--tools {
    margin-right: 0;
  }
}

</style>
