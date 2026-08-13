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
let terminal: Terminal | undefined
let fitAddon: FitAddon | undefined
let socket: WebSocket | undefined
let resizeObserver: ResizeObserver | undefined
let statusTimer: number | undefined

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
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
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
  try {
    const { value: password } = await ElMessageBox.prompt(
      t('container.terminal.passwordPromptMessage', 'Enter the current administrator password to sign a one-time container terminal ticket.'),
      t('container.terminal.passwordPromptTitle', 'Open container terminal session'),
      {
        inputType: 'password',
        inputPlaceholder: t('container.terminal.adminPassword', 'Administrator password'),
        confirmButtonText: t('container.terminal.authenticateAndConnect', 'Authenticate and connect'),
        cancelButtonText: t('common.cancel', 'Cancel'),
        inputValidator: (value) => Boolean(value) || t('container.terminal.passwordRequired', 'Enter password')
      }
    )
    const confirmedHighRisk = await confirmHighRisk().catch(() => false)
    if (status.value?.requiresHighRiskConfirmation && !confirmedHighRisk) {
      throw new Error('cancel')
    }
    const { data } = await Api.createContainerTerminalTicket(
      props.target.ID,
      {
        password,
        confirmHighRisk: status.value?.requiresHighRiskConfirmation ? true : undefined
      },
      { silentError: true }
    )
    const apiBase = new URL(System.env.API || '/v1', window.location.origin)
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
      terminal?.write(`\r\n\x1b[33m${t('container.terminal.sessionClosedMessage', 'Container terminal session closed.')}\x1b[0m\r\n`)
      void loadStatus(true)
    }
  } catch (error: any) {
    connecting.value = false
    connectionState.value = 'disconnected'
    if (!['cancel', 'close'].includes(error) && error?.message !== 'cancel') {
      // ElMessage.error(getApiErrorMessage(error, t('container.terminal.ticketFailed', 'Failed to create container terminal ticket')))
      await loadStatus(true).catch(() => undefined)
    }
  }
}

const initializeTerminal = async () => {
  if (terminal) return
  await nextTick()
  terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: 'underline',
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
  if (terminalDiv.value) terminal.open(terminalDiv.value)
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
      return
    }
    await initializeTerminal()
    resetTerminalIntro()
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
  resizeObserver?.disconnect()
  socket?.close(1000, 'container terminal drawer closed')
  terminal?.dispose()
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
    cancel-text="关闭"
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
          <span>{{ $t('container.terminal.passwordRequiredTip', 'Enter the current administrator password again when connecting.') }}</span>
        </div>
        <div class="terminal-shell__footer">
          <div class="terminal-legend">
            <span><i class="is-risk" /><el-icon><WarningFilled /></el-icon>{{ $t('container.terminal.highRiskBadge', 'Risk checked') }}</span>
            <span><i class="is-audit" /><el-icon><Lock /></el-icon>{{ $t('container.terminal.auditBadge', 'Ticket bound to current session') }}</span>
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
  flex: 0 0 auto;
  height: clamp(520px, calc(100vh - 340px), 680px);
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
  height: calc(100% - 88px);
  padding: 14px 16px;
  transition: filter 180ms ease, opacity 180ms ease;

  &.is-blurred {
    filter: blur(3px);
    opacity: 0.42;
  }
}

.terminal-screen :deep(.xterm),
.terminal-screen :deep(.xterm-screen),
.terminal-screen :deep(.xterm-viewport) {
  height: 100% !important;
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
}

.terminal-legend,
.terminal-environment {
  gap: 12px;
}

.terminal-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.terminal-environment i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9aa6b6;

  &.connected { background: #22c77a; }
  &.connecting { background: #f59e0b; }
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

  .terminal-path {
    max-width: 180px;
  }
}
</style>
