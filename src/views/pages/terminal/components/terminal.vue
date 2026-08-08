<template>
  <section class="secure-terminal">
    <header class="terminal-header">
      <div>
        <div class="terminal-eyebrow">ROOT WEB SHELL</div>
        <h2>服务器终端</h2>
        <p>以 root 用户运行，可直接执行完整的服务器管理操作。</p>
      </div>
      <div class="terminal-actions">
        <div v-if="status" class="terminal-hints">
          <el-popover placement="bottom-end" trigger="hover" :width="330">
            <template #reference>
              <button class="terminal-hint is-warning" type="button">
                <el-icon><WarningFilled /></el-icon>
                <span>Root 权限</span>
              </button>
            </template>
            <div class="terminal-hint-content">
              <strong>当前终端拥有完整 Root 权限</strong>
              <p>可以修改全部系统资源，请在执行删除、覆盖和权限变更命令前确认目标。</p>
              <dl>
                <div><dt>运行身份</dt><dd>{{ status.runtimeUser || '不可用' }}</dd></div>
                <div>
                  <dt>会话限制</dt>
                  <dd>{{ status.maxSessionMinutes }} 分钟 · 空闲 {{ status.idleMinutes }} 分钟</dd>
                </div>
                <div>
                  <dt>并发会话</dt>
                  <dd>全局 {{ status.activeSessions }} / {{ status.maxConcurrent }} · 单账号 {{ status.maxPerUser }}</dd>
                </div>
              </dl>
            </div>
          </el-popover>

          <el-popover placement="bottom-end" trigger="hover" :width="330">
            <template #reference>
              <button class="terminal-hint is-audit" type="button">
                <el-icon><Lock /></el-icon>
                <span>会话审计</span>
              </button>
            </template>
            <div class="terminal-hint-content">
              <strong>Root 会话审计已开启</strong>
              <p>记录会话、命令提交时间、操作者和脱敏后的指令；不保存交互式密码输入和终端输出。</p>
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
          建立 Root 会话
        </el-button>
        <el-button v-else type="danger" plain @click="disconnectTerminal">
          断开会话
        </el-button>
      </div>
    </header>

    <el-alert
      v-if="status && (!status.enabled || !terminalAvailable)"
      class="terminal-alert"
      type="warning"
      :closable="false"
      show-icon
      :title="status.enabled ? '终端运行环境不可用' : 'Web 终端当前未启用'"
      :description="status.reason || '请在 Panel 配置中启用终端后重新加载。'"
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
          <div class="terminal-path" title="当前工作目录">
            <el-icon><FolderOpened /></el-icon>
            <span>{{ currentPath }}</span>
          </div>
          <button
            class="terminal-tool"
            type="button"
            title="复制选中内容"
            @mousedown.stop
            @click.stop="copySelection"
          >
            <el-icon><CopyDocument /></el-icon>
          </button>
          <button
            class="terminal-tool"
            type="button"
            title="清空终端显示"
            @mousedown.stop
            @click.stop="clearTerminal"
          >
            <el-icon><Delete /></el-icon>
          </button>
          <button
            class="terminal-tool"
            type="button"
            :title="isFullscreen ? '退出全屏' : '全屏显示'"
            @mousedown.stop
            @click.stop="toggleFullscreen"
          >
            <el-icon><FullScreen /></el-icon>
          </button>
        </div>
      </div>
      <div ref="terminalDiv" class="terminal-screen" />
      <div v-if="connectionState !== 'connected'" class="terminal-placeholder">
        <el-icon><Monitor /></el-icon>
        <strong>{{ status?.enabled ? '终端尚未连接' : '终端已关闭' }}</strong>
        <span>连接时需要再次输入当前管理员密码。</span>
      </div>
      <div class="terminal-shell__footer">
        <div class="terminal-legend" aria-label="文件类型颜色说明">
          <span><i class="is-directory" />目录</span>
          <span><i class="is-executable" />可执行文件</span>
          <span><i class="is-archive" />压缩包</span>
          <span><i class="is-link" />链接</span>
          <span><i class="is-file" />普通文件</span>
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
import { Api } from '@/api/Api'
import System from '@/utils/System'
import sapp from '@/sstore/sapp'

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

const terminalAvailable = computed(() =>
  Boolean(status.value?.available ?? status.value?.isolationAvailable)
)

const connectionLabel = computed(() => {
  switch (connectionState.value) {
    case 'connecting': return '正在认证'
    case 'connected': return '会话已连接'
    case 'closed': return '会话已结束'
    default: return '未连接'
  }
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
    if (!quiet) ElMessage.error('读取终端状态失败')
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
    ElMessage.info('请先在终端中选中需要复制的内容')
    return
  }
  try {
    await writeClipboard(value)
    ElMessage.success('已复制选中内容')
  } catch {
    ElMessage.error('复制失败，请使用系统复制快捷键')
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
    ElMessage.warning('当前浏览器不支持终端全屏显示')
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = document.fullscreenElement === terminalShell.value
  window.setTimeout(() => {
    try {
      fitAddon?.fit()
      sendSize()
    } catch {
      // 全屏布局切换期间容器尺寸可能尚未稳定。
    }
  }, 80)
}

const syncTerminalTitle = (title: string) => {
  const separator = title.indexOf(':')
  if (separator <= 0) return
  terminalIdentity.value = title.slice(0, separator)
  currentPath.value = title.slice(separator + 1) || '/'
}

const connectTerminal = async () => {
  if (connecting.value || connectionState.value === 'connected') return
  connecting.value = true
  connectionState.value = 'connecting'
  try {
    const { value: password } = await ElMessageBox.prompt(
      '终端将以 root 用户运行并拥有完整系统权限。请输入当前管理员密码完成二次认证。',
      '建立 Root 终端会话',
      {
        inputType: 'password',
        inputPlaceholder: '管理员密码',
        confirmButtonText: '认证并连接',
        cancelButtonText: '取消',
        inputValidator: value => Boolean(value) || '请输入密码'
      }
    )
    const { data } = await Api.createTerminalTicket({ password })
    const apiBase = new URL(System.env.API || '/v1', window.location.origin)
    if (apiBase.origin !== window.location.origin) {
      throw new Error('终端只允许同源连接')
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
        terminal?.write('\r\n\x1b[31m无法解析终端输出。\x1b[0m\r\n')
      }
    }
    socket.onerror = () => {
      ElMessage.error('Root 终端连接失败')
    }
    socket.onclose = () => {
      connectionState.value = 'closed'
      connecting.value = false
      socket = undefined
      terminal?.write('\r\n\x1b[33m终端会话已关闭。\x1b[0m\r\n')
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
    letterSpacing: 0.15,
    lineHeight: 1.35,
    // ANSI colors are provided by the compile-time palette below. Keeping the
    // ratio at 1 prevents xterm from replacing palette classes with CSP-blocked
    // runtime inline colors.
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
  terminal.write('\x1b[1;38;5;45mOneinStack Root Console\x1b[0m \x1b[38;5;245m· 等待身份认证\x1b[0m\r\n')
  terminal.onTitleChange(syncTerminalTitle)
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
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  await loadStatus()
  await initializeTerminal()
  statusTimer = window.setInterval(() => {
    void loadStatus(true)
  }, 15000)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
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
  flex: 1 1 auto;
  min-height: 360px;
  max-height: clamp(420px, 56vh, 680px);
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
  height: calc(100% - 88px);
  min-height: 0;
  overflow: hidden;
  padding: 15px 11px 12px;
}

.terminal-screen :deep(.xterm) {
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

.terminal-screen :deep(.xterm-rows span) {
  display: inline-block;
  height: 100%;
  vertical-align: top;
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

.terminal-screen :deep(.xterm-cursor-bar) {
  box-shadow: 2px 0 0 rgb(var(--primary-color)) inset !important;
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
  .secure-terminal {
    padding: 14px;
  }

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
    min-height: 400px;
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
