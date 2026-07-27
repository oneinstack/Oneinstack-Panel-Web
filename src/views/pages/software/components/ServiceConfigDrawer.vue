<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
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
    :title="title"
    size="720px"
    :close-on-click-modal="!applying"
    :close-on-press-escape="!applying"
  >
    <el-skeleton v-if="loading" :rows="9" animated />
    <div v-else-if="configuration" class="configuration-content">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="这里只管理经过白名单校验的安全参数，不会覆盖网站、数据目录、监听地址、密码等配置。"
      />

      <div class="configuration-meta">
        <span>配置版本 <code>{{ revisionLabel }}</code></span>
        <span>脚本来源 {{ configuration.packageSource }}</span>
        <el-tag :type="configuration.applyMode === 'reload' ? 'success' : 'warning'">
          {{ configuration.applyMode === 'reload' ? '平滑重载生效' : '需要重启生效' }}
        </el-tag>
      </div>

      <el-form label-position="top" class="configuration-form">
        <el-form-item
          v-for="field in configuration.fields"
          :key="field.key"
          :label="`${field.label}${field.unit ? `（${field.unit}）` : ''}`"
        >
          <el-input-number
            v-if="field.type === 'integer'"
            v-model="values[field.key]"
            :min="field.min"
            :max="field.max"
            :step="1"
            controls-position="right"
          />
          <el-switch
            v-else-if="field.type === 'boolean'"
            v-model="values[field.key]"
            active-text="开启"
            inactive-text="关闭"
          />
          <el-select
            v-else-if="field.type === 'select'"
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
            v-model="values[field.key]"
            placeholder="auto 或 1–99"
          />
          <div v-if="field.description" class="field-description">{{ field.description }}</div>
        </el-form-item>
      </el-form>

      <section v-if="preview" class="preview-section">
        <div class="preview-title">
          <strong>变更预览</strong>
          <span>发布前会再次校验配置版本与组件语法</span>
        </div>
        <el-table v-if="preview.hasChanges" :data="preview.changes" size="small">
          <el-table-column prop="label" label="配置项" min-width="145" />
          <el-table-column label="当前值" min-width="130">
            <template #default="{ row }">{{ row.before }}{{ row.unit ? ` ${row.unit}` : '' }}</template>
          </el-table-column>
          <el-table-column label="新值" min-width="130">
            <template #default="{ row }">{{ row.after }}{{ row.unit ? ` ${row.unit}` : '' }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="配置没有发生变化" :image-size="64" />
      </section>
    </div>
    <el-empty v-else description="未能读取组件配置" />

    <template #footer>
      <div class="drawer-actions">
        <el-button :disabled="applying" @click="visible = false">取消</el-button>
        <el-button :loading="loading" :disabled="applying" @click="load">刷新当前值</el-button>
        <el-button type="primary" plain :loading="previewing" :disabled="loading || applying" @click="buildPreview">
          预览变更
        </el-button>
        <el-button
          type="primary"
          :loading="applying"
          :disabled="!preview?.hasChanges || previewing"
          @click="apply"
        >
          确认发布
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped lang="less">
.configuration-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.configuration-meta,
.preview-title,
.drawer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.configuration-meta {
  flex-wrap: wrap;
  color: var(--font-color-gray-light);
  font-size: 13px;

  code {
    color: var(--font-color-black);
  }
}

.configuration-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 22px;

  :deep(.el-input-number) {
    width: 100%;
  }
}

.field-description {
  margin-top: 6px;
  color: var(--font-color-gray-light);
  font-size: 12px;
  line-height: 1.5;
}

.preview-section {
  overflow: hidden;
  border: 1px solid rgba(128, 128, 128, 0.22);
  border-radius: 8px;
}

.preview-title {
  justify-content: space-between;
  padding: 12px 14px;
  background: rgba(var(--category-item-bg-color), 0.65);

  span {
    color: var(--font-color-gray-light);
    font-size: 12px;
  }
}

.drawer-actions {
  justify-content: flex-end;
}

@media (max-width: 760px) {
  .configuration-form {
    grid-template-columns: 1fr;
  }
}
</style>
