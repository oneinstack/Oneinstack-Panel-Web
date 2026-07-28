<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Close, Lock, RefreshRight, View } from '@element-plus/icons-vue'
import { Api } from '@/api/Api'

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
const configuration = ref<ComponentConfiguration>()
const preview = ref<ConfigurationPreview>()
const values = reactive<Record<string, any>>({})
let hydrating = false

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const title = computed(() =>
  configuration.value ? `${configuration.value.displayName} 配置` : '组件配置'
)

const revisionLabel = computed(() => {
  const revision = configuration.value?.revision || ''
  return revision ? `${revision.slice(0, 12)}…` : '-'
})

const applyModeLabel = computed(() =>
  configuration.value?.applyMode === 'reload' ? '平滑重载' : '服务重启'
)

const changeCount = computed(() => preview.value?.changes.length || 0)

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
  } finally {
    loading.value = false
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
      ElMessage.info('配置没有发生变化')
    }
  } finally {
    previewing.value = false
  }
}

const apply = async () => {
  if (!configuration.value || !preview.value?.hasChanges || applying.value) return
  applying.value = true
  try {
    const { data } = await Api.applyComponentServiceConfiguration(props.component, {
      revision: configuration.value.revision,
      values: preview.value.values
    })
    emit('task-created', data)
    visible.value = false
    ElMessage.success('配置发布任务已创建，可在后台继续运行')
  } finally {
    applying.value = false
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
          <span>返回</span>
        </button>
        <div class="drawer-heading">
          <span>服务配置</span>
          <h2>{{ title }}</h2>
        </div>
        <span v-if="configuration" class="apply-mode-badge">{{ applyModeLabel }}</span>
        <button
          type="button"
          class="close-button"
          aria-label="关闭配置抽屉"
          :disabled="applying"
          @click="visible = false"
        >
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </template>

    <div v-if="loading" class="drawer-loading">
      <el-skeleton :rows="6" animated />
    </div>
    <div v-else-if="configuration" class="configuration-content">
      <div class="configuration-notice">
        <span class="notice-icon"><el-icon><Lock /></el-icon></span>
        <div class="notice-copy">
          <strong>安全配置模式</strong>
          <p>仅调整白名单参数，不会覆盖网站、数据目录、监听地址和密码。</p>
        </div>
        <span class="notice-check">发布前语法校验</span>
      </div>

      <div class="configuration-meta">
        <div class="meta-item">
          <span>配置版本</span>
          <strong>{{ revisionLabel }}</strong>
        </div>
        <div class="meta-item">
          <span>脚本来源</span>
          <strong>{{ configuration.packageSource || '-' }}</strong>
        </div>
        <div class="meta-item">
          <span>生效方式</span>
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
          重新读取
        </el-button>
      </div>

      <section class="settings-panel">
        <div class="settings-panel__header">
          <div>
            <h3>运行参数</h3>
            <p>仅展示当前组件允许安全调整的配置</p>
          </div>
          <span>{{ configuration.fields.length }} 项配置</span>
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
                placeholder="请输入配置值"
              />
              <p v-if="field.description" class="field-description">
                {{ field.description }}
              </p>
            </el-form-item>
          </template>
        </el-form>
      </section>

      <section v-if="preview" class="preview-section">
        <div class="preview-title">
          <div>
            <h3>变更预览</h3>
            <p>发布前会再次校验配置版本与组件语法</p>
          </div>
          <span v-if="preview.hasChanges">{{ changeCount }} 项待发布</span>
        </div>
        <el-table v-if="preview.hasChanges" :data="preview.changes" size="small">
          <el-table-column prop="label" label="配置项" min-width="145" />
          <el-table-column label="当前值" min-width="130">
            <template #default="{ row }">
              <span class="value-before">{{ row.before }}{{ row.unit ? ` ${row.unit}` : '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="新值" min-width="130">
            <template #default="{ row }">
              <span class="value-after">{{ row.after }}{{ row.unit ? ` ${row.unit}` : '' }}</span>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="配置没有发生变化" :image-size="64" />
      </section>
    </div>
    <el-result
      v-else
      icon="error"
      title="未能读取组件配置"
      sub-title="请检查组件状态或重新读取"
    >
      <template #extra>
        <el-button type="primary" :icon="RefreshRight" @click="load">重新读取</el-button>
      </template>
    </el-result>

    <template #footer>
      <div class="drawer-footer">
        <span v-if="preview?.hasChanges">已预览 {{ changeCount }} 项变更</span>
        <span v-else>修改参数后，请先预览变更</span>
        <div class="drawer-actions">
          <el-button :disabled="applying" @click="visible = false">取消</el-button>
          <el-button
            :icon="View"
            :loading="previewing"
            :disabled="loading || applying"
            @click="buildPreview"
          >
            预览变更
          </el-button>
          <el-button
            type="primary"
            :loading="applying"
            :disabled="!preview?.hasChanges || previewing"
            @click="apply"
          >
            发布配置
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
  gap: 12px;
}

.drawer-heading {
  min-width: 0;
  flex: 1;

  > span {
    display: block;
    margin-bottom: 2px;
    color: var(--text-tertiary);
    font-size: 9px;
    font-weight: 650;
    letter-spacing: 0.14em;
  }

  h2 {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    color: var(--text-primary);
    font-size: 17px;
    font-weight: 650;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.back-button,
.close-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-secondary);
  background: var(--surface-card);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    color 0.18s ease,
    background 0.18s ease;

  &:hover:not(:disabled) {
    border-color: rgba(var(--primary-color), 0.28);
    color: rgb(var(--primary-color));
    background: rgba(var(--primary-color), 0.05);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.back-button {
  gap: 6px;
  min-height: 34px;
  padding: 0 10px;
  font-size: 11px;
}

.close-button {
  width: 34px;
  height: 34px;
  font-size: 14px;
}

.apply-mode-badge {
  flex: 0 0 auto;
  padding: 5px 9px;
  border: 1px solid color-mix(in srgb, var(--el-color-success) 26%, var(--border-subtle));
  border-radius: 999px;
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 7%, var(--surface-card));
  font-size: 10px;
  font-weight: 600;
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
  min-height: 58px;
  padding: 12px 22px;
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

  .apply-mode-badge,
  .notice-check {
    display: none;
  }

  .drawer-heading > span {
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
