<template>
  <section class="secure-terminal">
    <header class="terminal-header">
      <div>
        <div class="terminal-eyebrow">ISOLATED WEB SHELL</div>
        <h2>{{ $t('terminal.title') }}</h2>
        <p>{{ $t('terminal.subtitle') }}</p>
      </div>
      <div class="terminal-actions">
        <span class="connection-state" :class="connectionState">
          <i />
          {{ connectionLabel }}
        </span>
        <el-button
          v-if="connectionState !== 'connected'"
          type="primary"
          :loading="connecting"
          :disabled="!status?.enabled || !status?.isolationAvailable"
          @click="connectTerminal"
        >
          {{ $t('terminal.connectSession') }}
        </el-button>
        <el-button v-else type="danger" plain @click="disconnectTerminal">
          {{ $t('terminal.disconnectSession') }}
        </el-button>
      </div>
    </header>

    <el-alert
      v-if="status && (!status.enabled || !status.isolationAvailable)"
      class="terminal-alert"
      type="warning"
      :closable="false"
      show-icon
      :title="status.enabled ? $t('terminal.runtimeUnavailableTitle') : $t('terminal.disabledTitle')"
      :description="terminalAlertDescription"
    />

    <div v-if="status" class="security-grid">
      <div class="security-item">
        <span>{{ $t('terminal.runtimeIdentity') }}</span>
        <strong>{{ status.runtimeUser || $t('terminal.unavailable') }}</strong>
      </div>
      <div class="security-item">
        <span>{{ $t('terminal.permissionBoundary') }}</span>
        <strong>{{ $t('terminal.noSudoCapabilities') }}</strong>
      </div>
      <div class="security-item">
        <span>{{ $t('terminal.sessionLimit') }}</span>
        <strong>
          {{ $t('terminal.sessionLimitValue', { max: status.maxSessionMinutes, idle: status.idleMinutes, output: status.maxOutputMB }) }}
        </strong>
      </div>
      <div class="security-item">
        <span>{{ $t('terminal.concurrentSessions') }}</span>
        <strong>
          {{ $t('terminal.concurrentSessionsValue', { active: status.activeSessions, max: status.maxConcurrent, perUser: status.maxPerUser }) }}
        </strong>
      </div>
    </div>

    <div class="audit-notice">
      <el-icon><Lock /></el-icon>
      <div>
        <strong>{{ $t('terminal.auditEnabledTitle') }}</strong>
        <span>{{ $t('terminal.auditEnabledDescription') }}</span>
      </div>
    </div>

    <div class="terminal-shell" @mousedown="focusTerminal" @click="focusTerminal">
      <div class="terminal-shell__bar">
        <div class="window-dots"><i /><i /><i /></div>
        <span>{{ status?.runtimeUser || 'one-terminal' }}@panel</span>
        <span class="terminal-path">{{ status?.workingDirectory }}</span>
      </div>
      <div ref="terminalDiv" class="terminal-screen" />
      <div v-if="connectionState !== 'connected'" class="terminal-placeholder">
        <el-icon><Monitor /></el-icon>
        <strong>{{ status?.enabled ? $t('terminal.notConnected') : $t('terminal.closed') }}</strong>
        <span>{{ $t('terminal.passwordRequiredTip') }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Lock, Monitor } from '@element-plus/icons-vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { Api } from '@/api/Api'
import System from '@/utils/System'
import sapp from '@/sstore/sapp'
import i18n from '@/lang'

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

interface TerminalStatus {
  enabled: boolean
  isolationAvailable: boolean
  reason?: string
  runtimeUser: string
  workingDirectory: string
  maxSessionMinutes: number
  idleMinutes: number
  maxOutputMB: number
  maxConcurrent: number
  maxPerUser: number
  activeSessions: number
  commandAudit: boolean
  noNewPrivileges: boolean
  capabilities: string
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'closed'

const terminalDiv = ref<HTMLElement>()
const status = ref<TerminalStatus>()
const connecting = ref(false)
const connectionState = ref<ConnectionState>('disconnected')
let terminal: Terminal | undefined
let fitAddon: FitAddon | undefined
let socket: WebSocket | undefined
let resizeObserver: ResizeObserver | undefined
let statusTimer: number | undefined

const connectionLabel = computed(() => {
  switch (connectionState.value) {
    case 'connecting': return t('terminal.connection.authenticating', 'Authenticating')
    case 'connected': return t('terminal.connection.connected', 'Session connected')
    case 'closed': return t('terminal.connection.ended', 'Session ended')
    default: return t('terminal.connection.disconnected', 'Disconnected')
  }
})
const terminalAlertDescription = computed(() => {
  const reason = status.value?.reason || ''
  if (/Pane .*root|root .*管理进程|安全降权/i.test(reason)) {
    return t('terminal.reasons.paneRequiresRoot', 'Pane must be started by the root management process so terminal child processes can safely drop privileges')
  }
  return reason || t('terminal.enableInPanelTip', 'Enable terminal in Panel settings and reload.')
})

const encodeInput = (value: string) => {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach(byte => { binary += String.fromCharCode(byte) })
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

const loadStatus = async (quiet = false) => {
  try {
    const { data } = await Api.getTerminalStatus()
    status.value = data
  } catch {
    if (!quiet) ElMessage.error(t('terminal.statusReadFailed', 'Failed to read terminal security status'))
  }
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

const connectTerminal = async () => {
  if (connecting.value || connectionState.value === 'connected') return
  connecting.value = true
  connectionState.value = 'connecting'
  try {
    const { value: password } = await ElMessageBox.prompt(
      t('terminal.passwordPromptMessage', 'The terminal runs as an isolated low-privilege user. Enter the current administrator password to complete secondary authentication.'),
      t('terminal.passwordPromptTitle', 'Start secure terminal session'),
      {
        inputType: 'password',
        inputPlaceholder: t('terminal.adminPassword', 'Administrator password'),
        confirmButtonText: t('terminal.authenticateAndConnect', 'Authenticate and connect'),
        cancelButtonText: t('common.cancel', 'Cancel'),
        inputValidator: value => Boolean(value) || t('terminal.passwordRequired', 'Enter password')
      }
    )
    const { data } = await Api.createTerminalTicket({ password })
    const apiBase = new URL(System.env.API || '/v1', window.location.origin)
    if (apiBase.origin !== window.location.origin) {
      throw new Error(t('terminal.sameOriginOnly', 'Terminal only allows same-origin connections'))
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const apiPath = apiBase.pathname.replace(/\/$/, '')
    const url = `${protocol}//${window.location.host}${apiPath}/ssh/open?ticket=${encodeURIComponent(data.ticket)}`
    socket = new WebSocket(url)
    socket.onopen = () => {
      connectionState.value = 'connected'
      connecting.value = false
      sendSize()
      void loadStatus()
      void nextTick(() => {
        focusTerminal()
        window.setTimeout(focusTerminal, 80)
      })
    }
    socket.onmessage = event => {
      try {
        terminal?.write(decodeOutput(String(event.data)))
      } catch {
        terminal?.write(`\r\n\x1b[31m${t('terminal.outputDecodeFailed', 'Failed to decode terminal output.')}\x1b[0m\r\n`)
      }
    }
    socket.onerror = () => {
      ElMessage.error(t('terminal.connectionFailed', 'Secure terminal connection failed'))
    }
    socket.onclose = () => {
      connectionState.value = 'closed'
      connecting.value = false
      socket = undefined
      terminal?.write(`\r\n\x1b[33m${t('terminal.sessionClosedMessage', 'Terminal session closed.')}\x1b[0m\r\n`)
      void loadStatus()
    }
  } catch {
    connecting.value = false
    connectionState.value = 'disconnected'
  }
}

const disconnectTerminal = () => {
  socket?.close(1000, 'user closed terminal')
}

const initializeTerminal = async () => {
  await nextTick()
  terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: 'bar',
    cursorWidth: 2,
    convertEol: false,
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    fontSize: 14,
    lineHeight: 1.25,
    minimumContrastRatio: 7,
    scrollback: 5000,
    theme: {
      background: '#0b1220',
      foreground: '#f8fafc',
      cursor: sapp.accentColor,
      selectionBackground: '#415575',
      black: '#64748b',
      red: '#ff6b6b',
      green: '#55d187',
      yellow: '#f6c453',
      blue: '#69a7ff',
      magenta: '#c792ea',
      cyan: '#56cfe1',
      white: '#f8fafc',
      brightBlack: '#94a3b8',
      brightWhite: '#ffffff'
    }
  })
  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  if (terminalDiv.value) terminal.open(terminalDiv.value)
  fitAddon.fit()
  terminal.write('\x1b[1;38;5;255mOneinStack isolated terminal · waiting for authentication\x1b[0m\r\n')
  terminal.onData(data => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(encodeInput(data))
  })
  terminal.onResize(sendSize)
  if (terminalDiv.value) {
    resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon?.fit()
      } catch {
        // 抽屉或页面切换时容器可能暂时没有尺寸。
      }
    })
    resizeObserver.observe(terminalDiv.value)
  }
}

watch(
  () => sapp.accentColor,
  color => {
    if (!terminal) return
    terminal.options.theme = {
      ...terminal.options.theme,
      cursor: color
    }
  }
)

onMounted(async () => {
  await loadStatus()
  await initializeTerminal()
  statusTimer = window.setInterval(() => {
    void loadStatus(true)
  }, 15000)
})

onBeforeUnmount(() => {
  if (statusTimer !== undefined) window.clearInterval(statusTimer)
  resizeObserver?.disconnect()
  socket?.close(1000, 'terminal page closed')
  terminal?.dispose()
})
</script>

<style scoped lang="less">
.secure-terminal {
  display: flex;
  flex-direction: column;
  gap: 18px;
  height: calc(100vh - 150px);
  min-height: 0;
  overflow: hidden;
  padding: 22px;
}

.terminal-header {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;

  h2 {
    margin: 3px 0 6px;
    color: var(--text-primary);
    font-size: 25px;
  }

  p {
    margin: 0;
    color: var(--text-tertiary);
  }
}

.terminal-eyebrow {
  color: rgb(var(--primary-color));
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.18em;
}

.terminal-actions {
  display: flex;
  align-items: center;
  gap: 12px;
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

.terminal-alert {
  flex-shrink: 0;
  border-radius: 12px;
}

.security-grid {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-primary);
}

.security-item {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  padding: 16px 18px;
  border-right: 1px solid var(--border-subtle);

  &:last-child {
    border-right: 0;
  }

  span {
    color: var(--text-tertiary);
    font-size: 11px;
  }

  strong {
    overflow: hidden;
    color: var(--text-primary);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.audit-notice {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border: 1px solid rgb(60 130 246 / 18%);
  border-radius: 12px;
  color: #3b82f6;
  background: rgb(60 130 246 / 6%);

  .el-icon {
    font-size: 20px;
  }

  div {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  strong {
    color: var(--text-primary);
    font-size: 13px;
  }

  span {
    color: var(--text-tertiary);
    font-size: 11px;
  }
}

.terminal-shell {
  position: relative;
  flex: 1 1 auto;
  min-height: 280px;
  max-height: clamp(320px, 48vh, 560px);
  overflow: hidden;
  border: 1px solid #202b3d;
  border-radius: 15px;
  background: #0b1220;
  box-shadow: 0 18px 44px rgb(15 23 42 / 18%);

  &__bar {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 42px;
    padding: 0 15px;
    border-bottom: 1px solid #202b3d;
    color: #b7c5d9;
    background: #111a2a;
    font-family: monospace;
    font-size: 11px;
  }
}

.window-dots {
  display: flex;
  gap: 6px;

  i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #ff6b6b;

    &:nth-child(2) { background: #f6c453; }
    &:nth-child(3) { background: #55d187; }
  }
}

.terminal-path {
  overflow: hidden;
  margin-left: auto;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.terminal-screen {
  height: calc(100% - 42px);
  min-height: 0;
  overflow: hidden;
  padding: 12px 8px;
}

.terminal-screen :deep(.xterm) {
  height: 100%;
  color: #f8fafc;
}

.terminal-screen :deep(.xterm-rows) {
  text-shadow: 0 0 1px rgb(248 250 252 / 35%);
}

.terminal-screen :deep(.xterm-screen),
.terminal-screen :deep(.xterm-viewport) {
  max-height: 100%;
}

.terminal-screen :deep(.xterm-viewport) {
  overflow-y: auto !important;
}

.terminal-placeholder {
  position: absolute;
  inset: 42px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: #a9bad0;
  background: rgb(11 18 32 / 22%);
  pointer-events: none;

  .el-icon {
    font-size: 30px;
  }

  strong {
    color: #e2e8f0;
  }

  span {
    color: #b7c5d9;
    font-size: 12px;
  }
}

@media (max-width: 900px) {
  .terminal-header {
    flex-direction: column;
  }

  .security-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .security-item:nth-child(2) {
    border-right: 0;
  }
}

@media (max-width: 560px) {
  .secure-terminal {
    padding: 14px;
  }

  .security-grid {
    grid-template-columns: 1fr;
  }

  .security-item {
    border-right: 0;
    border-bottom: 1px solid var(--border-subtle);
  }

  .terminal-actions {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
  }
}
</style>
