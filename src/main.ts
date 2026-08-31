import 'tools-css/index.css'
import 'tools-javascript'
// 程序式组件不会出现在模板中，生产构建无法通过按需扫描自动补齐样式。
import 'element-plus/es/components/loading/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import { createApp } from 'vue'

import App from './App.vue'
import './styles/index.less'
import Config from './utils/Config'

const CHUNK_RELOAD_FLAG = '__oneinstack_chunk_reload__'

const shouldReloadForChunkFailure = (reason: unknown) => {
  if (!reason) return false
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : typeof reason === 'object' && reason && 'message' in reason
          ? String((reason as { message?: unknown }).message || '')
          : ''
  return [
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'ChunkLoadError'
  ].some((text) => message.includes(text))
}

const reloadOnceForChunkFailure = () => {
  if (sessionStorage.getItem(CHUNK_RELOAD_FLAG)) return
  sessionStorage.setItem(CHUNK_RELOAD_FLAG, '1')
  window.location.reload()
}

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  reloadOnceForChunkFailure()
})

window.addEventListener('unhandledrejection', (event) => {
  if (!shouldReloadForChunkFailure(event.reason)) return
  event.preventDefault()
  reloadOnceForChunkFailure()
})

const app = createApp(App)
//#ifvar-dev
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
app.use(ElementPlus)

//#endvar
Config.init(app)
