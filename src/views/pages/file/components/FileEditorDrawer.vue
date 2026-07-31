<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Document, Refresh, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/Api'
import { formatBytes } from '@/utils/fileSize'

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

const isEditLimitMessage = (message: string) => /过大|超限|无法在线编辑|too large|max/i.test(message)

const resolveReadErrorMessage = (error: any) => {
  const message = String(error?.message || '').trim()
  if (isEditLimitMessage(message)) return message || '当前文件超过在线编辑限制，无法直接在线编辑。'
  if (/binary|二进制|文本|text|utf-8|编码/i.test(message)) return message || '当前文件不是可在线编辑的文本文件。'
  return message || '读取文件失败'
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
    state.readOnlyReason = `当前文件类型为 ${data?.mimeType || data?.extension || '未知类型'}，不支持在线文本预览或编辑。`
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
      `确定保存 ${props.path}？系统配置文件保存错误可能影响服务启动。`,
      '确认保存文件',
      { type: 'warning', confirmButtonText: '保存', cancelButtonText: '取消' }
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
    ElMessage.success('文件已保存')
    emit('saved')
  } catch (error: any) {
    const message = String(error?.message || '文件保存失败')
    if (isEditLimitMessage(message)) {
      state.readOnlyReason = message
      state.original = state.content
      ElMessage.warning(message)
      return
    }
    ElMessage.error(message)
  } finally {
    state.saving = false
  }
}

const confirmDiscard = async () => {
  if (dirty.value) {
    await ElMessageBox.confirm('当前文件有未保存的修改，确定关闭吗？', '放弃修改', {
      type: 'warning',
      confirmButtonText: '放弃修改',
      cancelButtonText: '继续编辑'
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
    destroy-on-close
  >
    <template #header>
      <div class="editor-heading">
        <div class="heading-icon"><el-icon><Document /></el-icon></div>
        <div class="heading-main">
          <div class="heading-title">
            <h3>{{ state.detail?.name || '文件编辑器' }}</h3>
            <el-tag v-if="dirty" type="warning" effect="plain">未保存</el-tag>
          </div>
          <p>{{ path }}</p>
        </div>
      </div>
    </template>

    <div v-loading="state.loading" class="editor-shell">
      <div class="file-meta">
        <span>大小 {{ formatBytes(state.detail?.size || 0) }}</span>
        <span>权限 {{ state.detail?.mode || '-' }}</span>
        <span>所有者 {{ state.detail?.user || '-' }} : {{ state.detail?.group || '-' }}</span>
        <span>{{ state.detail?.mimeType || 'text/plain' }}</span>
        <span v-if="state.detail?.extension">{{ state.detail.extension }}</span>
        <el-button :icon="Refresh" link @click="load">重新读取</el-button>
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
        aria-label="文件内容"
      />
      <div class="editor-footer">
        <span>在线编辑上限由服务器配置控制，默认 10MB。</span>
        <div>
          <el-button @click="close">关闭</el-button>
          <el-button type="primary" :icon="Check" :loading="state.saving" :disabled="!dirty || !canEdit" @click="save">
            保存文件
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
  gap: 14px;
}

.heading-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.1);
  font-size: 21px;
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
  }
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
