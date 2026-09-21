<script setup lang="ts">
import { nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import type { InputInstance } from 'element-plus'

interface PromptOptions {
  title: string
  message: string
  placeholder: string
  requiredMessage: string
  confirmText: string
  cancelText: string
}

const visible = ref(false)
const password = ref('')
const validationMessage = ref('')
const passwordInput = ref<InputInstance>()
const options = reactive<PromptOptions>({
  title: '',
  message: '',
  placeholder: '',
  requiredMessage: '',
  confirmText: '',
  cancelText: ''
})

let resolvePrompt: ((value: string | null) => void) | undefined

const clearPassword = () => {
  password.value = ''
  validationMessage.value = ''
}

const finish = (value: string | null) => {
  const resolve = resolvePrompt
  resolvePrompt = undefined
  visible.value = false
  clearPassword()
  resolve?.(value)
}

const confirm = () => {
  if (!password.value.trim()) {
    validationMessage.value = options.requiredMessage
    void nextTick(() => passwordInput.value?.focus())
    return
  }
  finish(password.value)
}

const cancel = () => finish(null)

const handleClosed = () => {
  if (resolvePrompt) finish(null)
  clearPassword()
}

const open = (nextOptions: PromptOptions) => {
  if (resolvePrompt) finish(null)
  Object.assign(options, nextOptions)
  clearPassword()
  visible.value = true
  return new Promise<string | null>((resolve) => {
    resolvePrompt = resolve
  })
}

onBeforeUnmount(() => {
  resolvePrompt?.(null)
  resolvePrompt = undefined
  clearPassword()
})

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="visible"
    width="min(460px, 92vw)"
    append-to-body
    destroy-on-close
    :title="options.title"
    :close-on-click-modal="false"
    @opened="passwordInput?.focus()"
    @closed="handleClosed"
  >
    <form autocomplete="off" @submit.prevent="confirm">
      <input
        class="panel-password-prompt__username-decoy"
        type="text"
        name="username"
        autocomplete="username"
        tabindex="-1"
        aria-hidden="true"
      />
      <p class="panel-password-prompt__message">{{ options.message }}</p>
      <el-input
        ref="passwordInput"
        v-model="password"
        type="password"
        name="oneinstack-panel-verification-password"
        autocomplete="new-password"
        :placeholder="options.placeholder"
        data-1p-ignore="true"
        data-lpignore="true"
        @input="validationMessage = ''"
      />
      <p v-if="validationMessage" class="panel-password-prompt__error">{{ validationMessage }}</p>
    </form>
    <template #footer>
      <el-button @click="cancel">{{ options.cancelText }}</el-button>
      <el-button type="primary" @click="confirm">{{ options.confirmText }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.panel-password-prompt__username-decoy {
  position: fixed;
  top: -10000px;
  left: -10000px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.panel-password-prompt__message {
  margin: 0 0 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.panel-password-prompt__error {
  margin: 8px 0 0;
  color: var(--el-color-danger);
  font-size: 12px;
}
</style>
