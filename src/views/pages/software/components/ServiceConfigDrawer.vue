<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Clock, Lock, RefreshLeft, RefreshRight, View } from '@element-plus/icons-vue'
import { Api } from '@/api/modules'
import CustomDrawer from '@/components/custom-drawer.vue'
import OperationPreviewContent from '@/components/operation-preview-content.vue'
import {
  createOperationPreview,
  executeOperationPreview,
  isOperationCancelled,
  type OperationPreview
} from '@/utils/operationPreview'
import i18n from '@/lang'

interface ConfigurationField {
  key: string
  label: string
  type: string
  default?: unknown
  sensitive?: boolean
  unit?: string
  description?: string
  min?: number
  max?: number
  options?: string[]
}

interface ComponentConfiguration {
  component: string
  softwareKey: string
  displayName: string
  revision: string
  applyMode: 'reload' | 'restart'
  fields: ConfigurationField[]
  values: Record<string, unknown>
  packageSource: string
}

interface ConfigurationHistoryEntry {
  id: string
  taskId: string
  component: string
  softwareKey: string
  softwareVersion: string
  baseRevision: string
  before: Record<string, string>
  after: Record<string, string>
  status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'interrupted'
  restoreFromId?: string
  requestedBy: number
  finishedAt?: string
  createdAt: string
}

const props = defineProps<{
  modelValue: boolean
  component: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'task-created', result: any): void
}>()

const loading = ref(false)
const previewing = ref(false)
const applying = ref(false)
const historyLoading = ref(false)
const restoringId = ref('')
const configuration = ref<ComponentConfiguration>()
const preview = ref<OperationPreview>()
const previewOrigin = ref<'update' | 'restore'>('update')
const history = ref<ConfigurationHistoryEntry[]>([])
const values = reactive<Record<string, any>>({})
let hydrating = false
const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const title = computed(() =>
  configuration.value ? t('software.config.componentConfigTitle', '{name} configuration', { name: configuration.value.displayName }) : t('software.config.componentConfig', 'Component configuration')
)

const revisionLabel = computed(() => {
  const revision = configuration.value?.revision || ''
  return revision ? `${revision.slice(0, 12)}…` : '-'
})

const applyModeLabel = computed(() =>
  configuration.value?.applyMode === 'reload' ? t('layout.operation.reload', 'Reload') : t('layout.operation.restart', 'Restart')
)

const changeCount = computed(() =>
  (preview.value?.files?.length || 0) + (preview.value?.actions?.length || 0)
)

const historyStatus = (status: ConfigurationHistoryEntry['status']) => {
  const labels = {
    pending: t('software.config.historyStatus.pending', 'Publishing'),
    succeeded: t('software.config.historyStatus.succeeded', 'Published'),
    failed: t('common.failed', 'Failed'),
    canceled: t('software.task.status.canceled', 'Canceled'),
    interrupted: t('software.task.status.interrupted', 'Interrupted')
  }
  return labels[status]
}

const historyTagType = (status: ConfigurationHistoryEntry['status']) => {
  if (status === 'succeeded') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'failed') return 'danger'
  return 'info'
}

const formatDate = (value: string) => new Intl.DateTimeFormat(i18n.locale || 'zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value))

const historyChangeCount = (entry: ConfigurationHistoryEntry) => Object.keys(entry.after)
  .filter((key) => entry.before[key] !== entry.after[key])
  .length

const hasFieldValue = (value: unknown) => {
  if (value === undefined || value === null) return false
  return typeof value === 'string' ? value.trim() !== '' : true
}

const fieldDefaultValue = (field: ConfigurationField) =>
  field.sensitive ? undefined : field.default

const fieldPlaceholder = (field: ConfigurationField) => {
  const defaultValue = fieldDefaultValue(field)
  if (hasFieldValue(defaultValue)) {
    return t('software.recommendedValue', 'Recommended: {value}', {
      value: String(defaultValue)
    })
  }
  return t('software.config.inputConfigValue', 'Enter configuration value')
}

const toPayload = () => Object.fromEntries(
  (configuration.value?.fields || []).map((field) => [
    field.key,
    field.type === 'boolean'
      ? (values[field.key] ? 'true' : 'false')
      : String(values[field.key] ?? '').trim()
  ])
)

const hydrateValues = (current: ComponentConfiguration) => {
  hydrating = true
  Object.keys(values).forEach((key) => delete values[key])
  current.fields.forEach((field) => {
    const currentValue = current.values?.[field.key]
    const value = hasFieldValue(currentValue)
      ? currentValue
      : fieldDefaultValue(field)
    if (field.type === 'integer') {
      values[field.key] = hasFieldValue(value) ? Number(value) : undefined
    } else if (field.type === 'boolean') {
      values[field.key] = value === true || String(value).toLowerCase() === 'true'
    } else {
      values[field.key] = value ?? ''
    }
  })
  preview.value = undefined
  hydrating = false
}

const load = async () => {
  if (!props.component) return
  loading.value = true
  try {
    const { data } = await Api.getComponentServiceConfiguration(props.component)
    configuration.value = data as ComponentConfiguration
    hydrateValues(configuration.value)
    void loadHistory().catch(() => undefined)
  } finally {
    loading.value = false
  }
}

const loadHistory = async () => {
  if (!props.component || historyLoading.value) return
  historyLoading.value = true
  try {
    const { data } = await Api.getComponentServiceConfigurationHistory(props.component, {
      page: 1,
      pageSize: 10
    })
    history.value = (data?.items || []) as ConfigurationHistoryEntry[]
  } finally {
    historyLoading.value = false
  }
}

const buildPreview = async () => {
  if (!configuration.value || previewing.value) return
  previewing.value = true
  try {
    preview.value = await createOperationPreview('software.configure', {
      component: props.component,
      revision: configuration.value.revision,
      values: toPayload()
    })
    previewOrigin.value = 'update'
    if (!changeCount.value) {
      ElMessage.info(t('software.config.noChanges', 'Configuration has no changes'))
    }
  } catch (error: any) {
    handleOperationError(error)
  } finally {
    previewing.value = false
  }
}

const apply = async () => {
  if (!preview.value?.previewId || applying.value) return
  applying.value = true
  const currentPreview = preview.value
  // A preview can be consumed even when execution fails, so never offer it again.
  preview.value = undefined
  try {
    const { data } = await executeOperationPreview(currentPreview, { forceConfirm: true })
    const task = data?.task || data
    if (!task?.taskId) throw new Error(t('software.config.taskCreateFailed', 'Configuration task was not created'))
    emit('task-created', task)
    visible.value = false
  } catch (error: any) {
    if (!isOperationCancelled(error)) handleOperationError(error)
  } finally {
    applying.value = false
  }
}

const restoreHistory = async (entry: ConfigurationHistoryEntry) => {
  if (entry.status !== 'succeeded' || restoringId.value) return
  restoringId.value = entry.id
  try {
    preview.value = await createOperationPreview('software.configure', {
      component: props.component,
      restoreFromHistoryId: entry.id
    })
    previewOrigin.value = 'restore'
    if (!changeCount.value) {
      ElMessage.info(t('software.config.sameAsHistory', 'Current configuration already matches this history version'))
    }
  } catch (error: any) {
    if (!isOperationCancelled(error)) handleOperationError(error)
  } finally {
    restoringId.value = ''
  }
}

const errorMessage = (error: any) => {
  const data = error?.response?.data || error?.data || {}
  const detail = data?.error && typeof data.error === 'object' ? data.error : {}
  return detail.message || detail.detail || data.message || error?.message || t('common.operationFailed', 'Operation failed')
}

const handleOperationError = async (error: any) => {
  const status = Number(error?.response?.status || error?.status || error?.data?.status)
  if (status === 409) {
    preview.value = undefined
    await Promise.all([load(), loadHistory()])
    ElMessage.warning(t('software.config.previewExpired', 'Configuration changed or the preview expired. The latest configuration has been loaded; please preview again.'))
    return
  }
  ElMessage.error(errorMessage(error))
}

watch(
  () => [props.modelValue, props.component],
  ([isVisible]) => {
    if (isVisible && props.component) {
      void load().catch(() => undefined)
    }
  },
  { immediate: true }
)

watch(values, () => {
  if (!hydrating) preview.value = undefined
}, { deep: true })
</script>

<template>
  <custom-drawer
    v-model:visible="visible"
    :title="title"
    class="service-config-drawer"
    size="760px"
    :destroy-on-close="true"
    :close-on-click-modal="!applying"
    :close-on-press-escape="!applying"
    :close-disabled="applying"
    body-mode="compact"
  >
    <div v-if="loading" class="drawer-loading">
      <div class="drawer-loading__shell">
        <el-skeleton :rows="6" animated />
      </div>
    </div>
    <div v-else-if="configuration" class="configuration-content">
      <div class="configuration-notice">
        <span class="notice-icon"><el-icon><Lock /></el-icon></span>
        <div class="notice-copy">
          <strong>{{ $t('software.config.safeMode') }}</strong>
          <p>{{ $t('software.config.safeModeDescription') }}</p>
        </div>
        <span class="notice-check">{{ $t('software.config.syntaxCheckBeforePublish') }}</span>
      </div>

      <div class="configuration-meta">
        <div class="meta-item">
          <span>{{ $t('software.config.configRevision') }}</span>
          <strong>{{ revisionLabel }}</strong>
        </div>
        <div class="meta-item">
          <span>{{ $t('software.config.scriptSource') }}</span>
          <strong>{{ configuration.packageSource || '-' }}</strong>
        </div>
        <div class="meta-item">
          <span>{{ $t('software.config.applyMode') }}</span>
          <strong>{{ applyModeLabel }}</strong>
        </div>
        <el-button
          class="reload-button"
          link
          :icon="RefreshRight"
          :loading="loading"
          :disabled="applying"
          @click="load"
        >
          {{ $t('software.config.reloadConfig') }}
        </el-button>
      </div>

      <section class="settings-panel">
        <div class="settings-panel__header">
          <div>
            <h3>{{ $t('software.config.runtimeParameters') }}</h3>
            <p>{{ $t('software.config.runtimeParametersDescription') }}</p>
          </div>
          <span>{{ $t('software.config.fieldCount', { count: configuration.fields.length }) }}</span>
        </div>

        <el-form label-position="top" class="configuration-form">
          <template v-for="field in configuration.fields" :key="field.key">
            <div v-if="field.type === 'boolean'" class="boolean-field">
              <el-checkbox :id="`config-${field.key}`" v-model="values[field.key]">
                {{ field.label }}
              </el-checkbox>
              <p v-if="field.description">{{ field.description }}</p>
            </div>
            <el-form-item
              v-else
              class="configuration-field"
              :label="`${field.label}${field.unit ? `（${field.unit}）` : ''}`"
            >
              <el-input-number
                v-if="field.type === 'integer'"
                :id="`config-${field.key}`"
                v-model="values[field.key]"
                :min="field.min"
                :max="field.max"
                :step="1"
                :placeholder="fieldPlaceholder(field)"
                controls-position="right"
              />
              <el-select
                v-else-if="field.type === 'select'"
                :id="`config-${field.key}`"
                v-model="values[field.key]"
                style="width: 100%"
              >
                <el-option
                  v-for="option in field.options"
                  :key="option"
                  :label="option"
                  :value="option"
                />
              </el-select>
              <el-input
                v-else
                :id="`config-${field.key}`"
                v-model="values[field.key]"
                :placeholder="fieldPlaceholder(field)"
              />
              <p v-if="field.description" class="field-description">
                {{ field.description }}
              </p>
            </el-form-item>
          </template>
        </el-form>
      </section>

      <section class="history-panel">
        <div class="history-panel__header">
          <div>
            <h3><el-icon><Clock /></el-icon> {{ $t('software.config.configHistory') }}</h3>
            <p>{{ $t('software.config.configHistoryDescription') }}</p>
          </div>
          <el-button
            link
            :icon="RefreshRight"
            :loading="historyLoading"
            :disabled="applying || !!restoringId"
            @click="loadHistory"
          >
            {{ $t('common.refresh') }}
          </el-button>
        </div>
        <div v-loading="historyLoading" class="history-list">
          <div v-for="entry in history" :key="entry.id" class="history-item">
            <span class="history-marker" :class="`is-${entry.status}`" />
            <div class="history-copy">
              <div>
                <strong>{{ formatDate(entry.createdAt) }}</strong>
                <el-tag size="small" effect="plain" :type="historyTagType(entry.status)">
                  {{ historyStatus(entry.status) }}
                </el-tag>
                <el-tag v-if="entry.restoreFromId" size="small" effect="plain">
                  {{ $t('software.config.restoreTask') }}
                </el-tag>
              </div>
              <p>
                {{ entry.softwareVersion }} · {{ $t('software.config.changeCount', { count: historyChangeCount(entry) }) }} ·
                {{ entry.baseRevision.slice(0, 10) }}…
              </p>
            </div>
            <el-button
              link
              type="primary"
              :icon="RefreshLeft"
              :loading="restoringId === entry.id"
              :disabled="entry.status !== 'succeeded' || applying || (!!restoringId && restoringId !== entry.id)"
              @click="restoreHistory(entry)"
            >
              {{ $t('software.config.restoreBeforePublish') }}
            </el-button>
          </div>
          <el-empty
            v-if="!historyLoading && !history.length"
            :description="$t('software.config.noHistory')"
            :image-size="56"
          />
        </div>
      </section>

      <section v-if="preview" class="preview-section">
        <div class="preview-title">
          <div>
            <h3>{{ $t('software.config.changePreview') }}</h3>
            <p>
              {{ previewOrigin === 'restore'
                ? $t('software.config.restorePreviewDescription', 'Review the restore plan before execution.')
                : $t('software.config.changePreviewDescription') }}
            </p>
          </div>
          <span>{{ $t('software.config.pendingPublishCount', { count: changeCount }) }}</span>
        </div>
        <operation-preview-content :preview="preview" />
      </section>
    </div>
    <el-result
      v-else
      icon="error"
      :title="$t('software.config.readFailedTitle')"
      :sub-title="$t('software.config.readFailedSubtitle')"
    >
      <template #extra>
        <el-button type="primary" :icon="RefreshRight" @click="load">{{ $t('software.config.reloadConfig') }}</el-button>
      </template>
    </el-result>

    <template #footer>
      <div class="drawer-footer">
        <span v-if="preview">{{ $t('software.config.previewedChangeCount', { count: changeCount }) }}</span>
        <span v-else>{{ $t('software.config.previewFirstHint') }}</span>
        <div class="drawer-actions">
          <el-button :disabled="applying" @click="visible = false">{{ $t('common.cancel') }}</el-button>
          <el-button
            :icon="View"
            :loading="previewing"
            :disabled="loading || applying"
            @click="buildPreview"
          >
            {{ $t('software.config.previewChanges') }}
          </el-button>
          <el-button
            type="primary"
            :loading="applying"
            :disabled="!preview?.previewId || previewing"
            @click="apply"
          >
            {{ previewOrigin === 'restore'
              ? $t('software.config.confirmRestore', 'Confirm restore')
              : $t('software.config.publishConfig') }}
          </el-button>
        </div>
      </div>
    </template>
  </custom-drawer>
</template>

<style scoped lang="less">
.configuration-meta,
.preview-title,
.drawer-footer,
.drawer-actions {
  display: flex;
  align-items: center;
}

.drawer-loading {
  min-height: 240px;
  padding: 18px 20px 20px;
}

.drawer-loading__shell {
  overflow: hidden;
  padding: 22px 20px 18px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background:
    linear-gradient(180deg, rgba(16, 24, 40, 0.94), rgba(15, 23, 42, 0.9)),
    var(--surface-card);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);

  :deep(.el-skeleton) {
    --el-skeleton-color: rgba(148, 163, 184, 0.14);
    --el-skeleton-to-color: rgba(148, 163, 184, 0.22);
  }

  :deep(.el-skeleton__item),
  :deep(.el-skeleton__text),
  :deep(.el-skeleton__circle),
  :deep(.el-skeleton__image) {
    height: 14px;
    border-radius: 8px;
    background-color: rgba(148, 163, 184, 0.14);
  }
}

.configuration-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
}

.configuration-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 68px;
  padding: 12px 14px;
  border: 1px solid rgba(var(--primary-color), 0.18);
  border-radius: 10px;
  background: rgba(var(--primary-color), 0.06);
}

.notice-icon {
  display: inline-flex;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.11);
  font-size: 16px;
}

.notice-copy {
  min-width: 0;
  flex: 1;

  strong,
  p {
    margin: 0;
  }

  strong {
    display: block;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 650;
  }

  p {
    margin-top: 4px;
    color: var(--text-tertiary);
    font-size: 12px;
    line-height: 1.5;
  }
}

.notice-check {
  flex: 0 0 auto;
  padding: 5px 8px;
  border: 1px solid rgba(var(--primary-color), 0.16);
  border-radius: 999px;
  color: rgb(var(--primary-color));
  background: var(--surface-card);
  font-size: 14px;
}

.configuration-meta {
  overflow: hidden;
  align-items: stretch;
  min-height: 66px;
  margin-top: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--surface-card);
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03);
}

.meta-item {
  display: flex;
  min-width: 0;
  flex: 1 1 0;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: 12px 16px;
  border-right: 1px solid var(--border-subtle);

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    overflow: hidden;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.reload-button {
  flex: 0 0 auto;
  align-self: center;
  margin: 0 14px;
  color: rgb(var(--primary-color)) !important;

  :deep(.el-button) {
    color: var(--text-secondary);
    font-weight: 600;
  }

  :deep(.el-button .el-icon) {
    color: inherit;
  }

  :deep(.el-button:hover),
  :deep(.el-button:focus-visible) {
    color: var(--text-primary);
  }
}

.settings-panel {
  overflow: hidden;
  margin-top: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-card);
  box-shadow: 0 4px 14px rgba(16, 24, 40, 0.035);
}

.settings-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 17px 20px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-subtle);

  h3,
  p {
    margin: 0;
  }

  h3 {
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 650;
  }

  p {
    margin-top: 4px;
    color: var(--text-tertiary);
    font-size: 12px;
  }

  > span {
    flex: 0 0 auto;
    padding: 5px 9px;
    border: 1px solid var(--border-subtle);
    border-radius: 999px;
    color: var(--text-tertiary);
    background: var(--surface-card);
    font-size: 12px;
  }
}

.configuration-form {
  :deep(.el-form-item) {
    margin: 0;
    padding: 18px 20px 20px;
    border-bottom: 1px solid var(--border-subtle);

    &:last-child {
      border-bottom: 0;
    }
  }

  :deep(.el-form-item__label) {
    height: auto;
    margin-bottom: 9px;
    padding: 0;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
  }

  :deep(.el-form-item__content) {
    display: block;
    line-height: normal;
  }

  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-input-number .el-input__inner) {
    text-align: left;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 42px;
    border-radius: 7px;
    box-shadow: 0 0 0 1px var(--border-subtle) inset;

    &:hover {
      box-shadow: 0 0 0 1px rgba(var(--primary-color), 0.42) inset;
    }
  }
}

.configuration-field {
  position: relative;
}

.field-description,
.boolean-field p {
  margin: 8px 0 0;
  color: var(--text-placeholder);
  font-size: 12px;
  line-height: 1.55;
}

.boolean-field {
  padding: 18px 20px 20px;
  border-bottom: 1px solid var(--border-subtle);

  &:last-child {
    border-bottom: 0;
  }

  :deep(.el-checkbox__label) {
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
  }
}

.preview-section {
  overflow: hidden;
  margin-top: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-card);
  box-shadow: 0 4px 14px rgba(16, 24, 40, 0.035);
}

.history-panel {
  overflow: hidden;
  margin-top: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-card);
  box-shadow: 0 4px 14px rgba(16, 24, 40, 0.035);
}

.history-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 15px 18px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-subtle);

  h3,
  p {
    margin: 0;
  }

  h3 {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 650;
  }

  h3 .el-icon {
    color: rgb(var(--primary-color));
  }

  p {
    margin-top: 4px;
    color: var(--text-tertiary);
    font-size: 12px;
  }

  :deep(.el-button) {
    color: var(--text-secondary);
    font-weight: 600;
  }

  :deep(.el-button .el-icon) {
    color: inherit;
  }

  :deep(.el-button:hover),
  :deep(.el-button:focus-visible) {
    color: var(--text-primary);
  }
}

.history-list {
  min-height: 86px;
}

.history-item {
  display: flex;
  min-height: 68px;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-subtle);

  &:last-child {
    border-bottom: 0;
  }
}

.history-marker {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border: 2px solid var(--surface-card);
  border-radius: 50%;
  background: var(--text-placeholder);
  box-shadow: 0 0 0 3px var(--surface-subtle);

  &.is-succeeded {
    background: var(--el-color-success);
  }

  &.is-pending {
    background: var(--el-color-warning);
  }

  &.is-failed {
    background: var(--el-color-danger);
  }
}

.history-copy {
  min-width: 0;
  flex: 1;

  > div {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  strong {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 650;
  }

  p {
    overflow: hidden;
    margin: 5px 0 0;
    color: var(--text-placeholder);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.preview-title {
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-subtle);

  h3,
  p {
    margin: 0;
  }

  h3 {
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 650;
  }

  p,
  > span {
    font-size: 12px;
  }

  p {
    margin-top: 4px;
    color: var(--text-tertiary);
    line-height: 1.55;
  }

  > span {
    flex: 0 0 auto;
    padding: 6px 10px;
    border: 1px solid rgba(var(--primary-color), 0.2);
    border-radius: 999px;
    color: rgb(var(--primary-color));
    background: rgba(var(--primary-color), 0.08);
    font-weight: 600;
  }
}

.preview-table-wrap {
  padding: 0;

  :deep(.table) {
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  :deep(.el-table th.el-table__cell) {
    background: var(--surface-subtle);
  }

  :deep(.el-table) {
    background: transparent;
  }

  :deep(.el-table td.el-table__cell) {
    padding-top: 14px;
    padding-bottom: 14px;
  }

  :deep(.el-table tr:last-child td.el-table__cell) {
    border-bottom: 0;
  }
}

.value-chip {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  min-height: 30px;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  word-break: break-word;
}

.value-before {
  color: var(--text-secondary);
  border-color: var(--border-subtle);
  background: var(--surface-subtle);
}

.value-after {
  color: rgb(var(--primary-color));
  border-color: rgba(var(--primary-color), 0.22);
  background: rgba(var(--primary-color), 0.08);
}

.drawer-footer {
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  max-width: 680px;
  margin: 0 auto;

  > span {
    overflow: hidden;
    color: rgb(var(--primary-color)) !important;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

:global(html.dark) {
  .drawer-loading {
    background: transparent;

    .drawer-loading__shell {
      border-color: rgba(75, 85, 99, 0.94);
      background:
        linear-gradient(180deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.92)),
        var(--surface-card);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);

      :deep(.el-skeleton__item),
      :deep(.el-skeleton__text),
      :deep(.el-skeleton__circle),
      :deep(.el-skeleton__image) {
        background-color: rgba(203, 213, 225, 0.08);
      }

      :deep(.el-skeleton__item.is-animated),
      :deep(.el-skeleton__text.is-animated),
      :deep(.el-skeleton__circle.is-animated),
      :deep(.el-skeleton__image.is-animated) {
        background-image: linear-gradient(
          90deg,
          rgba(203, 213, 225, 0.06),
          rgba(203, 213, 225, 0.14),
          rgba(203, 213, 225, 0.06)
        );
        background-size: 200% 100%;
      }
    }
  }

  .configuration-notice {
    border-color: rgba(var(--primary-color), 0.22);
    background: rgba(var(--primary-color), 0.08);
  }

  .notice-check {
    background: rgba(255, 255, 255, 0.04);
  }

  .configuration-meta,
  .settings-panel,
  .history-panel,
  .preview-section {
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
  }
}

.drawer-actions {
  flex: 0 0 auto;
  gap: 8px;
}

@media (max-width: 760px) {
  .notice-check {
    display: none;
  }

  .configuration-notice {
    align-items: flex-start;
  }

  .configuration-meta {
    flex-wrap: wrap;
  }

  .meta-item {
    min-width: 50%;

    &:nth-child(2) {
      border-right: 0;
    }
  }

  .reload-button {
    width: 100%;
    min-height: 38px;
    margin: 0;
    border-top: 1px solid var(--border-subtle);
    border-radius: 0;
  }

  .settings-panel__header {
    align-items: flex-start;
  }

  .drawer-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .drawer-footer > span {
    display: none;
  }

  .drawer-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));

    :deep(.el-button) {
      width: 100%;
      margin: 0;
    }
  }
}
</style>
