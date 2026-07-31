<script setup lang="ts">
import { Api } from '@/api/Api'
import CustomDialog from '@/components/custom-dialog.vue'
import CustomTable from '@/components/custom-table.vue'
import sutil from '@/sstore/sutil'
import {
  Refresh,
  Search,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Delete,
  CopyDocument,
  Scissor,
  EditPen,
  Lock,
  Files,
  MoreFilled,
  FolderOpened,
  Operation,
  Star,
  Share,
  InfoFilled,
  Download,
  PictureFilled,
  View
} from '@element-plus/icons-vue'
import { ElMessage, FormInstance, UploadFile, UploadInstance } from 'element-plus'
import { nextTick, onMounted, reactive, useTemplateRef } from 'vue'
import type { DrawerType, DrawerOpenType } from '../index.vue'
import System from '@/utils/System'
import { formatBytes } from '@/utils/fileSize'
import FileSearchDialog from './FileSearchDialog.vue'
import FileOperationDrawer from './FileOperationDrawer.vue'
import FileEditorDrawer from './FileEditorDrawer.vue'

interface Emits {
  (e: 'update:path', value: string[]): void
  (e: 'open-drawer', openType: DrawerOpenType, type: DrawerType, row?: any): void
  (e: 'open-trash'): void
}

const emit = defineEmits<Emits>()

type ClipboardMode = '' | 'copy' | 'move'
type FavoriteItem = {
  id?: number
  path: string
  name: string
  isDir: boolean
  isMissing?: boolean
}

const imageExtensionPattern = /\.(avif|bmp|gif|ico|jpe?g|png|webp)$/i
const currentPath = () => conf.path.join('/').replace(/\/\//g, '/')
const normalizeBool = (value: any) => value === true || value === 1 || value === '1' || value === 'true'
const joinVirtualPath = (dir: string, name: string) => `${dir === '/' ? '' : dir}/${name}`
const toCopyName = (name: string) => {
  const dotIndex = name.lastIndexOf('.')
  if (dotIndex <= 0) return `${name}-copy`
  return `${name.slice(0, dotIndex)}-copy${name.slice(dotIndex)}`
}
const parentPath = (path: string) => {
  const clean = path.replace(/\/+$/, '')
  const index = clean.lastIndexOf('/')
  return index <= 0 ? '/' : clean.slice(0, index)
}
const parseDownloadFilename = (disposition: string, fallback: string) => {
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (encodedName) return decodeURIComponent(encodedName)
  const plainName = disposition.match(/filename="?([^"]+)"?/i)?.[1]
  return plainName || fallback
}
const triggerBlobDownload = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
const releasePreviewUrl = () => {
  if (!conf.imagePreview.url?.startsWith('blob:')) return
  URL.revokeObjectURL(conf.imagePreview.url)
}
const downloadVirtualFile = async (path: string, fallbackName: string) => {
  const apiBase = String(System.env.API || '/v1').replace(/\/$/, '')
  const response = await fetch(`${apiBase}/ftp/download`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/octet-stream',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ path })
  })
  const contentType = response.headers.get('content-type') || ''
  if (!response.ok || contentType.includes('application/json')) {
    let message = `文件下载失败（HTTP ${response.status}）`
    try {
      const payload = await response.json()
      message = payload?.message || payload?.error?.message || message
    } catch {
      // Keep the HTTP status based fallback message.
    }
    throw new Error(message)
  }
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') || response.headers.get('content-disposition') || ''
  const filename = parseDownloadFilename(disposition, fallbackName)
  triggerBlobDownload(blob, filename)
}
const loadImagePreviewUrl = async (path: string) => {
  const apiBase = String(System.env.API || '/v1').replace(/\/$/, '')
  const response = await fetch(`${apiBase}/ftp/download`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'image/*,application/octet-stream',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ path })
  })
  const contentType = response.headers.get('content-type') || ''
  if (!response.ok || contentType.includes('application/json')) {
    let message = `图片读取失败（HTTP ${response.status}）`
    try {
      const payload = await response.json()
      message = payload?.message || payload?.error?.message || message
    } catch {
      // Keep the HTTP status based fallback message.
    }
    throw new Error(message)
  }
  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) {
    throw new Error('当前文件不是受支持的图片格式')
  }
  return URL.createObjectURL(blob)
}

const conf = reactive({
  tipPaste: '',
  path: ['/'],
  searchVisible: false,
  operationsVisible: false,
  editorVisible: false,
  editorPath: '',
  editorDetail: null as any,
  editorLoadingPath: '',
  imagePreview: {
    show: false,
    row: null as any,
    url: '',
    loading: false,
    error: false,
    open: async (row: any) => {
      conf.imagePreview.row = row
      conf.imagePreview.error = false
      conf.imagePreview.loading = true
      conf.imagePreview.show = true
      try {
        releasePreviewUrl()
        conf.imagePreview.url = await loadImagePreviewUrl(row.path)
      } catch {
        conf.imagePreview.loading = false
        conf.imagePreview.error = true
      }
    },
    close: () => {
      releasePreviewUrl()
      conf.imagePreview.show = false
      conf.imagePreview.loading = false
      conf.imagePreview.error = false
      conf.imagePreview.url = ''
      conf.imagePreview.row = null
    }
  },
  columns: [
    { prop: 'name', label: '文件名称', minWidth: '250', sortable: true },
    { prop: 'identity', label: '权限 / 所有者', width: '170' },
    { prop: 'size', label: '大小', width: '120', sortable: true },
    { prop: 'modTime', label: '修改时间', width: '180', sortable: true },
    { prop: 'action', label: '操作', minWidth: '390' }
  ],
  fileList: [],
  clipboard: {
    mode: '' as ClipboardMode,
    source: null as any
  },
  copyDialog: {
    show: false,
    overwrite: false,
    targetPath: '',
    open: () => {
      if (!conf.clipboard.source) return
      conf.copyDialog.overwrite = false
      conf.copyDialog.targetPath = joinVirtualPath(currentPath(), toCopyName(conf.clipboard.source.name))
      conf.copyDialog.show = true
    },
    close: () => {
      conf.copyDialog.show = false
      conf.copyDialog.overwrite = false
      conf.copyDialog.targetPath = ''
    },
    confirm: async () => {
      if (!conf.clipboard.source || conf.clipboard.mode !== 'copy') return
      await Api.copyFile({
        sourcePath: conf.clipboard.source.path,
        targetPath: conf.copyDialog.targetPath,
        overwrite: conf.copyDialog.overwrite
      })
      ElMessage.success('复制完成')
      conf.copyDialog.close()
      conf.refresh()
    }
  },
  favorites: [] as FavoriteItem[],
  favoritesLoading: false,
  capacity: null as any,
  rootPath: '/',
  loading: false,
  getCapacity: async () => {
    const { data } = await Api.getFileCapacity()
    conf.capacity = data.capacity
    conf.rootPath = data.rootPath || '/'
  },
  getFileList: async (refresh = false) => {
    if (!refresh) emit('update:path', conf.path)
    const path = currentPath()
    conf.loading = true
    const { data: res } = await Api.getFileList({
      path,
      final: (isSuccess: boolean) => {
        conf.loading = false
        if (!isSuccess) return conf.handleBackLevel()
      }
    })
    conf.fileList = res.files ?? []
  },
  refresh: () => {
    conf.getFileList(true)
    conf.getCapacity()
  },
  handleFileClick: (row: any) => {
    if (!row.isDir) {
      if (conf.isImage(row)) {
        conf.imagePreview.open(row)
        return
      }
      conf.openEditor(row)
      return
    }
    conf.path.push(row.name)
    conf.getFileList()
  },
  openEditor: async (row: any) => {
    if (!row?.path) return
    conf.editorLoadingPath = row.path
    conf.editorDetail = null
    try {
      const { data } = await Api.getFileContent({ path: row.path })
      conf.editorPath = row.path
      conf.editorDetail = data
      conf.editorVisible = true
    } catch {
      // HttpConfig already shows the backend error once; keep the editor closed.
    } finally {
      conf.editorLoadingPath = ''
    }
  },
  handleBackLevel: (index = conf.path.length - 2) => {
    if (conf.path.length === 1) return
    conf.path = conf.path.slice(0, index + 1)
    conf.getFileList()
  },
  inputPath: '',
  isInputPath: false,
  inputPathRef: useTemplateRef<HTMLInputElement>('inputPathRef'),
  handleClickOutside: (e: MouseEvent) => {
    if (e.target === conf.inputPathRef) return
    conf.isInputPath = false
    window.removeEventListener('click', conf.handleClickOutside)
  },
  handleInputPath: () => {
    conf.isInputPath = true
    conf.inputPath = conf.path.join('/').replace(/\/\//g, '/')
    nextTick(() => {
      conf.inputPathRef?.focus()
      window.addEventListener('click', conf.handleClickOutside)
    })
  },
  handleInputPathConfirm: () => {
    if (!sutil.matchFilePath(conf.inputPath) && conf.inputPath !== '/') return ElMessage.error('请输入正确的文件路径')
    conf.isInputPath = false
    conf.path = conf.inputPath === '/' ? ['/'] : conf.inputPath.split('/').map((item) => (item === '' ? '/' : item))
    conf.getFileList()
  },
  handleNavigate: (path: string) => {
    const normalized = path.trim() || '/'
    conf.path =
      normalized === '/'
        ? ['/']
        : normalized.split('/').map((item) => (item === '' ? '/' : item))
    conf.getFileList()
  },
  handleOpenDrawer: (openType: DrawerOpenType, type: DrawerType, row?: any) => {
    emit('open-drawer', openType, type, row)
  },
  handleFileDownload: async (row: any) => {
    await downloadVirtualFile(row.path, row.name)
    ElMessage.success('下载成功！')
  },
  isImage: (row: any) => !row?.isDir && imageExtensionPattern.test(row?.name || ''),
  setClipboard: (mode: Exclude<ClipboardMode, ''>, row: any) => {
    conf.clipboard.mode = mode
    conf.clipboard.source = {
      path: row.path,
      name: row.name,
      isDir: row.isDir
    }
    ElMessage.success(mode === 'copy' ? '已复制到文件剪贴板' : '已剪切到文件剪贴板')
    conf.tipPaste = mode === 'copy' ? '粘贴到当前目录' : '剪切到当前目录'
  },
  clearClipboard: () => {
    conf.clipboard.mode = ''
    conf.clipboard.source = null
  },
  pasteClipboard: async () => {
    if (!conf.clipboard.source || !conf.clipboard.mode) return
    if (conf.clipboard.mode === 'copy') {
      conf.copyDialog.open()
      return
    }
    await Api.moveFile({
      sourcePath: conf.clipboard.source.path,
      targetPath: joinVirtualPath(currentPath(), conf.clipboard.source.name)
    })
    ElMessage.success('剪切完成')
    conf.clearClipboard()
    conf.refresh()
  },
  loadFavorites: async () => {
    conf.favoritesLoading = true
    try {
      const { data } = await Api.getFileFavorites()
      const items = Array.isArray(data?.items) ? data.items : []
      conf.favorites = items.map((item: any) => ({
        id: item.id,
        path: item.path,
        name: item.name || item.path?.split('/').pop() || item.path,
        isDir: normalizeBool(item.isDir),
        isMissing: normalizeBool(item.isMissing)
      }))
    } catch {
      conf.favorites = []
    } finally {
      conf.favoritesLoading = false
    }
  },
  isFavorite: (path: string) => conf.favorites.some((item) => item.path === path),
  toggleFavorite: async (row: any) => {
    const item = conf.favorites.find((favorite) => favorite.path === row.path)
    if (item) {
      await Api.cancelFileFavorite({ path: item.path })
      ElMessage.success('已取消收藏')
    } else {
      await Api.favoriteFile({ path: row.path })
      ElMessage.success('已添加到收藏夹')
    }
    await conf.loadFavorites()
  },
  openFavorite: (item: FavoriteItem) => {
    if (item.isMissing) {
      ElMessage.warning('该收藏路径已失效')
      return
    }
    if (item.isDir) {
      conf.handleNavigate(item.path)
      return
    }
    conf.handleNavigate(parentPath(item.path))
    ElMessage.success('已打开收藏文件所在目录')
  },
  openInNewWindow: (row: any) => {
    const params = new URLSearchParams({
      path: row.isDir ? row.path : parentPath(row.path)
    })
    if (!row.isDir) params.set('file', row.path)
    window.open(
      `${window.location.origin}${window.location.pathname}#/file?${params.toString()}`,
      '_blank',
      'noopener,noreferrer'
    )
  },
  fileDialog: {
    row: {} as any,
    show: false,
    type: 'delete',
    title: '删除文件',
    confirmText: '确定',
    cancelText: '取消',
    open: (type: 'delete' | 'upload' | 'linkDownload', row?: any) => {
      switch (type) {
        case 'delete':
          conf.fileDialog.row = row
          conf.fileDialog.title = '删除文件'
          conf.fileDialog.confirmText = '确定'
          break
        case 'upload':
          const path = conf.path.join('/').replace(/\/\//g, '/')
          conf.fileDialog.row = {
            path
          }
          conf.fileDialog.title = `上传文件到[${path}]`
          conf.fileDialog.confirmText = '开始上传'
          break
        case 'linkDownload':
          const downloadPath = conf.path.join('/').replace(/\/\//g, '/')
          conf.fileDialog.row = {
            path: downloadPath,
            name: '',
            url: ''
          }
          conf.fileDialog.title = `URL链接下载`
          conf.fileDialog.confirmText = '确定'
          break
      }
      conf.fileDialog.type = type
      conf.fileDialog.show = true
    },
    close: () => {
      conf.fileDialog.show = false
      conf.fileDialog.row = {}
      conf.upload.instance?.clearFiles()
      conf.linkDownload.instance?.resetFields()
      conf.linkDownload.instance?.clearValidate()
    },
    confirm: async () => {
      if (conf.fileDialog.type === 'upload') return conf.upload.instance?.submit()
      if (conf.fileDialog.type === 'linkDownload') {
        const res = await conf.linkDownload.instance?.validate()
        if (!res) return
        await Api.urlDownloadFile(conf.fileDialog.row)
        ElMessage.success('下载任务已完成')
        conf.fileDialog.close()
        conf.refresh()
        return
      }
      const path = conf.path.join('/').replace(/\/\//g, '/')
      await Api.deleteFile({
        path: `${path === '/' ? '' : path}/${conf.fileDialog.row.name}`
      })
      ElMessage.success('已移入回收站')
      conf.fileDialog.close()
      conf.refresh()
    }
  },
  operationDialog: {
    show: false,
    type: '' as 'rename' | 'archive' | 'properties' | 'share' | '',
    title: '',
    row: {} as any,
    value: '',
    properties: null as any,
    expiryHours: 24,
    shareUrl: '',
    loading: false,
    open: async (type: 'rename' | 'archive' | 'properties' | 'share', row: any) => {
      conf.operationDialog.type = type
      conf.operationDialog.row = row
      conf.operationDialog.value = ''
      conf.operationDialog.properties = null
      conf.operationDialog.expiryHours = 24
      conf.operationDialog.shareUrl = ''
      conf.operationDialog.show = true
      if (type === 'rename') {
        conf.operationDialog.title = '重命名'
        conf.operationDialog.value = row.name
      } else if (type === 'archive') {
        conf.operationDialog.title = '创建压缩包'
        conf.operationDialog.value = `${row.name}.tar.gz`
      } else if (type === 'share') {
        conf.operationDialog.title = '外链分享'
      } else {
        conf.operationDialog.title = '文件属性'
        conf.operationDialog.loading = true
        try {
          const { data } = await Api.getFileProperties({ path: row.path })
          conf.operationDialog.properties = data
        } finally {
          conf.operationDialog.loading = false
        }
      }
    },
    close: () => {
      conf.operationDialog.show = false
      conf.operationDialog.row = {}
      conf.operationDialog.properties = null
      conf.operationDialog.shareUrl = ''
    },
    confirm: async () => {
      const dialog = conf.operationDialog
      if (dialog.type === 'properties') {
        dialog.close()
        return
      }
      if (dialog.type === 'rename') {
        const name = dialog.value.trim()
        if (!name) return ElMessage.warning('请输入新名称')
        await Api.renameFile({ path: dialog.row.path, newName: name })
        ElMessage.success('重命名成功')
        dialog.close()
        conf.refresh()
        return
      }
      if (dialog.type === 'archive') {
        const archiveName = dialog.value.trim()
        if (!archiveName.endsWith('.tar.gz')) return ElMessage.warning('压缩包名称必须以 .tar.gz 结尾')
        await Api.archiveFile({
          path: dialog.row.path,
          targetDir: currentPath(),
          archiveName
        })
        ElMessage.success('压缩包创建成功')
        dialog.close()
        conf.refresh()
        return
      }
      if (dialog.type === 'share') {
        const { data } = await Api.createFileShare({
          path: dialog.row.path,
          expiryHours: dialog.expiryHours
        })
        dialog.shareUrl = `${window.location.origin}${data.downloadUrl}`
        await navigator.clipboard?.writeText(dialog.shareUrl)
        ElMessage.success('外链已创建并复制')
      }
    },
    copyShareUrl: async () => {
      if (!conf.operationDialog.shareUrl) return
      await navigator.clipboard.writeText(conf.operationDialog.shareUrl)
      ElMessage.success('分享链接已复制')
    }
  },
  upload: {
    instance: useTemplateRef<UploadInstance>('uploadRef'),
    onChange: ({ status, response: res }: UploadFile) => {
      if (status === 'success') ElMessage.success((res as any).data)
      else if (status === 'fail') ElMessage.error((res as any).data)
      else return
      conf.refresh()
      conf.fileDialog.close()
    },
    handleOpenDialog: () => {
      if (conf.path.length === 1) return ElMessage.error('不能直接上传文件到系统根目录!')
      conf.fileDialog.open('upload')
    }
  },
  linkDownload: {
    instance: useTemplateRef<FormInstance>('formRef')
  },
  treeDialog: {
    show: false,
    path: '/',
    isDir: true,
    key: 0,
    open: (row?: any) => {
      conf.treeDialog.path = row?.path || currentPath()
      conf.treeDialog.isDir = true
      conf.treeDialog.key += 1
      conf.treeDialog.show = true
    },
    select: (node: any) => {
      conf.treeDialog.path = node.path
      conf.treeDialog.isDir = Boolean(node.isDir)
    },
    confirm: () => {
      if (!conf.treeDialog.isDir) return ElMessage.warning('请选择目录')
      conf.handleNavigate(conf.treeDialog.path || '/')
      conf.treeDialog.show = false
    }
  },
  selectFolder: {
    show: false,
    path: '',
    open: () => {
      conf.selectFolder.show = true
    },
    select: (node: any) => {
      if (!node.isDir) return
      conf.selectFolder.path = node.path
    },
    confirm: () => {
      conf.fileDialog.row.path = conf.selectFolder.path
      conf.selectFolder.show = false
    }
  }
})

onMounted(() => {
  conf.loadFavorites()
  const queryText = window.location.hash.split('?')[1] || ''
  const routeQuery = new URLSearchParams(queryText)
  const initialPath = routeQuery.get('path')
  const initialFile = routeQuery.get('file')
  if (initialPath) {
    conf.handleNavigate(initialPath)
  } else {
    conf.getFileList()
  }
  if (initialFile) {
    const initialRow = {
      path: initialFile,
      name: initialFile.split('/').pop() || initialFile,
      isDir: false
    }
    if (conf.isImage(initialRow)) {
      conf.imagePreview.open(initialRow)
    } else {
      conf.openEditor(initialRow)
    }
  }
  conf.getCapacity()
})

defineExpose({
  refresh: () => conf.refresh()
})
</script>

<template>
  <div>
    <div class="box1" style="border-radius: 4px;">
      <div class="flex items-center" style="width: 100%; flex: 0.8">
        <div class="back-level hover-opacity" @click="conf.handleBackLevel()">
          <el-icon size="24"><ArrowLeft /></el-icon>
        </div>
        <div style="flex: 1" @click.stop="conf.handleInputPath">
          <el-breadcrumb v-if="!conf.isInputPath" :separator-icon="ArrowRight">
            <el-breadcrumb-item
              v-for="(item, index) in conf.path"
              :key="index"
              @click.stop="conf.handleBackLevel(index)"
            >
              {{ index === 0 ? '根目录' : item }}
            </el-breadcrumb-item>
          </el-breadcrumb>
          <el-input
            v-else
            v-model="conf.inputPath"
            ref="inputPathRef"
            @blur="conf.handleInputPathConfirm"
            @keyup.enter="conf.handleInputPathConfirm"
          />
        </div>
      </div>
      <el-space :size="42">
        <el-link @click.stop="conf.searchVisible = true">搜索文件/目录</el-link>
        <div class="flex items-center">
          <el-button class="refresh-btn" type="primary" :icon="Refresh" @click="conf.refresh" />
          <el-button class="search-btn" type="primary" :icon="Search" @click="conf.searchVisible = true" />
        </div>
      </el-space>
    </div>
    <div class="tool-bar">
      <div class="tool-bar__content">
        <div class="tool-bar__row tool-bar__row--actions">
          <el-dropdown>
            <el-button class="tool-bar__button tool-bar__button--accent" type="primary">
              上传/下载
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="conf.upload.handleOpenDialog">上传文件/文件夹</el-dropdown-item>
                <el-dropdown-item @click="conf.fileDialog.open('linkDownload')">URL链接下载</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown>
            <el-button class="tool-bar__button tool-bar__button--soft" plain>
              收藏夹
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu class="favorite-menu">
                <el-dropdown-item v-if="conf.favoritesLoading" disabled>收藏加载中...</el-dropdown-item>
                <el-dropdown-item v-else-if="!conf.favorites.length" disabled>暂无收藏</el-dropdown-item>
                <el-dropdown-item
                  v-for="item in conf.favorites"
                  :key="item.path"
                  :disabled="item.isMissing"
                  @click="conf.openFavorite(item)"
                >
                  <el-icon><Star /></el-icon>
                  <span class="favorite-name">{{ item.name }}</span>
                  <el-tag v-if="item.isMissing" size="small" type="warning" effect="plain">已失效</el-tag>
                  <small>{{ item.path }}</small>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown>
            <el-button class="tool-bar__button tool-bar__button--accent" type="primary">
              新建
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="conf.handleOpenDrawer('create', 'file')">
                  <div class="flex items-center" style="gap: 10px">
                    <v-s-icon name="txt" size="22" />
                    <span>文件</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item @click="conf.handleOpenDrawer('create', 'dir')">
                  <div class="flex items-center" style="gap: 10px">
                    <v-s-icon name="folder" size="22" />
                    <span>文件夹</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button
            v-if="conf.clipboard.source"
            class="tool-bar__button tool-bar__button--clipboard"
            type="success"
            plain
            @click="conf.pasteClipboard"
          >
            <span>{{ conf.tipPaste }}</span>
            <span class="clipboard-name">{{ conf.clipboard.source.name }}</span>
          </el-button>
        </div>
        <div class="tool-bar__row tool-bar__row--meta">
          <el-tag v-if="conf.capacity" class="tool-bar__pill tool-bar__pill--capacity" type="info" effect="plain">
            可写 {{ formatBytes(conf.capacity.writableBytes) }}
          </el-tag>
          <div class="tool-bar__location">
            <span class="tool-bar__location-label">管理根目录</span>
            <span class="tool-bar__location-value">{{ conf.rootPath }}</span>
          </div>
        </div>
      </div>
      <div class="tool-bar__actions">
        <el-button class="tool-bar__button tool-bar__button--ghost" type="primary" plain @click="conf.operationsVisible = true">
          操作记录
        </el-button>
        <el-button class="tool-bar__button tool-bar__button--ghost" type="primary" plain @click="emit('open-trash')">
          <span class="mr-1">回收站</span>
          <el-icon size="16"><Delete /></el-icon>
        </el-button>
      </div>
    </div>
    <div class="box2">
      <custom-table :data="conf.fileList" :columns="conf.columns" :loading="conf.loading">
        <template #name="{ row }">
          <div class="flex items-center" style="gap: 10px">
            <span v-if="conf.isImage(row)" class="image-file-icon">
              <el-icon><PictureFilled /></el-icon>
            </span>
            <v-s-icon v-else :name="row.isDir ? 'folder' : 'txt'" size="22" />
            <el-link @click="conf.handleFileClick(row)">
              <span class="ellipsis file-name">{{ row.name }}</span>
            </el-link>
          </div>
        </template>
        <template #identity="{ row }">
          <div class="identity-cell">
            <el-link @click="conf.handleOpenDrawer('editPER', row.isDir ? 'dir' : 'file', row)">
              {{ row.permissions?.padEnd(4, '0') }}
            </el-link>
            <el-link
              class="identity-owner"
              @click="conf.handleOpenDrawer('editUser', row.isDir ? 'dir' : 'file', row)"
            >
              {{ row.user }}
            </el-link>
          </div>
        </template>
        <template #action="{ row }">
          <div class="row-actions">
            <el-button
              class="action-main"
              type="primary"
              plain
              :icon="conf.isImage(row) ? View : FolderOpened"
              :loading="conf.editorLoadingPath === row.path"
              @click="conf.handleFileClick(row)"
            >
              {{ row.isDir ? '打开' : conf.isImage(row) ? '预览' : '编辑' }}
            </el-button>
            <el-button type="primary" link :icon="CopyDocument" @click="conf.setClipboard('copy', row)">
              复制
            </el-button>
            <el-button type="primary" link :icon="Scissor" @click="conf.setClipboard('move', row)">
              剪切
            </el-button>
            <el-button type="primary" link :icon="EditPen" @click="conf.operationDialog.open('rename', row)">
              重命名
            </el-button>
            <el-button v-if="row.isDir" type="primary" link :icon="Operation" @click="conf.treeDialog.open(row)">
              目录树
            </el-button>
            <el-button class="row-action-danger" type="primary" link :icon="Delete" @click="conf.fileDialog.open('delete', row)">
              删除
            </el-button>
            <el-dropdown trigger="click">
              <el-button type="primary" link :icon="MoreFilled">
                更多
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu class="file-action-menu">
                  <el-dropdown-item @click="conf.handleFileClick(row)">
                    <el-icon><component :is="conf.isImage(row) ? View : FolderOpened" /></el-icon>
                    {{ row.isDir ? '打开目录' : conf.isImage(row) ? '图片预览' : '编辑文件' }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="conf.openInNewWindow(row)">
                    <el-icon><FolderOpened /></el-icon>在新窗口打开
                  </el-dropdown-item>
                  <el-dropdown-item v-if="row.isDir" @click="conf.treeDialog.open(row)">
                    <el-icon><Operation /></el-icon>目录树
                  </el-dropdown-item>
                  <el-dropdown-item v-if="!row.isDir" @click="conf.handleFileDownload(row)">
                    <el-icon><Download /></el-icon>下载
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="conf.toggleFavorite(row)">
                    <el-icon><Star /></el-icon>
                    {{ conf.isFavorite(row.path) ? '取消收藏' : '添加到收藏夹' }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="!row.isDir" @click="conf.operationDialog.open('share', row)">
                    <el-icon><Share /></el-icon>外链分享
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="conf.handleOpenDrawer('editPER', row.isDir ? 'dir' : 'file', row)">
                    <el-icon><Lock /></el-icon>权限
                  </el-dropdown-item>
                  <el-dropdown-item @click="conf.setClipboard('copy', row)">
                    <el-icon><CopyDocument /></el-icon>复制
                  </el-dropdown-item>
                  <el-dropdown-item @click="conf.setClipboard('move', row)">
                    <el-icon><Scissor /></el-icon>剪切
                  </el-dropdown-item>
                  <el-dropdown-item @click="conf.operationDialog.open('rename', row)">
                    <el-icon><EditPen /></el-icon>重命名
                  </el-dropdown-item>
                  <el-dropdown-item @click="conf.operationDialog.open('archive', row)">
                    <el-icon><Files /></el-icon>创建压缩包
                  </el-dropdown-item>
                  <el-dropdown-item @click="conf.operationDialog.open('properties', row)">
                    <el-icon><InfoFilled /></el-icon>属性
                  </el-dropdown-item>
                  <el-dropdown-item divided class="danger-menu-item" @click="conf.fileDialog.open('delete', row)">
                    <el-icon><Delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </custom-table>
    </div>

    <custom-dialog
      v-model="conf.imagePreview.show"
      :title="`图片预览 · ${conf.imagePreview.row?.name || ''}`"
      width="860px"
      :on-close="conf.imagePreview.close"
    >
      <div class="image-preview">
        <div
          v-loading="conf.imagePreview.loading"
          class="image-preview__stage"
          :class="{ 'is-error': conf.imagePreview.error }"
        >
          <el-image
            v-if="conf.imagePreview.url && !conf.imagePreview.error"
            :src="conf.imagePreview.url"
            :preview-src-list="[conf.imagePreview.url]"
            :initial-index="0"
            fit="contain"
            preview-teleported
            hide-on-click-modal
            @load="conf.imagePreview.loading = false"
            @error="
              conf.imagePreview.loading = false;
              conf.imagePreview.error = true
            "
          >
            <template #placeholder>
              <div class="image-preview__message">正在读取图片…</div>
            </template>
          </el-image>
          <div v-if="conf.imagePreview.error" class="image-preview__error">
            <el-icon><PictureFilled /></el-icon>
            <strong>图片预览失败</strong>
            <span>文件可能不是受支持的图片、超过 30 MB，或者已经被修改。</span>
          </div>
        </div>
        <div class="image-preview__meta">
          <div>
            <strong>{{ conf.imagePreview.row?.name }}</strong>
            <span>{{ conf.imagePreview.row?.path }}</span>
          </div>
          <el-tag type="info" effect="plain">{{ conf.imagePreview.row?.size || '图片文件' }}</el-tag>
        </div>
        <p class="image-preview__hint">点击图片可以进入全屏预览，滚轮可缩放。</p>
      </div>
      <template #footer>
        <el-button
          v-if="conf.imagePreview.row"
          :icon="Download"
          @click="conf.handleFileDownload(conf.imagePreview.row)"
        >
          下载原图
        </el-button>
        <el-button type="primary" @click="conf.imagePreview.close">关闭</el-button>
      </template>
    </custom-dialog>

    <custom-dialog v-model="conf.fileDialog.show" :title="conf.fileDialog.title">
      <template v-if="conf.fileDialog.type === 'delete'">
        <el-alert title="确定将所选文件移入回收站？稍后可以恢复。" type="warning" show-icon :closable="false" />
        <div class="flex items-center" style="gap: 10px; margin-top: 20px">
          <v-s-icon :name="conf.fileDialog.row?.isDir ? 'folder' : 'txt'" size="22" />
          <span style="color: var(--font-color-gray)">{{ conf.fileDialog.row.name }}</span>
        </div>
      </template>
      <template v-else-if="conf.fileDialog.type === 'upload'">
        <div class="flex column" style="gap: 18px">
          <div class="flex justify-end">
            <el-button type="info" @click="conf.upload.instance?.clearFiles()">清空列表</el-button>
          </div>
          <el-upload
            ref="uploadRef"
            drag
            :data="conf.fileDialog.row"
            :with-credentials="true"
            :auto-upload="false"
            multiple
            :action="`${System.env.API}/ftp/upload`"
            :on-change="conf.upload.onChange"
          >
            <div class="el-upload__text">请将需要上传的文件/文件夹拖到此处</div>
          </el-upload>
        </div>
      </template>
      <template v-else-if="conf.fileDialog.type === 'linkDownload'">
        <el-form
          ref="formRef"
          :model="conf.fileDialog.row"
          :rules="{
            name: [{ required: true, message: '请输入文件名', trigger: 'blur' }],
            url: [{ required: true, message: '请输入url地址', trigger: 'blur' }]
          }"
          label-width="100px"
        >
          <el-form-item label="URL地址" prop="url">
            <el-input v-model="conf.fileDialog.row.url" placeholder="在此处粘贴或输入url地址" clearable />
          </el-form-item>
          <el-form-item label="下载到" prop="path">
            <el-input v-model="conf.fileDialog.row.path" placeholder="请选择下载路径">
              <template #append>
                <v-s-icon class="cursor-pointer" name="folders" @click="conf.selectFolder.open" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="文件名" prop="name">
            <el-input v-model="conf.fileDialog.row.name" placeholder="请输入保存文件名" clearable />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button v-if="conf.fileDialog.type !== 'upload'" @click="conf.fileDialog.close">
          {{ conf.fileDialog.cancelText }}
        </el-button>
        <el-button type="primary" @click="conf.fileDialog.confirm">{{ conf.fileDialog.confirmText }}</el-button>
      </template>
    </custom-dialog>

    <custom-dialog v-model="conf.operationDialog.show" :title="conf.operationDialog.title">
      <div class="operation-dialog">
        <template v-if="conf.operationDialog.type === 'rename'">
          <el-form label-position="top">
            <el-form-item label="新名称" required>
              <el-input
                v-model="conf.operationDialog.value"
                maxlength="255"
                show-word-limit
                placeholder="请输入文件或目录的新名称"
                @keyup.enter="conf.operationDialog.confirm"
              />
            </el-form-item>
          </el-form>
          <el-alert
            title="同一目录中存在同名项目时不会覆盖原文件。"
            type="info"
            show-icon
            :closable="false"
          />
        </template>
        <template v-else-if="conf.operationDialog.type === 'archive'">
          <el-form label-position="top">
            <el-form-item label="压缩包名称" required>
              <el-input
                v-model="conf.operationDialog.value"
                maxlength="255"
                placeholder="例如 website.tar.gz"
              />
            </el-form-item>
            <el-form-item label="保存位置">
              <el-input :model-value="currentPath()" disabled />
            </el-form-item>
          </el-form>
          <el-alert
            title="使用 tar.gz 格式；符号链接和特殊设备文件不会被跟随或打包。"
            type="info"
            show-icon
            :closable="false"
          />
        </template>
        <template v-else-if="conf.operationDialog.type === 'share'">
          <template v-if="!conf.operationDialog.shareUrl">
            <el-alert
              title="外链仅允许下载当前普通文件，不会暴露服务器真实路径。"
              type="warning"
              show-icon
              :closable="false"
            />
            <el-form label-position="top" class="share-form">
              <el-form-item label="分享文件">
                <el-input :model-value="conf.operationDialog.row.path" disabled />
              </el-form-item>
              <el-form-item label="有效期">
                <el-input-number
                  v-model="conf.operationDialog.expiryHours"
                  :min="1"
                  :max="168"
                  controls-position="right"
                />
                <span class="form-unit">小时（最长 7 天）</span>
              </el-form-item>
            </el-form>
          </template>
          <div v-else class="share-result">
            <div class="share-result__icon"><el-icon><Share /></el-icon></div>
            <strong>外链创建成功</strong>
            <p>链接已经复制，可在有效期内直接下载。</p>
            <el-input v-model="conf.operationDialog.shareUrl" readonly>
              <template #append>
                <el-button @click="conf.operationDialog.copyShareUrl">复制</el-button>
              </template>
            </el-input>
          </div>
        </template>
        <template v-else-if="conf.operationDialog.type === 'properties'">
          <div v-loading="conf.operationDialog.loading" class="properties-panel">
            <el-descriptions
              v-if="conf.operationDialog.properties"
              :column="1"
              border
              label-width="130"
            >
              <el-descriptions-item label="名称">
                {{ conf.operationDialog.properties.name }}
              </el-descriptions-item>
              <el-descriptions-item label="路径">
                <span class="break-path">{{ conf.operationDialog.properties.path }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="类型">
                {{
                  conf.operationDialog.properties.type === 'directory'
                    ? '目录'
                    : conf.operationDialog.properties.type === 'symlink'
                      ? '符号链接'
                      : '文件'
                }}
              </el-descriptions-item>
              <el-descriptions-item label="权限 / 所有者">
                {{ conf.operationDialog.properties.permissions }} /
                {{ conf.operationDialog.properties.owner }}
              </el-descriptions-item>
              <el-descriptions-item label="大小">
                {{ formatBytes(conf.operationDialog.properties.size) }}
              </el-descriptions-item>
              <el-descriptions-item label="MIME 类型">
                {{ conf.operationDialog.properties.mimeType || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="修改时间">
                {{ conf.operationDialog.properties.modTime }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </template>
      </div>
      <template #footer>
        <el-button @click="conf.operationDialog.close">
          {{ conf.operationDialog.type === 'properties' || conf.operationDialog.shareUrl ? '关闭' : '取消' }}
        </el-button>
        <el-button
          v-if="conf.operationDialog.type !== 'properties' && !conf.operationDialog.shareUrl"
          type="primary"
          @click="conf.operationDialog.confirm"
        >
          {{ conf.operationDialog.type === 'share' ? '创建并复制外链' : '确定' }}
        </el-button>
      </template>
    </custom-dialog>

    <custom-dialog v-model="conf.copyDialog.show" title="复制到当前目录" width="680px">
      <div class="copy-dialog">
        <el-alert
          title="目标已存在时，默认由后端拒绝复制；开启覆盖后会替换目标文件。"
          type="warning"
          show-icon
          :closable="false"
        />
        <el-form label-position="top" class="copy-dialog__form">
          <el-form-item label="源路径">
            <el-input :model-value="conf.clipboard.source?.path" disabled />
          </el-form-item>
          <el-form-item label="目标路径">
            <el-input v-model="conf.copyDialog.targetPath" disabled />
          </el-form-item>
          <el-form-item label="覆盖策略">
            <el-switch
              v-model="conf.copyDialog.overwrite"
              active-text="覆盖已存在文件"
              inactive-text="不覆盖"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="conf.copyDialog.close">取消</el-button>
        <el-button type="primary" @click="conf.copyDialog.confirm">开始复制</el-button>
      </template>
    </custom-dialog>

    <custom-dialog v-model="conf.selectFolder.show" title="选择文件夹">
      <file-panel :path="conf.selectFolder.path || currentPath()" @select-node="conf.selectFolder.select" />
      <template #footer>
        <el-button type="primary" @click="conf.selectFolder.confirm">确定</el-button>
      </template>
    </custom-dialog>

    <custom-dialog v-model="conf.treeDialog.show" title="目录树" width="720px">
      <file-panel
        :key="conf.treeDialog.key"
        :path="conf.treeDialog.path || currentPath()"
        @select-node="conf.treeDialog.select"
      />
      <template #footer>
        <el-button @click="conf.treeDialog.show = false">取消</el-button>
        <el-button type="primary" :disabled="!conf.treeDialog.isDir" @click="conf.treeDialog.confirm">打开目录</el-button>
      </template>
    </custom-dialog>

    <file-search-dialog
      v-model="conf.searchVisible"
      :current-path="conf.path.join('/').replace(/\/\//g, '/')"
      @navigate="conf.handleNavigate"
    />
    <file-operation-drawer v-model="conf.operationsVisible" />
    <file-editor-drawer
      v-model="conf.editorVisible"
      :path="conf.editorPath"
      :initial-detail="conf.editorDetail"
      @saved="conf.refresh"
    />
  </div>
</template>

<style scoped lang="less">
.back-level {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 22px;
  padding-inline-end: 22px;
  border-right: 1px solid var(--font-color-gray);
}

.refresh-btn,
.search-btn {
  width: 36px;
  height: 36px;
}

.tool-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 16px 20px;
  padding: 16px 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92)),
    var(--surface-subtle);
  box-shadow:
    0 10px 28px rgba(15, 23, 42, 0.035),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.tool-bar__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tool-bar__row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.tool-bar__row--meta {
  align-items: stretch;
  padding-top: 2px;
}

.tool-bar__actions {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 10px;
  flex-wrap: wrap;
}

.tool-bar__button {
  min-height: 40px;
  padding-inline: 16px;
  border-radius: 10px;
  font-weight: 600;
}

.tool-bar__button--accent {
  min-width: 124px;
  box-shadow: 0 10px 20px rgba(244, 63, 94, 0.14);
}

.tool-bar__button--soft {
  min-width: 112px;
  background: rgba(255, 255, 255, 0.88);
}

.tool-bar__button--clipboard {
  max-width: min(100%, 360px);
  background: linear-gradient(180deg, rgba(240, 253, 244, 0.95), rgba(220, 252, 231, 0.92));
}

.tool-bar__button--ghost {
  min-width: 112px;
  background: rgba(255, 241, 242, 0.82);
}

.tool-bar__pill {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-inline: 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
}

.tool-bar__pill--capacity {
  white-space: nowrap;
}

.tool-bar__location {
  min-height: 34px;
  min-width: 0;
  // flex: 1 1 320px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border: 1px solid rgba(34, 197, 94, 0.24);
  border-radius: 10px;
  color: #2f7d32;
  background: rgba(240, 253, 244, 0.72);
  font-size: 13px;
}

.tool-bar__location-label {
  flex: 0 0 auto;
  font-weight: 700;
}

.tool-bar__location-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.92;
}

.clipboard-name {
  max-width: 180px;
  margin-left: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.75;
}

@media (max-width: 1200px) {
  .tool-bar {
    grid-template-columns: 1fr;
  }

  .tool-bar__actions {
    justify-content: flex-start;
  }

  .tool-bar__actions > * {
    flex: 0 0 auto;
  }
}

@media (max-width: 768px) {
  .tool-bar {
    gap: 12px;
    padding: 14px;
    border-radius: 16px;
  }

  .tool-bar__row,
  .tool-bar__actions {
    gap: 10px;
  }

  .tool-bar__row > *,
  .tool-bar__actions > * {
    flex: 1 1 calc(50% - 10px);
    min-width: 0;
  }

  .tool-bar__button,
  .tool-bar__pill,
  .tool-bar__location {
    width: 100%;
    justify-content: center;
  }

  .tool-bar__button--clipboard {
    max-width: none;
  }

  .clipboard-name {
    max-width: 120px;
  }
}

@media (max-width: 560px) {
  .tool-bar__row > *,
  .tool-bar__actions > * {
    flex-basis: 100%;
  }

  .tool-bar__location {
    align-items: flex-start;
    justify-content: flex-start;
    flex-direction: column;
    padding-block: 10px;
  }

  .tool-bar__location-value {
    width: 100%;
  }

  .tool-bar__button--ghost {
    min-width: 0;
  }
}

.identity-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;

  .identity-owner {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.file-name {
  max-width: 210px;
}

.image-file-icon {
  width: 26px;
  height: 26px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 8px;
  color: #3b82f6;
  font-size: 16px;
  background: rgba(59, 130, 246, 0.1);
}

.row-actions {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0;
  padding: 4px;
  border: 1px solid var(--border-subtle);
  border-radius: 11px;
  background: var(--surface-subtle);

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  :deep(.el-button) {
    min-height: 30px;
    padding: 6px 9px;
    border-radius: 8px;
  }

  :deep(.el-button.is-link) {
    color: var(--text-secondary);
    font-size: 12px;

    &:hover {
      color: rgb(var(--primary-color));
      background: rgba(var(--primary-color), 0.08);
    }
  }

  :deep(.row-action-danger.is-link) {
    color: var(--el-color-danger);

    &:hover {
      color: var(--el-color-danger);
      background: rgba(245, 108, 108, 0.1);
    }
  }

  :deep(.action-main) {
    margin-right: 3px;
    border-color: rgba(var(--primary-color), 0.22);
    font-size: 12px;
    background: rgba(var(--primary-color), 0.07);
  }
}

.image-preview {
  .image-preview__stage {
    height: min(58vh, 560px);
    min-height: 360px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    background:
      linear-gradient(45deg, rgba(148, 163, 184, 0.06) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(148, 163, 184, 0.06) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(148, 163, 184, 0.06) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(148, 163, 184, 0.06) 75%),
      var(--surface-subtle);
    background-position:
      0 0,
      0 8px,
      8px -8px,
      -8px 0;
    background-size: 16px 16px;

    &.is-error {
      background: var(--surface-subtle);
    }
  }

  :deep(.image-preview__stage .el-image) {
    width: 100%;
    height: 100%;
    cursor: zoom-in;
  }

  .image-preview__message {
    color: var(--text-tertiary);
    font-size: 13px;
  }

  .image-preview__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--text-tertiary);
    text-align: center;

    .el-icon {
      margin-bottom: 4px;
      color: var(--text-tertiary);
      font-size: 42px;
    }

    strong {
      color: var(--text-primary);
      font-size: 16px;
    }

    span {
      max-width: 420px;
      font-size: 13px;
      line-height: 1.6;
    }
  }

  .image-preview__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 16px 2px 0;

    > div {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    strong {
      color: var(--text-primary);
      font-size: 14px;
    }

    span {
      overflow: hidden;
      color: var(--text-tertiary);
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .image-preview__hint {
    margin: 10px 0 0;
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.operation-dialog {
  min-height: 130px;
}

.copy-dialog {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.copy-dialog__form {
  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
}

.share-form {
  margin-top: 20px;
}

.form-unit {
  margin-left: 12px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.share-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0 4px;
  text-align: center;

  .share-result__icon {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    margin-bottom: 12px;
    border-radius: 16px;
    color: rgb(var(--primary-color));
    font-size: 24px;
    background: rgba(var(--primary-color), 0.1);
  }

  strong {
    color: var(--text-primary);
    font-size: 17px;
  }

  p {
    margin: 8px 0 18px;
    color: var(--text-tertiary);
    font-size: 13px;
  }
}

.properties-panel {
  min-height: 180px;
}

.break-path {
  word-break: break-all;
}

:global(.favorite-menu) {
  min-width: 260px;
  max-width: 420px;
}

:global(.favorite-menu .el-dropdown-menu__item) {
  gap: 8px;
}

:global(.favorite-menu .favorite-name) {
  max-width: 120px;
  overflow: hidden;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.favorite-menu small) {
  max-width: 180px;
  overflow: hidden;
  color: var(--text-tertiary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.file-action-menu) {
  min-width: 210px;
  max-height: 220px;
}

:global(.file-action-menu .el-dropdown-menu__item) {
  gap: 10px;
}

:global(.file-action-menu .danger-menu-item) {
  color: var(--el-color-danger);
}
</style>
