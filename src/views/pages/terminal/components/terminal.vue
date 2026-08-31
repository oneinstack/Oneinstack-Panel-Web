<template>
  <section class="secure-terminal">
    <header class="terminal-header">
      <div>
        <div class="terminal-eyebrow">{{ $t('terminal.rootEyebrow') }}</div>
        <h2>{{ $t('terminal.rootTitle') }}</h2>
        <p>{{ $t('terminal.rootSubtitle') }}</p>
      </div>
      <div class="terminal-actions">
        <div v-if="status" class="terminal-hints">
          <el-popover placement="bottom-end" trigger="hover" :width="330">
            <template #reference>
              <button class="terminal-hint is-warning" type="button">
                <el-icon><WarningFilled /></el-icon>
                <span>{{ $t('terminal.rootPermission') }}</span>
              </button>
            </template>
            <div class="terminal-hint-content">
              <strong>{{ $t('terminal.rootPermissionTitle') }}</strong>
              <p>{{ $t('terminal.rootPermissionDescription') }}</p>
              <dl>
                <div><dt>{{ $t('terminal.runtimeIdentity') }}</dt><dd>{{ status.runtimeUser || $t('terminal.unavailable') }}</dd></div>
                <div>
                  <dt>{{ $t('terminal.sessionLimit') }}</dt>
                  <dd>{{ $t('terminal.sessionLimitValue', { max: status.maxSessionMinutes, idle: status.idleMinutes, output: status.maxOutputMB }) }}</dd>
                </div>
                <div>
                  <dt>{{ $t('terminal.concurrentSessions') }}</dt>
                  <dd>{{ $t('terminal.concurrentSessionsValue', { active: status.activeSessions, max: status.maxConcurrent, perUser: status.maxPerUser }) }}</dd>
                </div>
              </dl>
            </div>
          </el-popover>

          <el-popover placement="bottom-end" trigger="hover" :width="330">
            <template #reference>
              <button class="terminal-hint is-audit" type="button">
                <el-icon><Lock /></el-icon>
                <span>{{ $t('terminal.rootAudit') }}</span>
              </button>
            </template>
            <div class="terminal-hint-content">
              <strong>{{ $t('terminal.rootAuditTitle') }}</strong>
              <p>{{ $t('terminal.rootAuditDescription') }}</p>
            </div>
          </el-popover>
        </div>
        <span class="connection-state" :class="connectionState">
          <i />
          {{ connectionLabel }}
        </span>
        <el-button
          v-if="connectionState !== 'connected'"
          type="primary"
          :loading="connecting"
          :disabled="!status?.enabled || !terminalAvailable"
          @click="connectTerminal"
        >
          {{ $t('terminal.startRootSession') }}
        </el-button>
        <el-button v-else type="danger" plain @click="disconnectTerminal">
          {{ $t('terminal.disconnectSession') }}
        </el-button>
      </div>
    </header>

    <el-alert
      v-if="status && (!status.enabled || !terminalAvailable)"
      class="terminal-alert"
      type="warning"
      :closable="false"
      show-icon
      :title="status.enabled ? $t('terminal.runtimeUnavailableTitleRoot') : $t('terminal.disabledTitle')"
      :description="terminalAlertDescription"
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
          <button
            class="terminal-tool"
            type="button"
            :title="$t('terminal.copySelection')"
            @mousedown.stop
            @click.stop="copySelection"
          >
            <el-icon><CopyDocument /></el-icon>
          </button>
          <button
            class="terminal-tool"
            type="button"
            :title="$t('terminal.clearDisplay')"
            @mousedown.stop
            @click.stop="clearTerminal"
          >
            <el-icon><Delete /></el-icon>
          </button>
          <button
            class="terminal-tool"
            type="button"
            :title="isFullscreen ? $t('terminal.exitFullscreen') : $t('terminal.fullscreen')"
            @mousedown.stop
            @click.stop="toggleFullscreen"
          >
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
        <strong>{{ status?.enabled ? $t('terminal.notConnected') : $t('terminal.closed') }}</strong>
        <span>{{ $t('terminal.passwordRequiredTip') }}</span>
      </div>
      <div class="terminal-shell__footer">
        <div class="terminal-legend" :aria-label="$t('terminal.fileColorLegend')">
          <span><i class="is-directory" />{{ $t('terminal.directory') }}</span>
          <span><i class="is-executable" />{{ $t('terminal.executableFile') }}</span>
          <span><i class="is-archive" />{{ $t('terminal.archiveFile') }}</span>
          <span><i class="is-link" />{{ $t('terminal.symlink') }}</span>
          <span><i class="is-file" />{{ $t('terminal.regularFile') }}</span>
        </div>
        <div class="terminal-environment">
          <i :class="connectionState" />
          <span>UTF-8</span>
          <span>xterm-256color</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message-box/style/css'
import {
  CopyDocument,
  Delete,
  FolderOpened,
  FullScreen,
  Lock,
  Monitor,
  WarningFilled
} from '@element-plus/icons-vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { Api } from '@/api/modules'
import System from '@/utils/System'
import { useAppStore } from '@/stores/modules/app';
import i18n from '@/lang'

const sapp = useAppStore()

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

interface TerminalStatus {
  enabled: boolean
  available?: boolean
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
  privilegeMode?: string
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'closed'

const terminalDiv = ref<HTMLElement>()
const terminalShell = ref<HTMLElement>()
const status = ref<TerminalStatus>()
const connecting = ref(false)
const connectionState = ref<ConnectionState>('disconnected')
const terminalIdentity = ref('root@panel')
const currentPath = ref('/root')
const isFullscreen = ref(false)
let terminal: Terminal | undefined
let fitAddon: FitAddon | undefined
let socket: WebSocket | undefined
let resizeObserver: ResizeObserver | undefined
let statusTimer: number | undefined

const disableXtermTextareaSync = (instance: Terminal) => {
  const proto = Object.getPrototypeOf(instance) as any
  if (proto.__oneinstackTextareaSyncPatched) return
  // xterm continuously rewrites helper textarea inline styles for cursor sync.
  // Under a strict CSP this creates console noise and blocks the mutation.
  proto._syncTextArea = function _syncTextArea() {}
  proto.__oneinstackTextareaSyncPatched = true
}

const resetTerminalState = () => {
  terminalIdentity.value = 'root@panel'
  currentPath.value = '/root'
}

const terminalAvailable = computed(() =>
  Boolean(status.value?.available ?? status.value?.isolationAvailable)
)

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
  return new TextDecoder().decode(bytes)
}

const terminalFileTypeColors = {
  directory: '\x1b[38;2;98;168;255m',
  executable: '\x1b[38;2;80;216;144m',
  archive: '\x1b[38;2;255;107;122m',
  link: '\x1b[38;2;85;214;232m',
  file: '\x1b[38;2;216;226;240m'
} as const

const terminalAnsiReset = '\x1b[0m'
const terminalAnsiPattern = /\x1b\[[0-9;]*m/
const terminalArchivePattern = /\.(?:tar(?:\.(?:gz|bz2|xz))?|tgz|tbz|txz|gz|bz2|xz|zip|rar|7z)$/i
const terminalExecutablePattern = /\*$/i
const terminalSymlinkPattern = /@$/i
const terminalDirectoryPattern = /\/$/i

const splitTerminalToken = (token: string) => {
  const prefixMatch = token.match(/^[([<{'"`]+/)
  const suffixMatch = token.match(/[)\]}>.,;:!]+$/)
  const prefix = prefixMatch?.[0] || ''
  const suffix = suffixMatch?.[0] || ''
  const core = token.slice(prefix.length, token.length - suffix.length)
  return { prefix, core, suffix }
}

const detectTerminalFileType = (token: string) => {
  if (terminalDirectoryPattern.test(token)) return 'directory'
  if (terminalExecutablePattern.test(token)) return 'executable'
  if (terminalArchivePattern.test(token)) return 'archive'
  if (terminalSymlinkPattern.test(token)) return 'link'
  return 'file'
}

const colorizeTerminalListingLine = (line: string) => {
  if (terminalAnsiPattern.test(line)) return line

  const segments = line.split(/(\s+)/)
  const tokens = segments.filter(segment => segment.trim().length > 0)
  const looksLikeListing = tokens.length >= 2
    && !tokens.some(token => token === '#' || token === '$' || token === '%')
    && tokens.some(token =>
    terminalDirectoryPattern.test(token)
    || terminalExecutablePattern.test(token)
    || terminalArchivePattern.test(token)
    || terminalSymlinkPattern.test(token)
  )

  if (!looksLikeListing) return line

  return segments.map((segment) => {
    if (!segment.trim()) return segment
    const { prefix, core, suffix } = splitTerminalToken(segment)
    const fileType = detectTerminalFileType(core)
    const color = terminalFileTypeColors[fileType]
    return `${prefix}${color}${core}${terminalAnsiReset}${suffix}`
  }).join('')
}

const colorizeTerminalOutput = (value: string) =>
  value.replace(/[^\r\n]+/g, line => colorizeTerminalListingLine(line))

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

const fitTerminal = () => {
  const addon = fitAddon
  if (!addon || !terminalDiv.value) return
  window.requestAnimationFrame(() => {
    try {
      addon.fit()
      sendSize()
    } catch {
      // The terminal container may still be in transition; the next resize will fix it.
    }
  })
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
    ElMessage.info(t('terminal.selectTextFirst', 'Select text in the terminal before copying'))
    return
  }
  try {
    await writeClipboard(value)
    ElMessage.success(t('terminal.copiedSelection', 'Selected text copied'))
  } catch {
    ElMessage.error(t('terminal.copyFailed', 'Copy failed. Use the system copy shortcut.'))
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
    ElMessage.warning(t('terminal.fullscreenUnsupported', 'This browser does not support terminal fullscreen display'))
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = document.fullscreenElement === terminalShell.value
  window.setTimeout(fitTerminal, 80)
}

const syncTerminalTitle = (title: string) => {
  const separator = title.indexOf(':')
  if (separator <= 0) return
  terminalIdentity.value = title.slice(0, separator)
  currentPath.value = title.slice(separator + 1) || '/'
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
    await initializeTerminal()
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
        terminal?.write(colorizeTerminalOutput(decodeOutput(String(event.data))))
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
      destroyTerminal()
      void loadStatus()
    }
  } catch {
    connecting.value = false
    connectionState.value = 'disconnected'
    destroyTerminal()
  }
}

const disconnectTerminal = () => {
  socket?.close(1000, 'user closed terminal')
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
    // ANSI 颜色由下方编译期色板提供，避免 xterm 生成的运行时样式被 CSP 拦截。
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
  disableXtermTextareaSync(terminal)
  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.open(terminalDiv.value)
  fitTerminal()
  terminal.write(`\x1b[1;38;5;45mOneinStack Root Console\x1b[0m \x1b[38;5;245m· ${t('terminal.waitingAuthenticationBanner')}\x1b[0m\r\n`)
  terminal.onTitleChange(syncTerminalTitle)
  terminal.onData(data => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(encodeInput(data))
  })
  terminal.onResize(sendSize)
  if (terminalDiv.value) {
    resizeObserver = new ResizeObserver(() => {
      fitTerminal()
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
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  await loadStatus()
  resetTerminalState()
  statusTimer = window.setInterval(() => {
    void loadStatus(true)
  }, 15000)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (statusTimer !== undefined) window.clearInterval(statusTimer)
  socket?.close(1000, 'terminal page closed')
  destroyTerminal()
})
</script>

<style scoped lang="less">
.secure-terminal {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  overflow: hidden;
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

.terminal-hints {
  display: flex;
  align-items: center;
  gap: 7px;
}

.terminal-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  color: var(--text-secondary);
  background: var(--surface-primary);
  font-size: 11px;
  cursor: help;
  transition: 0.18s ease;

  &:hover,
  &:focus-visible {
    border-color: rgb(var(--primary-color) / 32%);
    color: rgb(var(--primary-color));
    background: rgb(var(--primary-color) / 6%);
    outline: none;
  }

  &.is-warning .el-icon {
    color: #f59e0b;
  }

  &.is-audit .el-icon {
    color: #3b82f6;
  }
}

.terminal-hint-content {
  color: var(--text-secondary);

  strong {
    display: block;
    margin-bottom: 7px;
    color: var(--text-primary);
    font-size: 13px;
  }

  p {
    margin: 0;
    color: var(--text-tertiary);
    font-size: 11px;
    line-height: 1.65;
  }

  dl {
    display: grid;
    gap: 7px;
    margin: 12px 0 0;
    padding-top: 10px;
    border-top: 1px solid var(--border-subtle);
  }

  dl div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }

  dt {
    color: var(--text-tertiary);
    font-size: 10px;
  }

  dd {
    margin: 0;
    color: var(--text-primary);
    font-size: 11px;
    font-weight: 650;
    text-align: right;
  }
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

.terminal-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
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
  padding-left: 2px;

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

  div {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  strong {
    color: #e5edf8;
    font-family: "SFMono-Regular", Consolas, monospace;
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
  max-width: min(36vw, 440px);
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 11px;
  overflow: hidden;
  border: 1px solid #293950;
  border-radius: 8px;
  color: #92bdf7;
  background: rgb(6 14 27 / 42%);

  .el-icon {
    flex-shrink: 0;
    color: #62a8ff;
    font-size: 13px;
  }

  span {
    overflow: hidden;
    font-family: "SFMono-Regular", Consolas, monospace;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.terminal-tool {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  color: #91a1b7;
  background: transparent;
  cursor: pointer;
  transition: 0.18s ease;

  &:hover {
    border-color: #31445e;
    color: #e5edf8;
    background: #1b2a40;
  }

  &:active {
    transform: translateY(1px);
  }

  .el-icon {
    font-size: 14px;
  }
}

.terminal-screen {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  transition: filter 180ms ease, opacity 180ms ease;

  &.is-blurred {
    filter: blur(3px);
    opacity: 0.42;
  }
}

.terminal-screen :deep(.xterm) {
  box-sizing: border-box;
  height: 100%;
  color: #d8e2f0;
}

.terminal-screen :deep(.xterm-rows) {
  color: #d8e2f0;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 14px;
  font-kerning: none;
  white-space: pre;
  text-shadow: 0 0 1px rgb(216 226 240 / 18%);
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
// palette at build time instead; this keeps the strict CSP and makes every
// standard shell color visible.
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

.terminal-screen :deep(.xterm-screen),
.terminal-screen :deep(.xterm-viewport) {
  height: 100%;
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

.terminal-placeholder {
  position: absolute;
  inset: 54px 0 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: #a9bad0;
  background: rgb(8 17 31 / 36%);
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

  i {
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

  span + span {
    padding-left: 9px;
    border-left: 1px solid #29364a;
  }
}

@media (max-width: 900px) {
  .terminal-header {
    flex-direction: column;
  }

  .terminal-legend span:nth-child(n + 4) {
    display: none;
  }
}

@media (max-width: 560px) {
  .terminal-actions {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
  }

  .terminal-hints {
    justify-content: flex-end;
    width: 100%;
  }

  .terminal-shell {
    min-height: 0;
  }

  .terminal-identity small,
  .terminal-legend {
    display: none;
  }

  .terminal-path {
    max-width: 34vw;
  }

  .terminal-shell__footer {
    justify-content: flex-end;
  }
}
</style>
