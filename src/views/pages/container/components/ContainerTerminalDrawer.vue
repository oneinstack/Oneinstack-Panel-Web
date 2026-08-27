<script setup lang="ts">
import { computed, h, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CopyDocument,
  Delete,
  FolderOpened,
  FullScreen,
  Lock,
  Monitor,
  Refresh,
  WarningFilled
} from '@element-plus/icons-vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { Api } from '@/api/modules'
import System from '@/utils/System'
import { useAppStore } from '@/stores/modules/app';
import i18n from '@/lang'
import { resolveHttpErrorMessage } from '@/utils/http-error'
import type { ContainerItem } from '../types'

const sapp = useAppStore()

interface ContainerTerminalRisk {
  code?: string
  message?: string
}

interface ContainerTerminalStatus {
  enabled: boolean
  available: boolean
  containerId: string
  containerName: string
  running: boolean
  shell?: string
  risks?: ContainerTerminalRisk[]
  requiresHighRiskConfirmation?: boolean
  maxSessionMinutes?: number
  idleMinutes?: number
  maxOutputMB?: number
  maxConcurrent?: number
  maxPerUser?: number
  activeSessions?: number
  message?: string
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'closed'

const props = defineProps<{
  modelValue: boolean
  target: ContainerItem | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const drawerTitle = computed(() =>
  `${props.target?.Names || props.target?.ID || t('container.terminal.title', 'Container terminal')} ${t('container.terminal.titleSuffix', 'Terminal')}`
)

const terminalDiv = ref<HTMLElement>()
const terminalShell = ref<HTMLElement>()
const loadingStatus = ref(false)
const status = ref<ContainerTerminalStatus | null>(null)
const connecting = ref(false)
const connectionState = ref<ConnectionState>('disconnected')
const terminalIdentity = ref('container@shell')
const currentPath = ref('/')
const isFullscreen = ref(false)
const lastConnectionError = ref('')
let terminal: Terminal | undefined
let fitAddon: FitAddon | undefined
let socket: WebSocket | undefined
let resizeObserver: ResizeObserver | undefined
let statusTimer: number | undefined

const resetTerminalState = () => {
  terminalIdentity.value = 'container@shell'
  currentPath.value = '/'
}

const canConnect = computed(() =>
  Boolean(status.value?.enabled && status.value?.available && status.value?.running)
)

const riskMessages = computed(() =>
  (status.value?.risks || [])
    .map((item) => item?.message || item?.code || '')
    .filter(Boolean)
)

const connectionLabel = computed(() => {
  switch (connectionState.value) {
    case 'connecting': return t('container.terminal.connection.authenticating', 'Authenticating')
    case 'connected': return t('container.terminal.connection.connected', 'Session connected')
    case 'closed': return t('container.terminal.connection.ended', 'Session ended')
    default: return t('container.terminal.connection.disconnected', 'Disconnected')
  }
})

const statusDescription = computed(() => {
  if (!status.value?.enabled) return status.value?.message || t('container.terminal.disabledDescription', 'Container terminal is not enabled on the server.')
  if (!status.value?.available) return status.value?.message || t('container.terminal.unavailableDescription', 'The current container does not support interactive shell access.')
  if (!status.value?.running) return t('container.terminal.notRunningDescription', 'Only running Linux containers can open an interactive terminal.')
  return status.value?.message || ''
})

const sessionLimitText = computed(() =>
  t('container.terminal.sessionLimit', 'Session {max} min · idle {idle} min · output {output} MB', {
    max: status.value?.maxSessionMinutes || 0,
    idle: status.value?.idleMinutes || 0,
    output: status.value?.maxOutputMB || 0
  })
)

const concurrentText = computed(() =>
  t('container.terminal.concurrent', 'Active {active} / {max} · per user {perUser}', {
    active: status.value?.activeSessions || 0,
    max: status.value?.maxConcurrent || 0,
    perUser: status.value?.maxPerUser || 0
  })
)

const getApiErrorMessage = (error: any, fallback: string) =>
  resolveHttpErrorMessage(
    error?.xhr?.data
    || error?.response?.data
    || error?.data
    || error?.error
    || error,
    fallback
  )

const getApiErrorCode = (error: any) =>
  error?.xhr?.data?.error?.code
  || error?.xhr?.data?.code
  || error?.response?.data?.error?.code
  || error?.response?.data?.code
  || error?.data?.error?.code
  || error?.data?.code
  || error?.error?.code
  || error?.code

const getTerminalErrorMessage = (error: any) => {
  const errorCode = String(getApiErrorCode(error) || '')
  if (errorCode === '1103') {
    return t('container.terminal.authFailedTip', '二次认证失败，请确认当前管理员密码后重试。')
  }
  return getApiErrorMessage(error, t('container.terminal.ticketFailed', 'Failed to create container terminal ticket'))
}

const encodeInput = (value: string) => {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return window.btoa(binary)
}

const decodeOutput = (value: string) => {
  const binary = window.atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

const sendSize = () => {
  if (!socket || socket.readyState !== WebSocket.OPEN || !terminal) return
  socket.send(JSON.stringify({ rows: terminal.rows, cols: terminal.cols }))
}

const focusTerminal = () => {
  if (!terminal || connectionState.value !== 'connected') return
  terminal.focus()
  terminal.textarea?.focus()
}

const writeClipboard = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.className = 'terminal-copy-helper'
  textarea.setAttribute('aria-hidden', 'true')
  textarea.setAttribute('readonly', 'readonly')
  textarea.tabIndex = -1
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('clipboard unavailable')
}

const copySelection = async () => {
  const value = terminal?.getSelection()
  if (!value) {
    ElMessage.info(t('container.terminal.selectTextFirst', 'Select text in the terminal before copying'))
    return
  }
  try {
    await writeClipboard(value)
    ElMessage.success(t('container.terminal.copiedSelection', 'Selected text copied'))
  } catch {
    ElMessage.error(t('container.terminal.copyFailed', 'Copy failed. Use the system copy shortcut.'))
  }
  focusTerminal()
}

const clearTerminal = () => {
  terminal?.clear()
  focusTerminal()
}

const toggleFullscreen = async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await terminalShell.value?.requestFullscreen()
    }
  } catch {
    ElMessage.warning(t('container.terminal.fullscreenUnsupported', 'This browser does not support terminal fullscreen display'))
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = document.fullscreenElement === terminalShell.value
  window.setTimeout(() => {
    try {
      fitAddon?.fit()
      sendSize()
    } catch {
      // 全屏切换期间布局可能仍在变化，稍后会再次调整终端尺寸。
    }
  }, 80)
}

const syncTerminalTitle = (title: string) => {
  const separator = title.indexOf(':')
  if (separator <= 0) return
  terminalIdentity.value = title.slice(0, separator)
  currentPath.value = title.slice(separator + 1) || '/'
}

const disconnectTerminal = () => {
  socket?.close(1000, 'user closed container terminal')
}

const handleClose = () => {
  disconnectTerminal()
  visible.value = false
}

const destroyTerminal = () => {
  resizeObserver?.disconnect()
  resizeObserver = undefined
  terminal?.dispose()
  terminal = undefined
  fitAddon = undefined
  if (terminalDiv.value) terminalDiv.value.innerHTML = ''
  resetTerminalState()
}

const resetTerminalIntro = () => {
  if (!terminal) return
  terminal.clear()
  terminalIdentity.value = `${props.target?.Names || 'container'}@${status.value?.shell || '/bin/sh'}`
  currentPath.value = '/'
  terminal.write(`\x1b[1;38;5;45mOneinStack Container Console\x1b[0m \x1b[38;5;245m· ${props.target?.Names || props.target?.ID || ''}\x1b[0m\r\n`)
  terminal.write(`\x1b[38;5;245m${t('container.terminal.waitingAuth', 'Waiting for authentication')}\x1b[0m\r\n`)
}

const loadStatus = async (quiet = false) => {
  if (!props.target?.ID) return
  loadingStatus.value = !quiet
  try {
    const { data } = await Api.getContainerTerminalStatus(props.target.ID, { silentError: true })
    status.value = data
    if (data?.containerName) {
      terminalIdentity.value = `${data.containerName}@${data.shell || '/bin/sh'}`
    }
  } catch (error: any) {
    // if (!quiet) ElMessage.error(getApiErrorMessage(error, t('container.terminal.statusReadFailed', 'Failed to read container terminal status')))
  } finally {
    loadingStatus.value = false
  }
}

const confirmHighRisk = async () => {
  if (!status.value?.requiresHighRiskConfirmation || !riskMessages.value.length) return false
  const content = h('div', { class: 'risk-confirm' }, [
    h('p', t('container.terminal.highRiskConfirmMessage', 'The container has the following high-risk characteristics. Confirm to continue opening an interactive terminal:')),
    h('ul', riskMessages.value.map((message) => h('li', message)))
  ])
  await ElMessageBox.confirm(content, t('container.terminal.highRiskConfirmTitle', 'Confirm high-risk container terminal'), {
    type: 'warning',
    confirmButtonText: t('container.terminal.confirmHighRisk', 'Continue and connect'),
    cancelButtonText: t('common.cancel', 'Cancel')
  })
  return true
}

const connectTerminal = async () => {
  if (!props.target?.ID || connecting.value || connectionState.value === 'connected') return
  connecting.value = true
  connectionState.value = 'connecting'
  lastConnectionError.value = ''
  try {
    const { value: password } = await ElMessageBox.prompt(
      t('container.terminal.passwordPromptMessage', 'Enter the current administrator password to sign a one-time container terminal ticket.'),
      t('container.terminal.passwordPromptTitle', 'Open container terminal session'),
      {
        inputType: 'password',
        inputPlaceholder: t('container.terminal.adminPassword', 'Administrator password'),
        confirmButtonText: t('container.terminal.authenticateAndConnect', 'Authenticate and connect'),
        cancelButtonText: t('common.cancel', 'Cancel'),
        inputValidator: (value) => Boolean(value?.trim()) || t('container.terminal.passwordRequired', 'Enter password')
      }
    )
    const confirmedHighRisk = await confirmHighRisk().catch(() => false)
    if (status.value?.requiresHighRiskConfirmation && !confirmedHighRisk) {
      throw new Error('cancel')
    }
    const { data } = await Api.createContainerTerminalTicket(
      props.target.ID,
      {
        password: password.trim(),
        confirmHighRisk: status.value?.requiresHighRiskConfirmation ? true : undefined
      },
      { silentError: true }
    )
    const apiBase = new URL(System.env.API || '/v1', window.location.origin)
    await initializeTerminal()
    const protocol = apiBase.protocol === 'https:' ? 'wss:' : 'ws:'
    const apiPath = apiBase.pathname.replace(/\/$/, '')
    const url = `${protocol}//${apiBase.host}${apiPath}/containers/${encodeURIComponent(props.target.ID)}/terminal/open?ticket=${encodeURIComponent(data.ticket)}`
    socket = new WebSocket(url)
    socket.onopen = () => {
      connectionState.value = 'connected'
      connecting.value = false
      sendSize()
      void loadStatus(true)
      void nextTick(() => {
        focusTerminal()
        window.setTimeout(focusTerminal, 80)
      })
    }
    socket.onmessage = async (event) => {
      try {
        if (typeof event.data === 'string') {
          terminal?.write(decodeOutput(event.data))
          return
        }
        if (event.data instanceof Blob) {
          const text = await event.data.text()
          terminal?.write(decodeOutput(text))
        }
      } catch {
        terminal?.write(`\r\n\x1b[31m${t('container.terminal.outputDecodeFailed', 'Failed to decode container terminal output.')}\x1b[0m\r\n`)
      }
    }
    socket.onerror = () => {
      ElMessage.error(t('container.terminal.connectionFailed', 'Container terminal connection failed'))
    }
    socket.onclose = () => {
      connectionState.value = 'closed'
      connecting.value = false
      socket = undefined
      destroyTerminal()
      void loadStatus(true)
    }
  } catch (error: any) {
    connecting.value = false
    connectionState.value = 'disconnected'
    destroyTerminal()
    if (!['cancel', 'close'].includes(error) && error?.message !== 'cancel') {
      lastConnectionError.value = getTerminalErrorMessage(error)
      ElMessage.error(lastConnectionError.value)
      await loadStatus(true).catch(() => undefined)
    }
  }
}

const initializeTerminal = async () => {
  if (terminal) return
  await nextTick()
  if (!terminalDiv.value) return
  terminal = new Terminal({
    cursorBlink: false,
    cursorStyle: 'bar',
    cursorInactiveStyle: 'bar',
    cursorWidth: 2,
    convertEol: false,
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    fontSize: 14,
    letterSpacing: 0.15,
    lineHeight: 1.35,
    minimumContrastRatio: 1,
    scrollback: 5000,
    theme: {
      background: '#08111f',
      foreground: '#d8e2f0',
      cursor: sapp.accentColor,
      cursorAccent: '#08111f',
      selectionBackground: '#294260',
      black: '#526176',
      red: '#ff6b7a',
      green: '#50d890',
      yellow: '#f7c65f',
      blue: '#62a8ff',
      magenta: '#c792ea',
      cyan: '#55d6e8',
      white: '#d8e2f0',
      brightBlack: '#8392a8',
      brightRed: '#ff8490',
      brightGreen: '#69e5a4',
      brightYellow: '#ffd779',
      brightBlue: '#82baff',
      brightMagenta: '#d9a7f5',
      brightCyan: '#78e3ef',
      brightWhite: '#ffffff'
    }
  })
  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.open(terminalDiv.value)
  fitAddon.fit()
  terminal.onTitleChange(syncTerminalTitle)
  terminal.onData((data) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(encodeInput(data))
  })
  terminal.onResize(sendSize)
  if (terminalDiv.value) {
    resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon?.fit()
      } catch {
        // 抽屉过渡期间终端区域可能短暂收缩，稍后会再次调整尺寸。
      }
    })
    resizeObserver.observe(terminalDiv.value)
  }
  resetTerminalIntro()
}

watch(
  () => sapp.accentColor,
  (color) => {
    if (!terminal) return
    terminal.options.theme = {
      ...terminal.options.theme,
      cursor: color
    }
  }
)

watch(
  () => [props.modelValue, props.target?.ID] as const,
  async ([isVisible]) => {
    if (!isVisible) {
      disconnectTerminal()
      destroyTerminal()
      lastConnectionError.value = ''
      return
    }
    resetTerminalState()
    await loadStatus()
    if (statusTimer !== undefined) window.clearInterval(statusTimer)
    statusTimer = window.setInterval(() => {
      void loadStatus(true)
    }, 15000)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (statusTimer !== undefined) window.clearInterval(statusTimer)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  socket?.close(1000, 'container terminal drawer closed')
  destroyTerminal()
})

watch(
  () => props.modelValue,
  (visibleNow) => {
    if (visibleNow) {
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      return
    }
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    if (statusTimer !== undefined) {
      window.clearInterval(statusTimer)
      statusTimer = undefined
    }
  }
)
</script>

<template>
  <custom-drawer
    :visible="visible"
    :title="drawerTitle"
    class="container-terminal-drawer"
    size="1080px"
    :cancel-text="t('common.close')"
    :show-confirm="false"
    :destroy-on-close="false"
    :on-close="handleClose"
  >
    <div class="terminal-card">
      <div class="terminal-toolbar-panel">
        <div class="terminal-toolbar-panel__summary">
          <strong>{{ $t('container.terminal.subtitle', 'Interactive terminal session for the running container') }}</strong>
          <span class="connection-state" :class="connectionState">
            <i />
            {{ connectionLabel }}
          </span>
        </div>
        <div class="drawer-actions">
          <el-button :icon="Refresh" :loading="loadingStatus" @click="loadStatus()">
            {{ $t('common.refresh') }}
          </el-button>
          <el-button
            v-if="connectionState !== 'connected'"
            type="primary"
            :loading="connecting"
            :disabled="!canConnect"
            @click="connectTerminal"
          >
            {{ $t('container.terminal.connect', 'Connect terminal') }}
          </el-button>
          <el-button v-else type="danger" plain @click="disconnectTerminal">
            {{ $t('container.terminal.disconnect', 'Disconnect') }}
          </el-button>
        </div>
      </div>

      <div v-if="status" class="terminal-meta">
        <el-tag :type="status.enabled ? 'success' : 'info'">{{ status.enabled ? $t('container.enabled') : $t('container.notEnabled') }}</el-tag>
        <el-tag :type="status.available ? 'success' : 'warning'">{{ status.available ? $t('container.terminal.available', 'Available') : $t('container.terminal.unavailable', 'Unavailable') }}</el-tag>
        <el-tag :type="status.running ? 'success' : 'info'">{{ status.running ? $t('container.statusOptions.up') : $t('container.statusOptions.exited') }}</el-tag>
        <el-tag v-if="status.shell" type="info">{{ status.shell }}</el-tag>
        <span>{{ sessionLimitText }}</span>
        <span>{{ concurrentText }}</span>
      </div>

      <el-alert
        v-if="status && (!status.enabled || !status.available || !status.running)"
        class="terminal-alert"
        type="warning"
        :closable="false"
        show-icon
        :title="statusDescription"
      />

      <el-alert
        v-if="riskMessages.length"
        class="terminal-alert"
        type="warning"
        :closable="false"
        show-icon
        :title="$t('container.terminal.riskTitle', 'High-risk characteristics detected')"
        :description="riskMessages.join('；')"
      />

      <div
        ref="terminalShell"
        class="terminal-shell"
        :class="{ 'is-fullscreen': isFullscreen }"
        @mousedown="focusTerminal"
        @click="focusTerminal"
      >
        <div class="terminal-shell__bar">
          <div class="window-dots"><i /><i /><i /></div>
          <div class="terminal-identity">
            <span class="terminal-identity__icon">_</span>
            <div>
              <strong>{{ terminalIdentity }}</strong>
              <small>{{ connectionLabel }}</small>
            </div>
          </div>
          <div class="terminal-toolbar">
            <div class="terminal-path" :title="$t('terminal.currentPath')">
              <el-icon><FolderOpened /></el-icon>
              <span>{{ currentPath }}</span>
            </div>
            <button class="terminal-tool" type="button" :title="$t('terminal.copySelection')" @mousedown.stop @click.stop="copySelection">
              <el-icon><CopyDocument /></el-icon>
            </button>
            <button class="terminal-tool" type="button" :title="$t('terminal.clearDisplay')" @mousedown.stop @click.stop="clearTerminal">
              <el-icon><Delete /></el-icon>
            </button>
            <button class="terminal-tool" type="button" :title="isFullscreen ? $t('terminal.exitFullscreen') : $t('terminal.fullscreen')" @mousedown.stop @click.stop="toggleFullscreen">
              <el-icon><FullScreen /></el-icon>
            </button>
          </div>
        </div>
        <div
          ref="terminalDiv"
          class="terminal-screen"
          :class="{ 'is-blurred': connectionState !== 'connected' }"
        />
        <div v-if="connectionState !== 'connected'" class="terminal-placeholder">
          <el-icon><Monitor /></el-icon>
          <strong>{{ status?.enabled ? $t('container.terminal.notConnected', 'Terminal not connected') : $t('terminal.closed') }}</strong>
          <span :class="{ 'is-error': Boolean(lastConnectionError) }">
            {{ lastConnectionError || $t('container.terminal.passwordRequiredTip', 'Enter the current administrator password again when connecting.') }}
          </span>
        </div>
        <div class="terminal-shell__footer">
          <div class="terminal-legend">
            <span><i class="is-directory" />{{ $t('container.terminal.directory', 'Directory') }}</span>
            <span><i class="is-executable" />{{ $t('container.terminal.executableFile', 'Executable') }}</span>
            <span><i class="is-archive" />{{ $t('container.terminal.archiveFile', 'Archive') }}</span>
            <span><i class="is-link" />{{ $t('container.terminal.symlink', 'Symlink') }}</span>
            <span><i class="is-file" />{{ $t('container.terminal.regularFile', 'Regular file') }}</span>
          </div>
          <div class="terminal-environment">
            <i :class="connectionState" />
            <span>UTF-8</span>
            <span>xterm-256color</span>
          </div>
        </div>
      </div>
    </div>
  </custom-drawer>
</template>

<style scoped lang="less">
.drawer-actions,
.terminal-toolbar-panel,
.terminal-toolbar-panel__summary,
.terminal-meta,
.terminal-legend,
.terminal-environment {
  display: flex;
  align-items: center;
}

.drawer-actions {
  gap: 12px;
  margin-left: auto;
}

.terminal-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 14px;
}

.terminal-toolbar-panel {
  justify-content: space-between;
  gap: 16px;
}

.terminal-toolbar-panel__summary {
  flex-wrap: wrap;
  gap: 12px;

  strong {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 700;
  }
}

.terminal-meta {
  flex-wrap: wrap;
  gap: 10px;
  color: var(--text-secondary);
  font-size: 12px;
}

.terminal-alert {
  flex-shrink: 0;
  border-radius: 12px;
}

.connection-state {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-tertiary);
  font-size: 12px;

  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #9aa6b6;
  }

  &.connected {
    color: #1ba968;

    i {
      background: #22c77a;
      box-shadow: 0 0 0 4px rgb(34 199 122 / 12%);
    }
  }

  &.connecting i {
    background: #f59e0b;
  }
}

.terminal-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  min-height: 0;
  height: clamp(520px, calc(100vh - 356px), 680px);
  overflow: hidden;
  border: 1px solid #25344a;
  border-radius: 17px;
  background: #08111f;
  box-shadow:
    0 22px 50px rgb(5 13 25 / 20%),
    inset 0 1px 0 rgb(255 255 255 / 4%);

  &.is-fullscreen {
    width: 100vw;
    height: 100vh;
    max-height: none;
    border: 0;
    border-radius: 0;
  }

  &__bar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 16px;
    height: 54px;
    padding: 0 14px 0 17px;
    border-bottom: 1px solid #223047;
    color: #b8c5d7;
    background: linear-gradient(180deg, #152136 0%, #111c2e 100%);
  }

  &__footer {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    height: 34px;
    padding: 0 16px;
    border-top: 1px solid #1c293c;
    color: #8392a8;
    background: #0d1727;
    font-size: 10px;
  }
}

.window-dots {
  display: flex;
  flex-shrink: 0;
  gap: 7px;

  i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #ff6b6b;
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 8%);

    &:nth-child(2) { background: #f6c453; }
    &:nth-child(3) { background: #55d187; }
  }
}

.terminal-identity {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 9px;

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 25px;
    height: 25px;
    border: 1px solid rgb(98 168 255 / 24%);
    border-radius: 7px;
    color: #62a8ff;
    background: rgb(98 168 255 / 9%);
    font-family: monospace;
    font-size: 15px;
    font-weight: 700;
  }

  strong {
    color: #e5edf8;
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: 11px;
    font-weight: 650;
  }

  small {
    color: #7f8da2;
    font-size: 9px;
  }
}

.terminal-toolbar {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  margin-left: auto;
}

.terminal-path {
  display: inline-flex;
  min-width: 80px;
  max-width: 360px;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  height: 32px;
  border-radius: 9px;
  color: #d3deec;
  background: rgb(255 255 255 / 6%);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 11px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.terminal-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 9px;
  color: #d3deec;
  background: rgb(255 255 255 / 6%);
  cursor: pointer;

  &:hover {
    background: rgb(98 168 255 / 16%);
    color: #82baff;
  }
}

.terminal-screen {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  padding: 15px 11px 14px;
  overflow: hidden;
  transition: filter 180ms ease, opacity 180ms ease;

  &.is-blurred {
    filter: blur(3px);
    opacity: 0.42;
  }
}

.terminal-screen :deep(.xterm) {
  box-sizing: border-box;
  height: calc(100% - 8px);
  color: #d8e2f0;
}

.terminal-screen :deep(.xterm-rows) {
  color: #d8e2f0;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 14px;
  font-kerning: none;
  padding-bottom: 80px;
  box-sizing: content-box;
  white-space: pre;
  text-shadow: 0 0 1px rgb(216 226 240 / 18%);
}

.terminal-screen :deep(.xterm-rows::after) {
  display: block;
  height: 80px;
  content: '';
}

.terminal-screen :deep(.xterm-rows span:not(.xterm-bold)) {
  font-weight: 400;
}

.terminal-screen :deep(.xterm-italic) {
  font-style: italic;
}

// xterm's DOM renderer normally inserts its ANSI palette through runtime
// <style> elements. The Panel deliberately rejects inline styles in its CSP,
// so those rules never reach the page. Generate the complete xterm-256color
// palette at build time instead so shell file colors remain visible.
.terminal-ansi-color(@index, @value) {
  .terminal-screen :deep(.xterm-fg-@{index}) {
    color: @value !important;
  }

  .terminal-screen :deep(.xterm-bg-@{index}) {
    background-color: @value !important;
  }
}

.terminal-ansi-color(0, #526176);
.terminal-ansi-color(1, #ff6b7a);
.terminal-ansi-color(2, #50d890);
.terminal-ansi-color(3, #f7c65f);
.terminal-ansi-color(4, #62a8ff);
.terminal-ansi-color(5, #c792ea);
.terminal-ansi-color(6, #55d6e8);
.terminal-ansi-color(7, #d8e2f0);
.terminal-ansi-color(8, #8392a8);
.terminal-ansi-color(9, #ff8490);
.terminal-ansi-color(10, #69e5a4);
.terminal-ansi-color(11, #ffd779);
.terminal-ansi-color(12, #82baff);
.terminal-ansi-color(13, #d9a7f5);
.terminal-ansi-color(14, #78e3ef);
.terminal-ansi-color(15, #ffffff);

@terminal-ansi-levels: 0, 95, 135, 175, 215, 255;

.terminal-ansi-blue(@red, @green, @blue) when (@blue < 6) {
  @index: 16 + (@red * 36) + (@green * 6) + @blue;
  @red-value: extract(@terminal-ansi-levels, (@red + 1));
  @green-value: extract(@terminal-ansi-levels, (@green + 1));
  @blue-value: extract(@terminal-ansi-levels, (@blue + 1));
  .terminal-ansi-color(@index, rgb(@red-value, @green-value, @blue-value));
  .terminal-ansi-blue(@red, @green, (@blue + 1));
}

.terminal-ansi-green(@red, @green) when (@green < 6) {
  .terminal-ansi-blue(@red, @green, 0);
  .terminal-ansi-green(@red, (@green + 1));
}

.terminal-ansi-red(@red) when (@red < 6) {
  .terminal-ansi-green(@red, 0);
  .terminal-ansi-red((@red + 1));
}

.terminal-ansi-gray(@offset) when (@offset < 24) {
  @index: 232 + @offset;
  @value: 8 + (@offset * 10);
  .terminal-ansi-color(@index, rgb(@value, @value, @value));
  .terminal-ansi-gray((@offset + 1));
}

.terminal-ansi-red(0);
.terminal-ansi-gray(0);

.terminal-screen :deep(.xterm-fg-257) {
  color: #08111f !important;
}

.terminal-screen :deep(.xterm-bg-257) {
  background-color: #d8e2f0 !important;
}

.terminal-screen :deep(.xterm-dim) {
  opacity: 0.55;
}

.terminal-screen :deep(.xterm-bold) {
  font-weight: 700;
}

.terminal-screen :deep(.xterm-screen),
.terminal-screen :deep(.xterm-viewport) {
  max-height: 100%;
}

.terminal-screen :deep(.xterm-viewport) {
  overflow-y: auto !important;

  &::-webkit-scrollbar {
    width: 7px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border: 2px solid #08111f;
    border-radius: 8px;
    background: #30415a;
  }
}

:global(.terminal-copy-helper) {
  position: fixed;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  margin: 0;
  padding: 0;
  border: 0;
  opacity: 0;
  pointer-events: none;
  background: transparent;
  color: transparent;
  resize: none;
  overflow: hidden;
  z-index: -1;
}

.terminal-screen :deep(.xterm-rows .xterm-cursor) {
  visibility: visible !important;
}

.terminal-screen :deep(.xterm-rows .xterm-cursor.xterm-cursor-bar) {
  background: transparent;
  box-shadow: 2px 0 0 rgb(var(--primary-color)) inset;
}

.terminal-screen :deep(.xterm-rows .xterm-cursor.xterm-cursor-underline) {
  height: calc(100% - 2px);
  border-bottom: 2px solid rgb(var(--primary-color));
}

.terminal-placeholder {
  position: absolute;
  inset: 55px 0 34px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #8ea0b6;
  pointer-events: none;
  background: linear-gradient(180deg, rgb(8 17 31 / 18%) 0%, rgb(8 17 31 / 45%) 100%);

  strong {
    color: #e5edf8;
    font-size: 15px;
  }

  span {
    font-size: 12px;
  }

  .is-error {
    color: #ff9f9f;
  }
}

.terminal-legend,
.terminal-environment {
  display: flex;
  align-items: center;
}

.terminal-legend {
  gap: 15px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
  }

  i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .is-directory { background: #62a8ff; }
  .is-executable { background: #50d890; }
  .is-archive { background: #ff6b7a; }
  .is-link { background: #55d6e8; }
  .is-file { background: #d8e2f0; }
}

.terminal-environment {
  flex-shrink: 0;
  gap: 9px;
}

.terminal-environment i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #66768c;

  &.connected {
    background: #50d890;
    box-shadow: 0 0 0 3px rgb(80 216 144 / 10%);
  }

  &.connecting {
    background: #f7c65f;
  }
}

.terminal-environment span + span {
  padding-left: 9px;
  border-left: 1px solid #29364a;
}

:global(.container-terminal-drawer .custom-drawer-shell .el-drawer__body) {
  overflow: hidden;
}

@media (max-width: 960px) {
  .terminal-toolbar-panel,
  .drawer-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .drawer-actions {
    margin-left: 0;
  }

  .terminal-shell__bar,
  .terminal-shell__footer {
    height: auto;
    flex-wrap: wrap;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .terminal-shell {
    height: 520px;
  }

  .terminal-legend span:nth-child(n + 4) {
    display: none;
  }

  .terminal-path {
    max-width: 180px;
  }
}

@media (max-width: 560px) {
  .terminal-identity small,
  .terminal-legend {
    display: none;
  }

  .terminal-shell__footer {
    justify-content: flex-end;
  }
}
</style>
