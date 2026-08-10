<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Clock, Lock, RefreshLeft, RefreshRight, View } from '@element-plus/icons-vue'
import { Api } from '@/api/Api'
import { isOperationCancelled, submitOperation } from '@/utils/operationPreview'
import i18n from '@/lang'
import type { ColumnItem } from '@/components/custom-table.vue'

interface ConfigurationField {
  key: string
  label: string
  type: 'integer' | 'boolean' | 'select' | 'worker_processes'
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
  values: Record<string, string>
  packageSource: string
}

interface ConfigurationChange {
  key: string
  label: string
  before: string
  after: string
  unit?: string
}

interface ConfigurationPreview {
  component: string
  revision: string
  applyMode: 'reload' | 'restart'
  values: Record<string, string>
  changes: ConfigurationChange[]
  hasChanges: boolean
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
const preview = ref<ConfigurationPreview>()
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

const changeCount = computed(() => preview.value?.changes.length || 0)
const previewColumns = computed<ColumnItem[]>(() => [
  { prop: 'label', label: t('software.config.configItem', 'Configuration item'), minWidth: 145 },
  { prop: 'before', label: t('software.config.currentValue', 'Current value'), minWidth: 130, slot: 'before' },
  { prop: 'after', label: t('software.config.newValue', 'New value'), minWidth: 130, slot: 'after' }
])

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
    const value = current.values[field.key]
    if (field.type === 'integer') {
      values[field.key] = Number(value)
    } else if (field.type === 'boolean') {
      values[field.key] = value === 'true'
    } else {
      values[field.key] = value
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
    const { data } = await Api.previewComponentServiceConfiguration(props.component, {
      revision: configuration.value.revision,
      values: toPayload()
    })
    preview.value = data as ConfigurationPreview
    if (!preview.value.hasChanges) {
      ElMessage.info(t('software.config.noChanges', 'Configuration has no changes'))
    }
  } finally {
    previewing.value = false
  }
}

const apply = async () => {
  if (!configuration.value || !preview.value?.hasChanges || applying.value) return
  applying.value = true
  try {
    const { data } = await submitOperation('software.configure', {
      component: props.component,
      revision: configuration.value.revision,
      values: preview.value.values
    })
    emit('task-created', data)
    visible.value = false
    ElMessage.success(t('software.config.publishTaskCreated', 'Configuration publish task created and can continue in the background'))
  } catch (error) {
    if (!isOperationCancelled(error)) throw error
  } finally {
    applying.value = false
  }
}

const restoreHistory = async (entry: ConfigurationHistoryEntry) => {
  if (entry.status !== 'succeeded' || restoringId.value) return
  restoringId.value = entry.id
  try {
    const { data } = await Api.previewComponentServiceConfigurationRestore(
      props.component,
      entry.id
    )
    const restorePreview = data?.preview as ConfigurationPreview
    if (!restorePreview?.hasChanges) {
      ElMessage.info(t('software.config.sameAsHistory', 'Current configuration already matches this history version'))
      return
    }
    const { data: result } = await submitOperation('software.configure', {
      component: props.component,
      restoreFromHistoryId: entry.id,
      changes: restorePreview.changes
    })
    emit('task-created', result)
    visible.value = false
    ElMessage.success(t('software.config.restoreTaskCreated', 'Configuration restore task created. Check progress in the background.'))
  } catch (error: any) {
    if (!isOperationCancelled(error)) throw error
  } finally {
    restoringId.value = ''
  }
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
  <el-drawer
    v-model="visible"
    class="service-config-drawer"
    size="760px"
    destroy-on-close
    :show-close="false"
    :close-on-click-modal="!applying"
    :close-on-press-escape="!applying"
  >
    <template #header>
      <div class="drawer-navigation">
        <button type="button" class="back-button" :disabled="applying" @click="visible = false">
          <el-icon><ArrowLeft /></el-icon>
          <span>{{ $t('common.back') }}</span>
        </button>
        <div class="drawer-heading">
          <h2>{{ title }}</h2>
        </div>
      </div>
    </template>

    <div v-if="loading" class="drawer-loading">
      <el-skeleton :rows="6" animated />
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
                :placeholder="$t('software.config.inputConfigValue')"
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
            <p>{{ $t('software.config.changePreviewDescription') }}</p>
          </div>
          <span v-if="preview.hasChanges">{{ $t('software.config.pendingPublishCount', { count: changeCount }) }}</span>
        </div>
        <custom-table v-if="preview.hasChanges" :data="preview.changes" :columns="previewColumns" :pagination="false" size="small">
          <template #before="{ row }">
              <span class="value-before">{{ row.before }}{{ row.unit ? ` ${row.unit}` : '' }}</span>
          </template>
          <template #after="{ row }">
              <span class="value-after">{{ row.after }}{{ row.unit ? ` ${row.unit}` : '' }}</span>
          </template>
        </custom-table>
        <el-empty v-else :description="$t('software.config.noChanges')" :image-size="64" />
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
        <span v-if="preview?.hasChanges">{{ $t('software.config.previewedChangeCount', { count: changeCount }) }}</span>
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
            :disabled="!preview?.hasChanges || previewing"
            @click="apply"
          >
            {{ $t('software.config.publishConfig') }}
          </el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped lang="less">
.drawer-navigation,
.configuration-meta,
.preview-title,
.drawer-footer,
.drawer-actions {
  display: flex;
  align-items: center;
}

.drawer-navigation {
  width: 100%;
  max-width: 680px;
  min-width: 0;
  margin: 0 auto;
  gap: 24px;
}

.drawer-heading {
  min-width: 0;
  flex: 1;

  h2 {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    color: var(--text-primary);
    font-size: 20px;
    font-weight: 760;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 20px 0 0;
  border: 0;
  border-right: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  background: transparent;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    color 0.18s ease;

  &:hover:not(:disabled) {
    color: rgb(var(--primary-color));
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  :deep(.el-icon) {
    font-size: 18px;
  }

  span {
    font-size: 15px;
  }
}

.drawer-loading {
  padding: 8px 0;
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
    font-size: 12px;
    font-weight: 650;
  }

  p {
    margin-top: 4px;
    color: var(--text-tertiary);
    font-size: 10px;
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
  font-size: 9px;
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
    font-size: 11px;
  }

  strong {
    overflow: hidden;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.reload-button {
  flex: 0 0 auto;
  align-self: center;
  margin: 0 14px;
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
    font-size: 14px;
    font-weight: 650;
  }

  p {
    margin-top: 4px;
    color: var(--text-tertiary);
    font-size: 11px;
  }

  > span {
    flex: 0 0 auto;
    padding: 5px 9px;
    border: 1px solid var(--border-subtle);
    border-radius: 999px;
    color: var(--text-tertiary);
    background: var(--surface-card);
    font-size: 10px;
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
    font-size: 13px;
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
  font-size: 11px;
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
    font-size: 13px;
    font-weight: 600;
  }
}

.preview-section {
  overflow: hidden;
  margin-top: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--surface-card);
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
    font-size: 13px;
    font-weight: 650;
  }

  h3 .el-icon {
    color: rgb(var(--primary-color));
  }

  p {
    margin-top: 4px;
    color: var(--text-tertiary);
    font-size: 10px;
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
    font-size: 11px;
    font-weight: 650;
  }

  p {
    overflow: hidden;
    margin: 5px 0 0;
    color: var(--text-placeholder);
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.preview-title {
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-subtle);

  h3,
  p {
    margin: 0;
  }

  h3 {
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 620;
  }

  p,
  > span {
    color: var(--text-tertiary);
    font-size: 10px;
  }

  p {
    margin-top: 3px;
  }
}

.value-before {
  color: var(--text-tertiary);
}

.value-after {
  color: rgb(var(--primary-color));
  font-weight: 620;
}

.drawer-footer {
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  max-width: 680px;
  margin: 0 auto;

  > span {
    overflow: hidden;
    color: var(--text-placeholder);
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.drawer-actions {
  flex: 0 0 auto;
  gap: 8px;
}

:deep(.service-config-drawer) {
  border-left: 1px solid var(--border-subtle);
  background: var(--surface-card);
  box-shadow: -18px 0 50px rgba(16, 24, 40, 0.13);
}

:deep(.service-config-drawer .el-drawer__header) {
  min-height: 88px;
  padding: 0 36px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-card);
}

:deep(.service-config-drawer .el-drawer__body) {
  padding: 22px 28px 34px;
  background: var(--surface-subtle);
}

:deep(.service-config-drawer .el-drawer__footer) {
  padding: 12px 28px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-card);
  box-shadow: 0 -8px 24px rgba(16, 24, 40, 0.04);
}

@media (max-width: 760px) {
  :deep(.service-config-drawer .el-drawer__body) {
    padding: 18px 22px 28px;
  }

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
