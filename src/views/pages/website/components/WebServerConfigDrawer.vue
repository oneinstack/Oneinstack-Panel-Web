<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/modules'
import { ArrowLeft, Document, Refresh } from '@element-plus/icons-vue'
import { isOperationCancelled, submitOperation } from '@/utils/operationPreview'
import i18n from '@/lang'

type WebServerInfo = {
  available: boolean
  component?: string
  name?: string
  version?: string
  running: boolean
  binaryPath?: string
  configRoot?: string
  mainConfigPath?: string
  siteConfigDir?: string
  configurationAvailable: boolean
}

type ConfigFile = {
  path: string
  name: string
  size: number
  modifiedAt: string
  revision: string
  main: boolean
  site: boolean
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'changed'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const state = reactive({
  loading: false,
  reading: false,
  saving: false,
  server: {
    available: false,
    running: false,
    configurationAvailable: false
  } as WebServerInfo,
  files: [] as ConfigFile[],
  selectedPath: '',
  content: '',
  originalContent: '',
  revision: '',
  modifiedAt: ''
})

const dirty = computed(() => state.content !== state.originalContent)
const selectedFile = computed(() =>
  state.files.find((file) => file.path === state.selectedPath)
)
const serverStateText = computed(() =>
  state.server.running ? '运行中' : '服务已停止'
)

const formatSize = (size: number) => {
  if (size < 1024) return `${size} B`
  return `${(size / 1024).toFixed(1)} KB`
}

const formatTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat(i18n.locale, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date)
}

const readFile = async (path: string, confirmDiscard = true) => {
  if (!path || state.reading) return
  if (confirmDiscard && dirty.value) {
    try {
      await ElMessageBox.confirm(
        '当前配置还有未保存的修改，切换文件会丢失这些内容。',
        '放弃未保存修改？',
        {
          type: 'warning',
          confirmButtonText: '放弃并切换',
          cancelButtonText: '继续编辑'
        }
      )
    } catch {
      return
    }
  }
  state.reading = true
  try {
    const { data } = await Api.getWebsiteWebServerConfig(path)
    state.selectedPath = data.path
    state.content = data.content
    state.originalContent = data.content
    state.revision = data.revision
    state.modifiedAt = data.modifiedAt
  } finally {
    state.reading = false
  }
}

const load = async (preserveSelection = false) => {
  state.loading = true
  try {
    const { data } = await Api.getWebsiteWebServerConfigs()
    state.server = data.server
    state.files = data.files || []
    const selected = preserveSelection &&
      state.files.some((file) => file.path === state.selectedPath)
      ? state.selectedPath
      : state.files.find((file) => file.main)?.path || state.files[0]?.path || ''
    if (selected) {
      await readFile(selected, false)
    } else {
      state.selectedPath = ''
      state.content = ''
      state.originalContent = ''
      state.revision = ''
    }
  } catch (error: any) {
    ElMessage.error(error?.message || i18n.t('website.notifications.webServerConfigLoadFailed'))
  } finally {
    state.loading = false
  }
}

const reloadCurrent = async () => {
  if (!state.selectedPath) return
  if (dirty.value) {
    try {
      await ElMessageBox.confirm(
        '重新读取会覆盖当前未保存内容。',
        '重新读取配置？',
        {
          type: 'warning',
          confirmButtonText: '重新读取',
          cancelButtonText: '取消'
        }
      )
    } catch {
      return
    }
  }
  await readFile(state.selectedPath, false)
}

const save = async () => {
  if (!state.selectedPath || !dirty.value || state.saving) return
  state.saving = true
  try {
    const { data } = await submitOperation('website.update', {
      action: 'web_server_config',
      path: state.selectedPath,
      content: state.content,
      revision: state.revision
    })
    state.content = data.content
    state.originalContent = data.content
    state.revision = data.revision
    state.modifiedAt = data.modifiedAt
    const file = state.files.find((item) => item.path === data.path)
    if (file) {
      file.revision = data.revision
      file.size = data.size
      file.modifiedAt = data.modifiedAt
    }
    ElMessage.success(i18n.t(data.reloaded ? 'website.notifications.webServerConfigSavedReloaded' : 'website.notifications.webServerConfigSavedStopped'))
    emit('changed')
  } catch (error: any) {
    if (isOperationCancelled(error)) {
      return
    } else if (error?.code === 'CONFLICT') {
      ElMessage.error(i18n.t('website.notifications.webServerConfigConflict'))
    } else {
      ElMessage.error(error?.message || i18n.t('website.notifications.webServerConfigSaveFailed'))
    }
  } finally {
    state.saving = false
  }
}

const close = async () => {
  if (dirty.value) {
    try {
      await ElMessageBox.confirm(
        '关闭后将丢失当前未保存的配置内容。',
        '关闭配置编辑器？',
        {
          type: 'warning',
          confirmButtonText: '放弃并关闭',
          cancelButtonText: '继续编辑'
        }
      )
    } catch {
      return
    }
  }
  visible.value = false
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) void load()
  }
)
</script>

<template>
  <el-drawer
    v-model="visible"
    class="web-config-drawer"
    size="980px"
    :before-close="close"
    :show-close="false"
    :close-on-click-modal="false"
    :destroy-on-close="false"
  >
    <template #header>
      <div class="web-drawer-header">
        <button type="button" class="web-drawer-back" @click="close">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </button>
        <h3>{{ state.server.name || 'Web 服务器' }} 配置管理</h3>
      </div>
    </template>

    <div v-loading="state.loading" class="web-config">
      <section class="server-summary">
        <div class="server-summary__identity">
          <div class="server-logo">{{ state.server.component === 'openresty' ? 'O' : 'N' }}</div>
          <div>
            <div class="server-summary__title">
              <strong>{{ state.server.name || '未识别' }}</strong>
              <el-tag :type="state.server.running ? 'success' : 'info'" effect="plain" round>
                {{ serverStateText }}
              </el-tag>
            </div>
            <p>{{ state.server.version || '版本未知' }} · {{ state.server.binaryPath || '-' }}</p>
          </div>
        </div>
        <el-button :icon="Refresh" @click="load(true)">刷新文件</el-button>
      </section>

      <section class="config-workspace">
        <aside class="config-sidebar">
          <div class="config-sidebar__heading">
            <div>
              <strong>配置文件</strong>
              <span>共 {{ state.files.length }} 个</span>
            </div>
          </div>
          <div class="config-files">
            <button
              v-for="file in state.files"
              :key="file.path"
              type="button"
              class="config-file"
              :class="{ active: file.path === state.selectedPath }"
              @click="readFile(file.path)"
            >
              <el-icon><Document /></el-icon>
              <span>
                <strong>{{ file.name }}</strong>
                <small>{{ file.path }}</small>
                <em>{{ formatSize(file.size) }} · {{ file.main ? '主配置' : file.site ? '站点配置' : '扩展配置' }}</em>
              </span>
            </button>
            <el-empty v-if="!state.files.length && !state.loading" description="没有可管理的 .conf 文件" />
          </div>
        </aside>

        <main class="config-editor">
          <div class="config-editor__toolbar">
            <div>
              <strong>{{ state.selectedPath || '请选择配置文件' }}</strong>
              <span v-if="state.selectedPath">
                最近修改 {{ formatTime(state.modifiedAt) }}
                <i v-if="dirty">未保存</i>
              </span>
            </div>
            <el-button :icon="Refresh" :disabled="!state.selectedPath" @click="reloadCurrent">
              重新读取
            </el-button>
          </div>
          <el-input
            v-model="state.content"
            v-loading="state.reading"
            class="config-code"
            type="textarea"
            resize="none"
            spellcheck="false"
            :disabled="!state.selectedPath"
            placeholder="请选择左侧配置文件"
          />
          <div class="config-editor__footer">
            <div class="safe-note">
              <span></span>
              修改不会直接生效：后端会先备份并执行全量语法检查，失败时自动恢复。
            </div>
            <div class="config-editor__actions">
              <el-button @click="close">关闭</el-button>
              <el-button
                type="primary"
                :loading="state.saving"
                :disabled="!state.selectedPath || !dirty"
                @click="save"
              >
                保存并应用
              </el-button>
            </div>
          </div>
        </main>
      </section>
    </div>
  </el-drawer>
</template>

<style scoped lang="less">
.web-drawer-header {
  display: flex;
  align-items: center;
  gap: 24px;

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 20px;
    font-weight: 760;
    line-height: 1.2;
  }
}

.web-drawer-back {
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

.web-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.server-summary {
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: var(--surface-card);
}

.server-summary__identity {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 13px;

  p {
    max-width: 620px;
    margin: 5px 0 0;
    overflow: hidden;
    color: var(--text-tertiary);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.server-logo {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(var(--primary-color), 0.16);
  border-radius: 14px;
  color: var(--el-color-primary);
  background: rgba(var(--primary-color), 0.08);
  font-size: 20px;
  font-weight: 800;
}

.server-summary__title {
  display: flex;
  align-items: center;
  gap: 10px;

  strong {
    color: var(--text-primary);
    font-size: 16px;
  }
}

.config-workspace {
  height: 650px;
  min-height: 650px;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  background: var(--surface-card);
}

.config-sidebar {
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-subtle);
  background: var(--surface-subtle);
}

.config-sidebar__heading {
  min-height: 70px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);

  strong,
  span {
    display: block;
  }

  strong {
    color: var(--text-primary);
    font-size: 14px;
  }

  span {
    margin-top: 3px;
    color: var(--text-tertiary);
    font-size: 11px;
  }
}

.config-files {
  min-height: 0;
  padding: 10px;
  overflow-y: auto;
}

.config-file {
  width: 100%;
  margin: 0 0 6px;
  padding: 11px 12px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid transparent;
  border-radius: 13px;
  color: var(--text-tertiary);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;

  > span {
    min-width: 0;
  }

  strong,
  small,
  em {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--text-primary);
    font-size: 13px;
  }

  small {
    margin-top: 4px;
    color: var(--text-tertiary);
    font-size: 10px;
  }

  em {
    margin-top: 5px;
    color: var(--text-placeholder);
    font-size: 10px;
    font-style: normal;
  }

  &:hover {
    border-color: rgba(var(--primary-color), 0.14);
    background: rgba(var(--primary-color), 0.05);
  }

  &.active {
    border-color: rgba(var(--primary-color), 0.22);
    color: var(--el-color-primary);
    background: rgba(var(--primary-color), 0.09);
  }
}

.config-editor {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.config-editor__toolbar {
  min-height: 70px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--border-subtle);

  strong,
  span {
    display: block;
  }

  strong {
    color: var(--text-primary);
    font: 600 13px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  span {
    margin-top: 4px;
    color: var(--text-tertiary);
    font-size: 10px;
  }

  i {
    margin-left: 8px;
    color: var(--el-color-warning);
    font-style: normal;
    font-weight: 700;
  }
}

.config-code {
  flex: 1 1 0;
  min-height: 0;

  :deep(.el-textarea__inner) {
    height: 100% !important;
    min-height: 100% !important;
    padding: 18px;
    border: 0;
    border-radius: 0;
    color: #d7e0ee;
    background: #101827;
    box-shadow: none;
    font: 12px/1.72 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    tab-size: 4;
  }
}

.config-editor__footer {
  min-height: 72px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid var(--border-subtle);
}

.safe-note {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-tertiary);
  font-size: 11px;

  span {
    width: 8px;
    height: 8px;
    flex: 0 0 8px;
    border-radius: 50%;
    background: var(--el-color-success);
    box-shadow: 0 0 0 4px rgba(var(--success-color), 0.1);
  }
}

.config-editor__actions {
  display: flex;
  gap: 10px;
}

:global(.web-config-drawer) {
  top: 14px;
  right: 14px;
  height: calc(100% - 28px);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  background: var(--surface-page);
}

:global(.web-config-drawer .el-drawer__header) {
  margin: 0;
  min-height: 88px;
  padding: 0 36px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-card);
}

:global(.web-config-drawer .el-drawer__body) {
  padding: 18px 22px 22px;
  overflow: auto;
}

@media (max-width: 760px) {
  .config-workspace {
    height: auto;
    min-height: 0;
    grid-template-columns: 1fr;
  }

  .config-sidebar {
    max-height: 230px;
    border-right: 0;
    border-bottom: 1px solid var(--border-subtle);
  }

  .config-editor {
    height: 560px;
  }

  .server-summary,
  .config-editor__footer {
    align-items: stretch;
    flex-direction: column;
  }

  .config-editor__actions {
    justify-content: flex-end;
  }
}
</style>
