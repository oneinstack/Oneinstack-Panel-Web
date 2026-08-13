<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ArrowLeft, Refresh, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/modules'
import { formatBytes } from '@/utils/fileSize'
import i18n from '@/lang'

const props = defineProps<{
  modelValue: boolean
  path: string
  initialDetail?: any
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'saved'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})
const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const state = reactive({
  loading: false,
  saving: false,
  content: '',
  original: '',
  detail: null as any,
  loadError: '',
  readOnlyReason: ''
})
const editorRef = ref<HTMLTextAreaElement>()
const dirty = computed(() => state.content !== state.original)
const canEdit = computed(() => !state.loadError && !state.readOnlyReason)
const textPreviewExtensions = new Set([
  '.txt',
  '.md',
  '.markdown',
  '.json',
  '.xml',
  '.yml',
  '.yaml',
  '.ini',
  '.conf',
  '.config',
  '.env',
  '.log',
  '.sh',
  '.bash',
  '.zsh',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.jsx',
  '.vue',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.html',
  '.htm',
  '.php',
  '.py',
  '.go',
  '.java',
  '.rb',
  '.rs',
  '.sql',
  '.toml',
  '.csv',
  '.gitignore',
  '.dockerfile'
])

const isTextPreviewable = (detail: any) => {
  const mimeType = String(detail?.mimeType || '').toLowerCase()
  const extension = String(detail?.extension || '').toLowerCase()
  if (/^text\//.test(mimeType)) return true
  if (/(^|\/)(json|xml|javascript|x-sh|x-httpd-php|x-empty|svg\+xml)(;|$)/.test(mimeType)) return true
  if (textPreviewExtensions.has(extension)) return true
  if (!extension && mimeType.includes('charset=')) return true
  return false
}

const isEditLimitMessage = (message: string) => /\u8fc7\u5927|\u8d85\u9650|\u65e0\u6cd5\u5728\u7ebf\u7f16\u8f91|too large|max/i.test(message)

const resolveReadErrorMessage = (error: any) => {
  const message = String(error?.message || '').trim()
  if (isEditLimitMessage(message)) return message || t('file.editor.editLimitMessage', 'The current file exceeds the online edit limit and cannot be edited online.')
  if (/binary|\u4e8c\u8fdb\u5236|\u6587\u672c|text|utf-8|\u7f16\u7801/i.test(message)) return message || t('file.editor.nonTextMessage', 'The current file is not an editable text file.')
  return message || t('file.editor.readFailed', 'Failed to read file')
}

const resetEditor = () => {
  state.loadError = ''
  state.readOnlyReason = ''
  state.content = ''
  state.original = ''
}

const applyFileDetail = async (data: any) => {
  state.detail = data
  state.content = data?.content ?? ''
  state.original = state.content
  if (!isTextPreviewable(data)) {
    state.readOnlyReason = t(
      'file.editor.unsupportedType',
      'The current file type is {type}, which cannot be previewed or edited as online text.',
      { type: data?.mimeType || data?.extension || t('file.editor.unknownType', 'unknown type') }
    )
  }
  await nextTick()
  if (!state.readOnlyReason) editorRef.value?.focus()
}

const load = async () => {
  if (!props.path) return
  state.loading = true
  resetEditor()
  try {
    const data =
      props.initialDetail?.path === props.path
        ? props.initialDetail
        : (await Api.getFileContent({ path: props.path })).data
    await applyFileDetail(data)
  } catch (error: any) {
    state.detail = {
      name: props.path.split('/').pop() || props.path,
      path: props.path,
      size: 0,
      mimeType: '-'
    }
    state.loadError = resolveReadErrorMessage(error)
    if (isEditLimitMessage(state.loadError)) {
      state.readOnlyReason = state.loadError
      state.loadError = ''
      return
    }
  } finally {
    state.loading = false
  }
}

watch(
  () => [props.modelValue, props.path] as const,
  ([opened]) => {
    if (opened) load()
  }
)

const save = async () => {
  if (!dirty.value || !canEdit.value) return
  try {
    await ElMessageBox.confirm(
      t('file.editor.confirmSaveMessage', 'Save {path}? Saving system configuration files incorrectly may affect service startup.', { path: props.path }),
      t('file.editor.confirmSaveTitle', 'Confirm file save'),
      { type: 'warning', confirmButtonText: t('common.save', 'Save'), cancelButtonText: t('common.cancel', 'Cancel') }
    )
  } catch {
    return
  }
  state.saving = true
  try {
    const { data } = await Api.saveFileContent({
      path: props.path,
      content: state.content,
      revision: state.detail?.revision
    })
    state.original = state.content
    if (state.detail) state.detail.revision = data?.revision
    ElMessage.success(t('file.editor.saved', 'File saved'))
    emit('saved')
  } catch (error: any) {
    const message = String(error?.message || t('file.editor.saveFailed', 'Failed to save file'))
    if (isEditLimitMessage(message)) {
      state.readOnlyReason = message
      state.original = state.content
      ElMessage.warning(message)
      return
    }
    // ElMessage.error(message)
  } finally {
    state.saving = false
  }
}

const confirmDiscard = async () => {
  if (dirty.value) {
    await ElMessageBox.confirm(t('file.editor.discardMessage', 'The current file has unsaved changes. Close anyway?'), t('file.editor.discardTitle', 'Discard changes'), {
      type: 'warning',
      confirmButtonText: t('file.editor.discardConfirm', 'Discard changes'),
      cancelButtonText: t('file.editor.continueEdit', 'Continue editing')
    })
  }
}

const close = async () => {
  try {
    await confirmDiscard()
    visible.value = false
  } catch {
    // Continue editing.
  }
}

const beforeClose = async (done: () => void) => {
  try {
    await confirmDiscard()
    done()
  } catch {
    // Continue editing.
  }
}
</script>

<template>
  <el-drawer
    v-model="visible"
    size="min(1040px, 92vw)"
    class="file-editor-drawer"
    :before-close="beforeClose"
    :show-close="false"
    destroy-on-close
  >
    <template #header>
      <div class="editor-heading">
        <button type="button" class="editor-back" @click="close">
          <el-icon><ArrowLeft /></el-icon>
          <span>{{ t('common.back', 'Back') }}</span>
        </button>
        <div class="heading-main">
          <div class="heading-title">
            <h3>{{ state.detail?.name || t('file.editor.title', 'File editor') }}</h3>
            <el-tag v-if="dirty" type="warning" effect="plain">{{ t('file.editor.unsaved', 'Unsaved') }}</el-tag>
          </div>
          <p>{{ path }}</p>
        </div>
      </div>
    </template>

    <div v-loading="state.loading" class="editor-shell">
      <div class="file-meta">
        <span>{{ t('file.editor.size', 'Size {size}', { size: formatBytes(state.detail?.size || 0) }) }}</span>
        <span>{{ t('file.editor.permission', 'Permission {permission}', { permission: state.detail?.mode || '-' }) }}</span>
        <span>{{ t('file.editor.owner', 'Owner {owner} : {group}', { owner: state.detail?.user || '-', group: state.detail?.group || '-' }) }}</span>
        <span>{{ state.detail?.mimeType || 'text/plain' }}</span>
        <span v-if="state.detail?.extension">{{ state.detail.extension }}</span>
        <el-button :icon="Refresh" link @click="load">{{ t('file.editor.reload', 'Reload') }}</el-button>
      </div>
      <el-alert
        v-if="state.loadError"
        :title="state.loadError"
        type="error"
        show-icon
        :closable="false"
      />
      <el-alert
        v-else-if="state.readOnlyReason"
        :title="state.readOnlyReason"
        type="warning"
        show-icon
        :closable="false"
      />
      <textarea
        ref="editorRef"
        v-model="state.content"
        class="code-editor"
        :readonly="!canEdit"
        spellcheck="false"
        autocomplete="off"
        :aria-label="t('file.editor.contentAria', 'File content')"
      />
      <div class="editor-footer">
        <span>{{ t('file.editor.editLimitTip', 'The online edit limit is controlled by the server configuration. Default: 10 MB.') }}</span>
        <div>
          <el-button @click="close">{{ t('common.close', 'Close') }}</el-button>
          <el-button type="primary" :icon="Check" :loading="state.saving" :disabled="!dirty || !canEdit" @click="save">
            {{ t('file.editor.saveFile', 'Save file') }}
          </el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped lang="less">
.editor-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 24px;
}

.editor-back {
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

.heading-main {
  min-width: 0;

  p {
    overflow: hidden;
    margin: 4px 0 0;
    color: var(--text-tertiary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.heading-title {
  display: flex;
  align-items: center;
  gap: 10px;

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 20px;
    font-weight: 760;
    line-height: 1.2;
  }
}

:global(.file-editor-drawer .el-drawer__header) {
  min-height: 88px;
  margin: 0;
  padding: 0 36px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-card);
}

:global(.file-editor-drawer .el-drawer__body) {
  padding: 24px 28px 28px;
}

.editor-shell {
  display: flex;
  height: calc(100vh - 112px);
  min-height: 520px;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: #0f172a;
}

.file-meta {
  display: flex;
  min-height: 48px;
  align-items: center;
  gap: 18px;
  padding: 0 16px;
  color: #94a3b8;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  font-size: 12px;

  .el-button {
    margin-left: auto;
  }
}

.code-editor {
  width: 100%;
  min-height: 0;
  flex: 1;
  padding: 20px 22px;
  resize: none;
  outline: none;
  border: 0;
  color: #e2e8f0;
  background: #0f172a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 14px;
  line-height: 1.72;
  tab-size: 2;
}

.editor-footer {
  display: flex;
  min-height: 66px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px;
  color: #94a3b8;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  background: #111c31;
  font-size: 12px;
}
</style>
