<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/modules'
import { Document, Refresh } from '@element-plus/icons-vue'
import CustomDrawer from '@/components/custom-drawer.vue'
import { isOperationCancelled, submitOperation } from '@/utils/operationPreview'
import i18n from '@/lang'

type WebServerInfo = {
  available: boolean
  component?: string
  name?: string
  version?: string
  running: boolean
  binaryPath?: string
  serviceName?: string
  configRoot?: string
  mainConfigPath?: string
  siteConfigDir?: string
  configurationAvailable: boolean
}

type WebServerKind = 'nginx' | 'openresty' | 'caddy' | 'unknown'

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
const t = i18n.t as any

const dirty = computed(() => state.content !== state.originalContent)
const selectedFile = computed(() =>
  state.files.find((file) => file.path === state.selectedPath)
)
const serverKind = computed<WebServerKind>(() => {
  const identity = [state.server.component, state.server.name, state.server.binaryPath, state.server.serviceName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  if (identity.includes('openresty')) return 'openresty'
  if (identity.includes('caddy')) return 'caddy'
  if (identity.includes('nginx') || /(^|\s)ng(\s|$)/.test(identity)) return 'nginx'
  return 'unknown'
})
const serverLogoText = computed(() => ({
  nginx: 'N',
  openresty: 'O',
  caddy: 'C',
  unknown: 'W'
})[serverKind.value])
const serverStateText = computed(() =>
  t(state.server.running ? 'website.webConfigDrawer.running' : 'website.webConfigDrawer.stopped')
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
        t('website.webConfigDrawer.discardMessage'),
        t('website.webConfigDrawer.discardTitle'),
        {
          type: 'warning',
          confirmButtonText: t('website.webConfigDrawer.discardSwitch'),
          cancelButtonText: t('website.webConfigDrawer.continueEditing')
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
    // ElMessage.error(error?.message || i18n.t('website.notifications.webServerConfigLoadFailed'))
  } finally {
    state.loading = false
  }
}

const reloadCurrent = async () => {
  if (!state.selectedPath) return
  if (dirty.value) {
    try {
      await ElMessageBox.confirm(
        t('website.webConfigDrawer.rereadMessage'),
        t('website.webConfigDrawer.rereadTitle'),
        {
          type: 'warning',
          confirmButtonText: t('website.webConfigDrawer.reread'),
          cancelButtonText: t('website.webConfigDrawer.cancel')
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
    const currentPath = state.selectedPath
    await submitOperation('website.webserver.config.update', {
      path: state.selectedPath,
      content: state.content,
      revision: state.revision
    })
    await load(true)
    if (currentPath) {
      await readFile(currentPath, false)
    }
    ElMessage.success(i18n.t('website.notifications.webServerConfigSavedReloaded'))
    emit('changed')
  } catch (error: any) {
    if (isOperationCancelled(error)) {
      return
    } else if (error?.code === 'CONFLICT') {
      ElMessage.error(i18n.t('website.notifications.webServerConfigConflict'))
    }
  } finally {
    state.saving = false
  }
}

const close = async (done?: () => void) => {
  if (dirty.value) {
    try {
      await ElMessageBox.confirm(
        t('website.webConfigDrawer.closeMessage'),
        t('website.webConfigDrawer.closeTitle'),
        {
          type: 'warning',
          confirmButtonText: t('website.webConfigDrawer.discardClose'),
          cancelButtonText: t('website.webConfigDrawer.continueEditing')
        }
      )
    } catch {
      return
    }
  }
  if (done) done()
  else visible.value = false
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) void load()
  }
)
</script>

<template>
  <custom-drawer
    v-model:visible="visible"
    :title="t('website.webConfigDrawer.title', { name: state.server.name || t('website.webConfigDrawer.webServer') })"
    class="web-config-drawer"
    size="980px"
    :before-close="close"
    :close-on-click-modal="true"
    :destroy-on-close="false"
    :show-footer="false"
    body-mode="compact"
  >
    <div v-loading="state.loading" class="web-config">
      <section class="server-summary">
        <div class="server-summary__identity">
          <div class="server-logo" :class="`is-${serverKind}`">{{ serverLogoText }}</div>
          <div>
            <div class="server-summary__title">
              <strong>{{ state.server.name || t('website.webConfigDrawer.unknown') }}</strong>
              <el-tag
                :type="state.server.running ? 'success' : 'info'"
                effect="plain"
                round
                class="web-config__state-tag"
                :class="{ 'is-running': state.server.running, 'is-stopped': !state.server.running }"
              >
                {{ serverStateText }}
              </el-tag>
            </div>
            <p>{{ state.server.version || t('website.webConfigDrawer.versionUnknown') }} · {{ state.server.binaryPath || '-' }}</p>
          </div>
        </div>
        <el-button :icon="Refresh" @click="load(true)">{{ t('website.webConfigDrawer.refreshFiles') }}</el-button>
      </section>

      <section class="config-workspace">
        <aside class="config-sidebar">
          <div class="config-sidebar__heading">
            <div>
              <strong>{{ t('website.webConfigDrawer.configFiles') }}</strong>
              <span>{{ t('website.webConfigDrawer.fileCount', { count: state.files.length }) }}</span>
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
                <em>{{ formatSize(file.size) }} · {{ file.main ? t('website.webConfigDrawer.mainConfig') : file.site ? t('website.webConfigDrawer.siteConfig') : t('website.webConfigDrawer.extensionConfig') }}</em>
              </span>
            </button>
            <el-empty v-if="!state.files.length && !state.loading" :description="t('website.webConfigDrawer.noFiles')" />
          </div>
        </aside>

        <main class="config-editor">
          <div class="config-editor__toolbar">
            <div>
              <strong>{{ state.selectedPath || t('website.webConfigDrawer.selectFile') }}</strong>
              <span v-if="state.selectedPath">
                {{ t('website.webConfigDrawer.lastModified', { time: formatTime(state.modifiedAt) }) }}
                <i v-if="dirty">{{ t('website.webConfigDrawer.unsaved') }}</i>
              </span>
            </div>
            <el-button :icon="Refresh" :disabled="!state.selectedPath" @click="reloadCurrent">
              {{ t('website.webConfigDrawer.reread') }}
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
            :placeholder="t('website.webConfigDrawer.selectLeftFile')"
          />
          <div class="config-editor__footer">
            <div class="safe-note">
              <span></span>
              {{ t('website.webConfigDrawer.safeNote') }}
            </div>
            <div class="config-editor__actions">
              <el-button @click="close()">{{ t('website.webConfigDrawer.close') }}</el-button>
              <el-button
                type="primary"
                :loading="state.saving"
                :disabled="!state.selectedPath || !dirty"
                @click="save"
              >
                {{ t('website.webConfigDrawer.saveApply') }}
              </el-button>
            </div>
          </div>
        </main>
      </section>
    </div>
  </custom-drawer>
</template>

<style scoped lang="less">
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

  &.is-nginx {
    border-color: rgba(0, 150, 57, 0.2);
    color: #009639;
    background: rgba(0, 150, 57, 0.08);
  }

  &.is-openresty {
    border-color: rgba(67, 160, 71, 0.2);
    color: #2e7d32;
    background: rgba(67, 160, 71, 0.08);
  }

  &.is-caddy {
    border-color: rgba(14, 165, 233, 0.22);
    color: #0284c7;
    background: rgba(14, 165, 233, 0.08);
  }
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

.web-config__state-tag {
  min-width: 74px;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: transparent !important;
  --el-tag-bg-color: transparent;
  --el-tag-border-color: #909399;
  --el-tag-text-color: #909399;

  :deep(.el-tag__content) {
    color: inherit;
  }

  &.is-running {
    border-color: #67c23a !important;
    color: #67c23a !important;
    --el-tag-border-color: #67c23a;
    --el-tag-text-color: #67c23a;
  }

  &.is-stopped {
    border-color: #909399 !important;
    color: #909399 !important;
    --el-tag-border-color: #909399;
    --el-tag-text-color: #909399;
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
    color: #1f2937;
    background: #ffffff;
    caret-color: #2563eb;
    box-shadow: none;
    font: 12px/1.72 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    tab-size: 4;

    &::placeholder {
      color: #94a3b8;
    }

    &:disabled {
      color: #475569;
      background: #f8fafc;
      -webkit-text-fill-color: #475569;
    }
  }
}

:global(html.dark) {
  .config-code {
    :deep(.el-textarea__inner) {
      color: #d7e0ee;
      background: #101827;
      caret-color: #5eead4;
      text-shadow: 0 0 0 transparent;

      &::placeholder {
        color: rgba(215, 224, 238, 0.45);
      }

      &::selection {
        color: #f8fafc;
        background: rgba(94, 234, 212, 0.3);
      }

      &:focus {
        box-shadow: inset 0 0 0 1px rgba(94, 234, 212, 0.18);
      }

      &:disabled {
        color: #d7e0ee;
        background: #101827;
        -webkit-text-fill-color: #d7e0ee;
      }
    }
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
