<script setup lang="ts">
import { Api } from '@/api/Api'
import CustomDialog from '@/components/custom-dialog.vue'
import CustomTable from '@/components/custom-table.vue'
import sconfig from '@/sstore/sconfig'
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
  View,
  Grid,
  List,
  UploadFilled,
  FolderAdd,
  Monitor,
  Tickets,
  Folder,
  Document
} from '@element-plus/icons-vue'
import { ElMessage, FormInstance, UploadFile, UploadInstance } from 'element-plus'
import { computed, nextTick, onMounted, reactive, useTemplateRef } from 'vue'
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
type FilePermission = 'archive' | 'create' | 'delete' | 'edit' | 'modify' | 'move' | 'read' | 'share'

const filePermissionLabels: Record<FilePermission, string> = {
  archive: '压缩',
  create: '创建',
  delete: '删除',
  edit: '编辑',
  modify: '修改',
  move: '移动',
  read: '读取',
  share: '分享'
}
const canFilePermission = (permission: FilePermission) => sconfig.hasScopeAccess('file', permission)
const requireFilePermission = (permission: FilePermission) => {
  if (canFilePermission(permission)) return true
  ElMessage.warning(`当前账号暂无文件${filePermissionLabels[permission]}权限`)
  return false
}
const imageExtensionPattern = /\.(avif|bmp|gif|ico|jpe?g|png|webp)$/i
const archiveExtensionPattern = /\.(7z|bz2|gz|rar|tar|tgz|xz|zip)$/i
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

const fileTypeLabel = (row: any) => {
  if (row?.isSymlink) return row?.isDir ? '目录链接' : '文件链接'
  if (row?.isDir) return '文件夹'
  if (imageExtensionPattern.test(row?.name || '')) return '图片'
  if (archiveExtensionPattern.test(row?.name || '')) return '压缩包'
  const extension = String(row?.name || '').split('.').pop()
  return extension && extension !== row?.name ? extension.toUpperCase() : '文件'
}

const conf = reactive({
  tipPaste: '',
  path: ['/'],
  quickFilter: '',
  viewMode: 'list' as 'list' | 'grid',
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
      if (!requireFilePermission('read')) return
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
    { prop: 'name', label: '文件名称', minWidth: '270', sortable: true },
    { prop: 'type', label: '类型', width: '110' },
    { prop: 'identity', label: '权限 / 所有者', width: '150' },
    { prop: 'size', label: '大小', width: '110', sortable: true },
    { prop: 'modTime', label: '修改时间', width: '170', sortable: true },
    { prop: 'action', label: '操作', minWidth: '360' }
  ],
  fileList: [] as any[],
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
      if (!canCopyFile()) {
        requireFilePermission(canFilePermission('read') ? 'create' : 'read')
        return
      }
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
  openTerminal: () => System.router.push('/terminal'),
  handleFileClick: (row: any) => {
    if (!row.isDir) {
      if (conf.isImage(row)) {
        if (!requireFilePermission('read')) return
        conf.imagePreview.open(row)
        return
      }
      if (!requireFilePermission('edit')) return
      conf.openEditor(row)
      return
    }
    if (!requireFilePermission('read')) return
    conf.path.push(row.name)
    conf.getFileList()
  },
  openEditor: async (row: any) => {
    if (!row?.path) return
    if (!requireFilePermission('edit')) return
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
    if (openType === 'create' && !requireFilePermission('create')) return
    if ((openType === 'editPER' || openType === 'editUser') && !requireFilePermission('modify')) return
    emit('open-drawer', openType, type, row)
  },
  handleFileDownload: async (row: any) => {
    if (!requireFilePermission('read')) return
    await downloadVirtualFile(row.path, row.name)
    ElMessage.success('下载成功！')
  },
  isImage: (row: any) => !row?.isDir && imageExtensionPattern.test(row?.name || ''),
  setClipboard: (mode: Exclude<ClipboardMode, ''>, row: any) => {
    if (mode === 'copy' && !canCopyFile()) return requireFilePermission(canFilePermission('read') ? 'create' : 'read')
    if (mode === 'move' && !requireFilePermission('move')) return
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
    if (!canPasteClipboard()) {
      requireFilePermission(conf.clipboard.mode === 'copy' ? 'create' : 'move')
      return
    }
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
    if (!requireFilePermission('read')) return
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
    if (!requireFilePermission('read')) return
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
    if (!requireFilePermission('read')) return
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
      if (type === 'delete' && !requireFilePermission('delete')) return
      if ((type === 'upload' || type === 'linkDownload') && !requireFilePermission('create')) return
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
      const permissionMap: Record<typeof type, FilePermission> = {
        rename: 'modify',
        archive: 'archive',
        properties: 'read',
        share: 'share'
      }
      if (!requireFilePermission(permissionMap[type])) return
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
      if (!requireFilePermission('read')) return
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

const canCopyFile = () => canFilePermission('read') && canFilePermission('create')
const canPasteClipboard = () => {
  if (conf.clipboard.mode === 'copy') return canCopyFile()
  if (conf.clipboard.mode === 'move') return canFilePermission('move')
  return false
}
const canUsePrimaryAction = (row: any) => {
  if (row?.isDir || conf.isImage(row)) return canFilePermission('read')
  return canFilePermission('edit')
}

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

const filteredFileList = computed(() => {
  const keyword = conf.quickFilter.trim().toLowerCase()
  if (!keyword) return conf.fileList
  return conf.fileList.filter((row: any) => String(row?.name || '').toLowerCase().includes(keyword))
})

const fileStats = computed(() => {
  const rows = filteredFileList.value as any[]
  return {
    total: rows.length,
    directories: rows.filter((row) => row.isDir).length,
    files: rows.filter((row) => !row.isDir).length,
    hidden: rows.filter((row) => String(row?.name || '').startsWith('.')).length
  }
})

const capacityUsedPercent = computed(() => {
  const total = Number(conf.capacity?.diskTotalBytes || 0)
  const available = Number(conf.capacity?.diskAvailableBytes || 0)
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round(((total - available) / total) * 100)))
})
</script>

<template>
  <div class="file-explorer">
    <section class="navigation-bar">
      <div class="path-navigator">
        <el-button
          class="path-action"
          :icon="ArrowLeft"
          :disabled="conf.path.length === 1"
          aria-label="返回上一级"
          @click="conf.handleBackLevel()"
        />
        <div class="path-field" @click.stop="conf.handleInputPath">
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
            ref="inputPathRef"
            v-model="conf.inputPath"
            class="path-input"
            @blur="conf.handleInputPathConfirm"
            @keyup.enter="conf.handleInputPathConfirm"
          />
        </div>
        <el-button class="path-action" :icon="Refresh" aria-label="刷新当前目录" @click="conf.refresh" />
      </div>
      <div class="navigation-search">
        <el-input
          v-model="conf.quickFilter"
          clearable
          :prefix-icon="Search"
          placeholder="筛选当前目录"
        />
        <el-button :icon="Search" @click="conf.searchVisible = true">深度搜索</el-button>
      </div>
    </section>

    <section class="command-bar">
      <div class="command-bar__primary">
        <el-dropdown v-if="canFilePermission('create')">
          <el-button class="command-button command-button--primary" type="primary" :icon="UploadFilled">
            上传/下载
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="conf.upload.handleOpenDialog">上传文件或文件夹</el-dropdown-item>
              <el-dropdown-item @click="conf.fileDialog.open('linkDownload')">从 URL 下载</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown v-if="canFilePermission('create')">
          <el-button class="command-button" :icon="FolderAdd">
            新建
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="conf.handleOpenDrawer('create', 'file')">
                <el-icon><Document /></el-icon>新建文件
              </el-dropdown-item>
              <el-dropdown-item @click="conf.handleOpenDrawer('create', 'dir')">
                <el-icon><Folder /></el-icon>新建文件夹
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown v-if="canFilePermission('read')">
          <el-button class="command-button" :icon="Star">
            收藏夹
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
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
        <el-button
          v-if="canFilePermission('read')"
          class="command-button"
          :icon="FolderOpened"
          @click="conf.treeDialog.open()"
        >
          目录树
        </el-button>
        <el-button
          v-if="sconfig.hasMenuAccess('terminal')"
          class="command-button"
          :icon="Monitor"
          @click="conf.openTerminal"
        >
          终端
        </el-button>
      </div>

      <div class="command-bar__secondary">
        <div v-if="conf.capacity" class="capacity-compact">
          <div class="capacity-compact__label">
            <span>磁盘 {{ capacityUsedPercent }}%</span>
            <strong>可写 {{ formatBytes(conf.capacity.writableBytes) }}</strong>
          </div>
          <div class="capacity-compact__track">
            <span :style="{ width: `${capacityUsedPercent}%` }" />
          </div>
        </div>
        <el-tooltip content="文件操作记录" placement="bottom">
          <el-button class="icon-command" :icon="Tickets" aria-label="文件操作记录" @click="conf.operationsVisible = true" />
        </el-tooltip>
        <el-tooltip v-if="canFilePermission('delete')" content="回收站" placement="bottom">
          <el-button class="icon-command" :icon="Delete" aria-label="回收站" @click="emit('open-trash')" />
        </el-tooltip>
        <div class="view-switch" aria-label="文件视图切换">
          <el-button
            :class="{ active: conf.viewMode === 'list' }"
            :icon="List"
            aria-label="列表视图"
            @click="conf.viewMode = 'list'"
          />
          <el-button
            :class="{ active: conf.viewMode === 'grid' }"
            :icon="Grid"
            aria-label="网格视图"
            @click="conf.viewMode = 'grid'"
          />
        </div>
      </div>
    </section>

    <div v-if="conf.clipboard.source && canPasteClipboard()" class="clipboard-strip">
      <div>
        <el-icon><CopyDocument /></el-icon>
        <span>{{ conf.tipPaste }}</span>
        <strong>{{ conf.clipboard.source.name }}</strong>
      </div>
      <div>
        <el-button type="primary" size="small" @click="conf.pasteClipboard">立即粘贴</el-button>
        <el-button size="small" @click="conf.clearClipboard">取消</el-button>
      </div>
    </div>

    <section v-if="conf.viewMode === 'list'" class="file-table-shell">
      <custom-table
        class="file-data-table"
        :data="filteredFileList"
        :columns="conf.columns"
        :loading="conf.loading"
        :page-size="50"
      >
        <template #name="{ row }">
          <div class="file-name-cell">
            <span v-if="conf.isImage(row)" class="image-file-icon">
              <el-icon><PictureFilled /></el-icon>
            </span>
            <v-s-icon v-else :name="row.isDir ? 'folder' : 'txt'" size="21" />
            <el-link :disabled="!canUsePrimaryAction(row)" @click="conf.handleFileClick(row)">
              <span class="ellipsis file-name">{{ row.name }}</span>
            </el-link>
            <el-icon v-if="conf.isFavorite(row.path)" class="favorite-mark"><Star /></el-icon>
            <span v-if="row.isSymlink" class="symlink-mark">链接</span>
          </div>
        </template>
        <template #type="{ row }">
          <span class="file-type" :class="{ 'is-directory': row.isDir, 'is-image': conf.isImage(row) }">
            {{ fileTypeLabel(row) }}
          </span>
        </template>
        <template #identity="{ row }">
          <div class="identity-cell">
            <el-link v-if="canFilePermission('modify')" @click="conf.handleOpenDrawer('editPER', row.isDir ? 'dir' : 'file', row)">
              {{ row.permissions?.padEnd(4, '0') }}
            </el-link>
            <span v-else>{{ row.permissions?.padEnd(4, '0') }}</span>
            <el-link
              v-if="canFilePermission('modify')"
              class="identity-owner"
              @click="conf.handleOpenDrawer('editUser', row.isDir ? 'dir' : 'file', row)"
            >
              {{ row.user }}
            </el-link>
            <span v-else class="identity-owner">{{ row.user }}</span>
          </div>
        </template>
        <template #action="{ row }">
          <div class="row-actions">
            <el-button
              v-if="canUsePrimaryAction(row)"
              class="action-main"
              type="primary"
              plain
              :icon="conf.isImage(row) ? View : FolderOpened"
              :loading="conf.editorLoadingPath === row.path"
              @click="conf.handleFileClick(row)"
            >
              {{ row.isDir ? '打开' : conf.isImage(row) ? '预览' : '编辑' }}
            </el-button>
            <el-button v-if="canCopyFile()" type="primary" link :icon="CopyDocument" @click="conf.setClipboard('copy', row)">
              复制
            </el-button>
            <el-button v-if="canFilePermission('move')" type="primary" link :icon="Scissor" @click="conf.setClipboard('move', row)">
              剪切
            </el-button>
            <el-button v-if="canFilePermission('modify')" type="primary" link :icon="EditPen" @click="conf.operationDialog.open('rename', row)">
              重命名
            </el-button>
            <el-button v-if="row.isDir && canFilePermission('read')" type="primary" link :icon="Operation" @click="conf.treeDialog.open(row)">
              目录树
            </el-button>
            <el-button
              v-if="canFilePermission('delete')"
              class="row-action-danger"
              type="primary"
              link
              :icon="Delete"
              @click="conf.fileDialog.open('delete', row)"
            >
              删除
            </el-button>
            <el-dropdown trigger="click">
              <el-button type="primary" link :icon="MoreFilled">
                更多
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu class="file-action-menu">
                  <el-dropdown-item v-if="canUsePrimaryAction(row)" @click="conf.handleFileClick(row)">
                    <el-icon><component :is="conf.isImage(row) ? View : FolderOpened" /></el-icon>
                    {{ row.isDir ? '打开目录' : conf.isImage(row) ? '图片预览' : '编辑文件' }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canFilePermission('read')" @click="conf.openInNewWindow(row)">
                    <el-icon><FolderOpened /></el-icon>在新窗口打开
                  </el-dropdown-item>
                  <el-dropdown-item v-if="row.isDir && canFilePermission('read')" @click="conf.treeDialog.open(row)">
                    <el-icon><Operation /></el-icon>目录树
                  </el-dropdown-item>
                  <el-dropdown-item v-if="!row.isDir && canFilePermission('read')" @click="conf.handleFileDownload(row)">
                    <el-icon><Download /></el-icon>下载
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canFilePermission('read')" divided @click="conf.toggleFavorite(row)">
                    <el-icon><Star /></el-icon>
                    {{ conf.isFavorite(row.path) ? '取消收藏' : '添加到收藏夹' }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="!row.isDir && canFilePermission('share')" @click="conf.operationDialog.open('share', row)">
                    <el-icon><Share /></el-icon>外链分享
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="canFilePermission('modify')"
                    divided
                    @click="conf.handleOpenDrawer('editPER', row.isDir ? 'dir' : 'file', row)"
                  >
                    <el-icon><Lock /></el-icon>权限
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canCopyFile()" @click="conf.setClipboard('copy', row)">
                    <el-icon><CopyDocument /></el-icon>复制
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canFilePermission('move')" @click="conf.setClipboard('move', row)">
                    <el-icon><Scissor /></el-icon>剪切
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canFilePermission('modify')" @click="conf.operationDialog.open('rename', row)">
                    <el-icon><EditPen /></el-icon>重命名
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canFilePermission('archive')" @click="conf.operationDialog.open('archive', row)">
                    <el-icon><Files /></el-icon>创建压缩包
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canFilePermission('read')" @click="conf.operationDialog.open('properties', row)">
                    <el-icon><InfoFilled /></el-icon>属性
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="canFilePermission('delete')"
                    divided
                    class="danger-menu-item"
                    @click="conf.fileDialog.open('delete', row)"
                  >
                    <el-icon><Delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
        <template #summary>
          <div class="file-summary">
            <span>共 <strong>{{ fileStats.total }}</strong> 项</span>
            <span>{{ fileStats.directories }} 个文件夹</span>
            <span>{{ fileStats.files }} 个文件</span>
            <span v-if="fileStats.hidden">{{ fileStats.hidden }} 个隐藏项</span>
            <span v-if="conf.quickFilter" class="file-summary__filter">已从 {{ conf.fileList.length }} 项中筛选</span>
          </div>
        </template>
      </custom-table>
    </section>

    <section v-else class="file-grid-shell" v-loading="conf.loading">
      <div v-if="filteredFileList.length" class="file-grid">
        <article
          v-for="row in filteredFileList"
          :key="row.path"
          class="file-card"
          tabindex="0"
          @dblclick="conf.handleFileClick(row)"
          @keyup.enter="conf.handleFileClick(row)"
        >
          <div class="file-card__icon" :class="{ 'is-image': conf.isImage(row) }">
            <el-icon v-if="conf.isImage(row)"><PictureFilled /></el-icon>
            <v-s-icon v-else :name="row.isDir ? 'folder' : 'txt'" size="42" />
          </div>
          <div class="file-card__body">
            <strong :title="row.name">{{ row.name }}</strong>
            <span>{{ fileTypeLabel(row) }} · {{ row.isDir ? '—' : row.size }}</span>
            <small>{{ row.modTime }}</small>
          </div>
          <el-dropdown trigger="click" class="file-card__menu">
            <el-button text :icon="MoreFilled" aria-label="更多操作" @click.stop />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="canUsePrimaryAction(row)" @click="conf.handleFileClick(row)">
                  <el-icon><FolderOpened /></el-icon>{{ row.isDir ? '打开' : conf.isImage(row) ? '预览' : '编辑' }}
                </el-dropdown-item>
                <el-dropdown-item v-if="!row.isDir && canFilePermission('read')" @click="conf.handleFileDownload(row)">
                  <el-icon><Download /></el-icon>下载
                </el-dropdown-item>
                <el-dropdown-item v-if="canFilePermission('read')" @click="conf.toggleFavorite(row)">
                  <el-icon><Star /></el-icon>{{ conf.isFavorite(row.path) ? '取消收藏' : '收藏' }}
                </el-dropdown-item>
                <el-dropdown-item v-if="canFilePermission('read')" @click="conf.operationDialog.open('properties', row)">
                  <el-icon><InfoFilled /></el-icon>属性
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="canFilePermission('delete')"
                  divided
                  class="danger-menu-item"
                  @click="conf.fileDialog.open('delete', row)"
                >
                  <el-icon><Delete /></el-icon>删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </article>
      </div>
      <el-empty v-else description="当前目录没有文件" />
      <footer class="file-grid-footer">
        <div class="file-summary">
          <span>共 <strong>{{ fileStats.total }}</strong> 项</span>
          <span>{{ fileStats.directories }} 个文件夹</span>
          <span>{{ fileStats.files }} 个文件</span>
        </div>
        <span>管理根目录 {{ conf.rootPath }}</span>
      </footer>
    </section>

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
.file-explorer {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}

.navigation-bar {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(360px, 1fr) minmax(280px, 420px);
  align-items: center;
  gap: 10px;
}

.path-navigator,
.navigation-search {
  min-width: 0;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.path-navigator {
  padding: 3px;
  border: 1px solid var(--border-subtle);
  border-radius: 9px;
  background: var(--surface-card);
}

.path-field {
  min-width: 0;
  height: 32px;
  display: flex;
  flex: 1;
  align-items: center;
  padding: 0 10px;
  overflow: hidden;
  border-radius: 6px;
  cursor: text;

  &:hover {
    background: var(--surface-subtle);
  }

  :deep(.el-breadcrumb) {
    min-width: 0;
    display: flex;
    overflow: hidden;
  }

  :deep(.el-breadcrumb__item) {
    flex: 0 0 auto;
  }

  :deep(.el-breadcrumb__inner) {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 560;
    cursor: pointer;
  }

  :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
    color: var(--text-primary);
    font-weight: 680;
  }
}

.path-input {
  width: 100%;

  :deep(.el-input__wrapper) {
    padding: 0;
    box-shadow: none;
  }
}

.path-action {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  margin: 0;
  border: 0;
  border-radius: 6px;
  color: var(--text-secondary);
  background: transparent;
}

.navigation-search {
  :deep(.el-input) {
    min-width: 0;
  }

  :deep(.el-input__wrapper) {
    min-height: 40px;
    border-radius: 9px;
    box-shadow: inset 0 0 0 1px var(--border-subtle);
  }

  > .el-button {
    height: 40px;
    margin: 0;
    border-radius: 9px;
  }
}

.command-bar {
  min-width: 0;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 9px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--surface-subtle);
}

.command-bar__primary,
.command-bar__secondary {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
}

.command-bar__primary {
  flex-wrap: wrap;
}

.command-bar__secondary {
  flex: 0 0 auto;
}

.command-button,
.icon-command {
  height: 34px;
  margin: 0;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 620;
  background: var(--surface-card);
}

.command-button--primary {
  background: rgb(var(--primary-color));
}

.capacity-compact {
  width: 194px;
  padding: 3px 8px;
}

.capacity-compact__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--text-tertiary);
  font-size: 10px;

  strong {
    color: var(--text-secondary);
    font-weight: 650;
  }
}

.capacity-compact__track {
  height: 3px;
  margin-top: 4px;
  overflow: hidden;
  border-radius: 10px;
  background: var(--border-subtle);

  span {
    height: 100%;
    display: block;
    border-radius: inherit;
    background: linear-gradient(90deg, rgb(var(--primary-color)), var(--primary-color-light));
  }
}

.view-switch {
  display: flex;
  padding: 2px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--surface-card);

  .el-button {
    width: 30px;
    height: 28px;
    margin: 0;
    border: 0;
    border-radius: 6px;
    color: var(--text-tertiary);
    background: transparent;

    &.active {
      color: rgb(var(--primary-color));
      background: rgba(var(--primary-color), 0.1);
    }
  }
}

.clipboard-strip {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 10px;
  border: 1px solid rgba(var(--primary-color), 0.24);
  border-radius: 9px;
  color: var(--text-secondary);
  background: rgba(var(--primary-color), 0.055);
  font-size: 12px;

  > div {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  strong {
    max-width: 360px;
    overflow: hidden;
    color: var(--text-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.file-table-shell,
.file-grid-shell {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--surface-card);
}

:deep(.file-data-table .smart-table) {
  border-radius: 0;
  background: var(--surface-card);
  box-shadow: none;
}

:deep(.file-data-table .smart-table th.el-table__cell) {
  height: 41px;
  color: var(--text-secondary);
  background: var(--surface-subtle);
}

:deep(.file-data-table .smart-table td.el-table__cell) {
  height: 45px;
}

:deep(.file-data-table .smart-table .cell) {
  padding: 0 11px;
}

:deep(.file-data-table .pagination) {
  min-height: 49px;
  margin: 0;
  padding: 7px 11px;
  border-top: 1px solid var(--border-subtle);
}

:deep(.file-data-table .pagination .el-pagination.is-background .btn-next),
:deep(.file-data-table .pagination .el-pagination.is-background .btn-prev),
:deep(.file-data-table .pagination .el-pagination.is-background .el-pager li) {
  min-width: 30px;
  height: 30px;
  border-radius: 7px;
}

.file-summary {
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--text-tertiary);
  font-size: 12px;

  strong {
    color: var(--text-primary);
  }
}

.file-summary__filter {
  color: rgb(var(--primary-color));
}

.identity-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .identity-owner {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.file-name {
  max-width: 220px;
}

.file-name-cell {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
}

.favorite-mark {
  flex: 0 0 auto;
  color: #f59e0b;
  font-size: 13px;
}

.symlink-mark {
  flex: 0 0 auto;
  padding: 1px 5px;
  border-radius: 4px;
  color: #0891b2;
  font-size: 10px;
  background: rgba(6, 182, 212, 0.09);
}

.file-type {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 5px;
  color: var(--text-tertiary);
  font-size: 11px;
  background: var(--surface-subtle);

  &.is-directory {
    color: #2563eb;
    background: rgba(59, 130, 246, 0.09);
  }

  &.is-image {
    color: #7c3aed;
    background: rgba(139, 92, 246, 0.09);
  }
}

.image-file-icon {
  width: 23px;
  height: 23px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 6px;
  color: #3b82f6;
  font-size: 16px;
  background: rgba(59, 130, 246, 0.1);
}

.row-actions {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  opacity: 0;
  pointer-events: none;
  transform: translateX(6px);
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  :deep(.el-button) {
    min-height: 28px;
    padding: 5px 7px;
    border-radius: 6px;
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
    margin-right: 2px;
    border-color: rgba(var(--primary-color), 0.22);
    font-size: 12px;
    background: rgba(var(--primary-color), 0.07);
  }
}

// 桌面端保持操作列简洁，只在当前行悬停或通过键盘聚焦时显示按钮。
:deep(.smart-table .el-table__body tr:hover) .row-actions,
:deep(.smart-table .el-table__body tr:focus-within) .row-actions {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
}

// 触屏设备没有可靠的 hover，必须始终保留可操作入口。
@media (hover: none), (pointer: coarse) {
  .row-actions {
    opacity: 1;
    pointer-events: auto;
    transform: none;
  }
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  padding: 10px;
}

.file-card {
  min-width: 0;
  min-height: 92px;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 28px;
  align-items: center;
  gap: 9px;
  padding: 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 9px;
  background: var(--surface-card);
  cursor: default;
  transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;

  &:hover,
  &:focus-visible {
    border-color: rgba(var(--primary-color), 0.32);
    outline: none;
    background: rgba(var(--primary-color), 0.025);
    transform: translateY(-1px);
  }
}

.file-card__icon {
  height: 48px;
  display: grid;
  place-items: center;

  &.is-image {
    border-radius: 9px;
    color: #7c3aed;
    font-size: 28px;
    background: rgba(139, 92, 246, 0.09);
  }
}

.file-card__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong,
  span,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--text-primary);
    font-size: 13px;
  }

  span,
  small {
    color: var(--text-tertiary);
    font-size: 10px;
  }
}

.file-card__menu {
  align-self: start;

  .el-button {
    width: 28px;
    height: 28px;
    padding: 0;
  }
}

.file-grid-footer {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 7px 11px;
  border-top: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  font-size: 11px;
}

@media (max-width: 1180px) {
  .navigation-bar {
    grid-template-columns: 1fr;
  }

  .command-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .command-bar__secondary {
    width: 100%;
  }

  .capacity-compact {
    flex: 1;
  }
}

@media (max-width: 720px) {
  .file-explorer {
    padding: 7px;
  }

  .navigation-bar {
    gap: 7px;
  }

  .navigation-search > .el-button {
    width: 40px;
    padding: 0;
    overflow: hidden;
    color: transparent;

    :deep(.el-icon) {
      margin: 0;
      color: var(--text-secondary);
    }
  }

  .command-bar__primary,
  .command-bar__secondary {
    width: 100%;
    flex-wrap: wrap;
  }

  .capacity-compact {
    width: 100%;
    flex-basis: 100%;
  }

  .clipboard-strip,
  .file-grid-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .file-summary {
    flex-wrap: wrap;
    gap: 6px 12px;
  }

  :deep(.file-data-table .pagination.has-summary) {
    align-items: flex-start;
    flex-direction: column;
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
