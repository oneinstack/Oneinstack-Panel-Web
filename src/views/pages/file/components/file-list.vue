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
import i18n from '@/lang'

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

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}
const filePermissionLabel = (permission: FilePermission) => t(`file.permissionLabels.${permission}`, permission)
const canFilePermission = (permission: FilePermission) => sconfig.hasScopeAccess('file', permission)
const requireFilePermission = (permission: FilePermission) => {
  if (canFilePermission(permission)) return true
  ElMessage.warning(t('file.noPermission', 'This account does not have file {permission} permission', { permission: filePermissionLabel(permission) }))
  return false
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
    let message = t('file.downloadFailedWithStatus', 'File download failed (HTTP {status})', { status: response.status })
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
    let message = t('file.imageReadFailedWithStatus', 'Image read failed (HTTP {status})', { status: response.status })
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
    throw new Error(t('file.unsupportedImageFormat', 'The current file is not a supported image format'))
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
    { prop: 'name', label: t('file.columns.name', 'File name'), minWidth: '250', sortable: true },
    { prop: 'identity', label: t('file.columns.identity', 'Permissions / Owner'), width: '170' },
    { prop: 'size', label: t('file.columns.size', 'Size'), width: '120', sortable: true },
    { prop: 'modTime', label: t('file.columns.modTime', 'Modified time'), width: '180', sortable: true },
    { prop: 'action', label: t('file.columns.action', 'Actions'), minWidth: '390' }
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
      if (!canCopyFile()) {
        requireFilePermission(canFilePermission('read') ? 'create' : 'read')
        return
      }
      await Api.copyFile({
        sourcePath: conf.clipboard.source.path,
        targetPath: conf.copyDialog.targetPath,
        overwrite: conf.copyDialog.overwrite
      })
      ElMessage.success(t('file.copyDone', 'Copied'))
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
    if (!sutil.matchFilePath(conf.inputPath) && conf.inputPath !== '/') return ElMessage.error(t('file.pathPlaceholder', 'Enter a valid file path'))
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
    ElMessage.success(t('file.downloadSuccess', 'Downloaded successfully'))
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
    ElMessage.success(mode === 'copy' ? t('file.copiedToClipboard', 'Copied to file clipboard') : t('file.cutToClipboard', 'Cut to file clipboard'))
    conf.tipPaste = mode === 'copy' ? t('file.pasteToCurrentDir', 'Paste to current directory') : t('file.cutToCurrentDir', 'Cut to current directory')
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
    ElMessage.success(t('file.cutDone', 'Cut completed'))
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
      ElMessage.success(t('file.favoriteRemoved', 'Removed from favorites'))
    } else {
      await Api.favoriteFile({ path: row.path })
      ElMessage.success(t('file.favoriteAdded', 'Added to favorites'))
    }
    await conf.loadFavorites()
  },
  openFavorite: (item: FavoriteItem) => {
    if (!requireFilePermission('read')) return
    if (item.isMissing) {
      ElMessage.warning(t('file.favoriteMissing', 'This favorite path is no longer available'))
      return
    }
    if (item.isDir) {
      conf.handleNavigate(item.path)
      return
    }
    conf.handleNavigate(parentPath(item.path))
    ElMessage.success(t('file.openedFavoriteParent', 'Opened the folder containing the favorite file'))
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
    title: t('file.deleteFile', 'Delete file'),
    confirmText: t('common.confirm', 'Confirm'),
    cancelText: t('common.cancel', 'Cancel'),
    open: (type: 'delete' | 'upload' | 'linkDownload', row?: any) => {
      if (type === 'delete' && !requireFilePermission('delete')) return
      if ((type === 'upload' || type === 'linkDownload') && !requireFilePermission('create')) return
      switch (type) {
        case 'delete':
          conf.fileDialog.row = row
          conf.fileDialog.title = t('file.deleteFile', 'Delete file')
          conf.fileDialog.confirmText = t('common.confirm', 'Confirm')
          break
        case 'upload':
          const path = conf.path.join('/').replace(/\/\//g, '/')
          conf.fileDialog.row = {
            path
          }
          conf.fileDialog.title = t('file.uploadToPath', 'Upload files to [{path}]', { path })
          conf.fileDialog.confirmText = t('file.startUpload', 'Start upload')
          break
        case 'linkDownload':
          const downloadPath = conf.path.join('/').replace(/\/\//g, '/')
          conf.fileDialog.row = {
            path: downloadPath,
            name: '',
            url: ''
          }
          conf.fileDialog.title = t('file.urlDownload', 'URL download')
          conf.fileDialog.confirmText = t('common.confirm', 'Confirm')
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
        ElMessage.success(t('file.downloadTaskDone', 'Download task completed'))
        conf.fileDialog.close()
        conf.refresh()
        return
      }
      const path = conf.path.join('/').replace(/\/\//g, '/')
      await Api.deleteFile({
        path: `${path === '/' ? '' : path}/${conf.fileDialog.row.name}`
      })
      ElMessage.success(t('file.movedToTrash', 'Moved to trash'))
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
        conf.operationDialog.title = t('file.rename', 'Rename')
        conf.operationDialog.value = row.name
      } else if (type === 'archive') {
        conf.operationDialog.title = t('file.createArchive', 'Create archive')
        conf.operationDialog.value = `${row.name}.tar.gz`
      } else if (type === 'share') {
        conf.operationDialog.title = t('file.shareLink', 'Share link')
      } else {
        conf.operationDialog.title = t('file.fileProperties', 'File properties')
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
        if (!name) return ElMessage.warning(t('file.newNameRequired', 'Enter a new name'))
        await Api.renameFile({ path: dialog.row.path, newName: name })
        ElMessage.success(t('file.renameSuccess', 'Renamed successfully'))
        dialog.close()
        conf.refresh()
        return
      }
      if (dialog.type === 'archive') {
        const archiveName = dialog.value.trim()
        if (!archiveName.endsWith('.tar.gz')) return ElMessage.warning(t('file.archiveNameMustEnd', 'Archive name must end with .tar.gz'))
        await Api.archiveFile({
          path: dialog.row.path,
          targetDir: currentPath(),
          archiveName
        })
        ElMessage.success(t('file.archiveCreateSuccess', 'Archive created successfully'))
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
        ElMessage.success(t('file.shareCreatedCopied', 'Share link created and copied'))
      }
    },
    copyShareUrl: async () => {
      if (!conf.operationDialog.shareUrl) return
      await navigator.clipboard.writeText(conf.operationDialog.shareUrl)
      ElMessage.success(t('file.shareUrlCopied', 'Share link copied'))
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
      if (conf.path.length === 1) return ElMessage.error(t('file.uploadRootDenied', 'Files cannot be uploaded directly to the system root directory.'))
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
      if (!conf.treeDialog.isDir) return ElMessage.warning(t('file.selectDirectoryWarning', 'Select a directory'))
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
              {{ index === 0 ? t('file.rootDir', 'Root directory') : item }}
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
        <el-link @click.stop="conf.searchVisible = true">{{ t('file.searchFiles', 'Search files/folders') }}</el-link>
        <div class="flex items-center">
          <el-button class="refresh-btn" type="primary" :icon="Refresh" @click="conf.refresh" />
          <el-button class="search-btn" type="primary" :icon="Search" @click="conf.searchVisible = true" />
        </div>
      </el-space>
    </div>
    <div class="tool-bar">
      <div class="tool-bar__content">
        <div class="tool-bar__row tool-bar__row--actions">
          <el-dropdown v-if="canFilePermission('create')">
            <el-button class="tool-bar__button tool-bar__button--accent" type="primary">
              {{ t('file.uploadDownload', 'Upload / Download') }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="conf.upload.handleOpenDialog">{{ t('file.uploadFiles', 'Upload files/folders') }}</el-dropdown-item>
                <el-dropdown-item @click="conf.fileDialog.open('linkDownload')">{{ t('file.urlDownload', 'URL download') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown v-if="canFilePermission('read')">
            <el-button class="tool-bar__button tool-bar__button--soft" plain>
              {{ t('file.favorites', 'Favorites') }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu class="favorite-menu">
                <el-dropdown-item v-if="conf.favoritesLoading" disabled>{{ t('file.favoritesLoading', 'Loading favorites...') }}</el-dropdown-item>
                <el-dropdown-item v-else-if="!conf.favorites.length" disabled>{{ t('file.noFavorites', 'No favorites') }}</el-dropdown-item>
                <el-dropdown-item
                  v-for="item in conf.favorites"
                  :key="item.path"
                  :disabled="item.isMissing"
                  @click="conf.openFavorite(item)"
                >
                  <el-icon><Star /></el-icon>
                  <span class="favorite-name">{{ item.name }}</span>
                  <el-tag v-if="item.isMissing" size="small" type="warning" effect="plain">{{ t('file.missing', 'Missing') }}</el-tag>
                  <small>{{ item.path }}</small>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown v-if="canFilePermission('create')">
            <el-button class="tool-bar__button tool-bar__button--accent" type="primary">
              {{ t('file.newItem', 'New') }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="conf.handleOpenDrawer('create', 'file')">
                  <div class="flex items-center" style="gap: 10px">
                    <v-s-icon name="txt" size="22" />
                    <span>{{ t('file.file', 'File') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item @click="conf.handleOpenDrawer('create', 'dir')">
                  <div class="flex items-center" style="gap: 10px">
                    <v-s-icon name="folder" size="22" />
                    <span>{{ t('file.folder', 'Folder') }}</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button
            v-if="conf.clipboard.source && canPasteClipboard()"
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
            {{ t('file.writable', 'Writable') }} {{ formatBytes(conf.capacity.writableBytes) }}
          </el-tag>
          <div class="tool-bar__location">
            <span class="tool-bar__location-label">{{ t('file.rootPath', 'Managed root') }}</span>
            <span class="tool-bar__location-value">{{ conf.rootPath }}</span>
          </div>
        </div>
      </div>
      <div class="tool-bar__actions">
        <el-button class="tool-bar__button tool-bar__button--ghost" type="primary" plain @click="conf.operationsVisible = true">
          {{ t('file.operationRecords', 'Operation records') }}
        </el-button>
        <el-button
          v-if="canFilePermission('delete')"
          class="tool-bar__button tool-bar__button--ghost"
          type="primary"
          plain
          @click="emit('open-trash')"
        >
          <span class="mr-1">{{ t('file.trash', 'Trash') }}</span>
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
            <el-link :disabled="!canUsePrimaryAction(row)" @click="conf.handleFileClick(row)">
              <span class="ellipsis file-name">{{ row.name }}</span>
            </el-link>
          </div>
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
              {{ row.isDir ? t('file.open', 'Open') : conf.isImage(row) ? t('file.preview', 'Preview') : t('file.edit', 'Edit') }}
            </el-button>
            <el-button v-if="canCopyFile()" type="primary" link :icon="CopyDocument" @click="conf.setClipboard('copy', row)">
              {{ t('file.copy', 'Copy') }}
            </el-button>
            <el-button v-if="canFilePermission('move')" type="primary" link :icon="Scissor" @click="conf.setClipboard('move', row)">
              {{ t('file.cut', 'Cut') }}
            </el-button>
            <el-button v-if="canFilePermission('modify')" type="primary" link :icon="EditPen" @click="conf.operationDialog.open('rename', row)">
              {{ t('file.rename', 'Rename') }}
            </el-button>
            <el-button v-if="row.isDir && canFilePermission('read')" type="primary" link :icon="Operation" @click="conf.treeDialog.open(row)">
              {{ t('file.directoryTree', 'Directory tree') }}
            </el-button>
            <el-button
              v-if="canFilePermission('delete')"
              class="row-action-danger"
              type="primary"
              link
              :icon="Delete"
              @click="conf.fileDialog.open('delete', row)"
            >
              {{ t('file.delete', 'Delete') }}
            </el-button>
            <el-dropdown trigger="click">
              <el-button type="primary" link :icon="MoreFilled">
                {{ t('file.more', 'More') }}
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu class="file-action-menu">
                  <el-dropdown-item v-if="canUsePrimaryAction(row)" @click="conf.handleFileClick(row)">
                    <el-icon><component :is="conf.isImage(row) ? View : FolderOpened" /></el-icon>
                    {{ row.isDir ? t('file.openDirectory', 'Open directory') : conf.isImage(row) ? t('file.imagePreview', 'Image preview') : t('file.editFile', 'Edit file') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canFilePermission('read')" @click="conf.openInNewWindow(row)">
                    <el-icon><FolderOpened /></el-icon>{{ t('file.openInNewWindow', 'Open in new window') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="row.isDir && canFilePermission('read')" @click="conf.treeDialog.open(row)">
                    <el-icon><Operation /></el-icon>{{ t('file.directoryTree', 'Directory tree') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="!row.isDir && canFilePermission('read')" @click="conf.handleFileDownload(row)">
                    <el-icon><Download /></el-icon>{{ t('file.download', 'Download') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canFilePermission('read')" divided @click="conf.toggleFavorite(row)">
                    <el-icon><Star /></el-icon>
                    {{ conf.isFavorite(row.path) ? t('file.removeFavorite', 'Remove from favorites') : t('file.addFavorite', 'Add to favorites') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="!row.isDir && canFilePermission('share')" @click="conf.operationDialog.open('share', row)">
                    <el-icon><Share /></el-icon>{{ t('file.shareLink', 'Share link') }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="canFilePermission('modify')"
                    divided
                    @click="conf.handleOpenDrawer('editPER', row.isDir ? 'dir' : 'file', row)"
                  >
                    <el-icon><Lock /></el-icon>{{ t('file.permissions', 'Permissions') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canCopyFile()" @click="conf.setClipboard('copy', row)">
                    <el-icon><CopyDocument /></el-icon>{{ t('file.copy', 'Copy') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canFilePermission('move')" @click="conf.setClipboard('move', row)">
                    <el-icon><Scissor /></el-icon>{{ t('file.cut', 'Cut') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canFilePermission('modify')" @click="conf.operationDialog.open('rename', row)">
                    <el-icon><EditPen /></el-icon>{{ t('file.rename', 'Rename') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canFilePermission('archive')" @click="conf.operationDialog.open('archive', row)">
                    <el-icon><Files /></el-icon>{{ t('file.createArchive', 'Create archive') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canFilePermission('read')" @click="conf.operationDialog.open('properties', row)">
                    <el-icon><InfoFilled /></el-icon>{{ t('file.properties', 'Properties') }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="canFilePermission('delete')"
                    divided
                    class="danger-menu-item"
                    @click="conf.fileDialog.open('delete', row)"
                  >
                    <el-icon><Delete /></el-icon>{{ t('file.delete', 'Delete') }}
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
      :title="t('file.imagePreviewTitle', 'Image preview · {name}', { name: conf.imagePreview.row?.name || '' })"
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
              <div class="image-preview__message">{{ t('file.imageLoading', 'Reading image...') }}</div>
            </template>
          </el-image>
          <div v-if="conf.imagePreview.error" class="image-preview__error">
            <el-icon><PictureFilled /></el-icon>
            <strong>{{ t('file.imagePreviewFailed', 'Image preview failed') }}</strong>
            <span>{{ t('file.imagePreviewFailedTip', 'The file may not be a supported image, may exceed 30 MB, or may have been modified.') }}</span>
          </div>
        </div>
        <div class="image-preview__meta">
          <div>
            <strong>{{ conf.imagePreview.row?.name }}</strong>
            <span>{{ conf.imagePreview.row?.path }}</span>
          </div>
          <el-tag type="info" effect="plain">{{ conf.imagePreview.row?.size || t('file.imageFile', 'Image file') }}</el-tag>
        </div>
        <p class="image-preview__hint">{{ t('file.imagePreviewHint', 'Click the image to enter fullscreen preview. Use the wheel to zoom.') }}</p>
      </div>
      <template #footer>
        <el-button
          v-if="conf.imagePreview.row"
          :icon="Download"
          @click="conf.handleFileDownload(conf.imagePreview.row)"
        >
          {{ t('file.downloadOriginal', 'Download original') }}
        </el-button>
        <el-button type="primary" @click="conf.imagePreview.close">{{ t('common.close', 'Close') }}</el-button>
      </template>
    </custom-dialog>

    <custom-dialog v-model="conf.fileDialog.show" :title="conf.fileDialog.title">
      <template v-if="conf.fileDialog.type === 'delete'">
        <el-alert :title="t('file.trashConfirmTip', 'Move the selected file to trash? It can be restored later.')" type="warning" show-icon :closable="false" />
        <div class="flex items-center" style="gap: 10px; margin-top: 20px">
          <v-s-icon :name="conf.fileDialog.row?.isDir ? 'folder' : 'txt'" size="22" />
          <span style="color: var(--font-color-gray)">{{ conf.fileDialog.row.name }}</span>
        </div>
      </template>
      <template v-else-if="conf.fileDialog.type === 'upload'">
        <div class="flex column" style="gap: 18px">
          <div class="flex justify-end">
            <el-button type="info" @click="conf.upload.instance?.clearFiles()">{{ t('file.clearList', 'Clear list') }}</el-button>
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
            <div class="el-upload__text">{{ t('file.uploadDropTip', 'Drag files/folders here to upload') }}</div>
          </el-upload>
        </div>
      </template>
      <template v-else-if="conf.fileDialog.type === 'linkDownload'">
        <el-form
          ref="formRef"
          :model="conf.fileDialog.row"
          :rules="{
            name: [{ required: true, message: t('file.fileNameRequired', 'Enter a file name'), trigger: 'blur' }],
            url: [{ required: true, message: t('file.urlRequired', 'Enter a URL'), trigger: 'blur' }]
          }"
          label-width="100px"
        >
          <el-form-item :label="t('file.urlAddress', 'URL')" prop="url">
            <el-input v-model="conf.fileDialog.row.url" :placeholder="t('file.urlPlaceholder', 'Paste or enter a URL here')" clearable />
          </el-form-item>
          <el-form-item :label="t('file.downloadTo', 'Download to')" prop="path">
            <el-input v-model="conf.fileDialog.row.path" :placeholder="t('file.downloadPathPlaceholder', 'Select download path')">
              <template #append>
                <v-s-icon class="cursor-pointer" name="folders" @click="conf.selectFolder.open" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item :label="t('file.fileName', 'File name')" prop="name">
            <el-input v-model="conf.fileDialog.row.name" :placeholder="t('file.saveFileNamePlaceholder', 'Enter saved file name')" clearable />
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
            <el-form-item :label="t('file.newName', 'New name')" required>
              <el-input
                v-model="conf.operationDialog.value"
                maxlength="255"
                show-word-limit
                :placeholder="t('file.newNamePlaceholder', 'Enter a new file or directory name')"
                @keyup.enter="conf.operationDialog.confirm"
              />
            </el-form-item>
          </el-form>
          <el-alert
            :title="t('file.renameNoOverwriteTip', 'Existing items with the same name in this directory will not be overwritten.')"
            type="info"
            show-icon
            :closable="false"
          />
        </template>
        <template v-else-if="conf.operationDialog.type === 'archive'">
          <el-form label-position="top">
            <el-form-item :label="t('file.archiveName', 'Archive name')" required>
              <el-input
                v-model="conf.operationDialog.value"
                maxlength="255"
                :placeholder="t('file.archiveNamePlaceholder', 'Example: website.tar.gz')"
              />
            </el-form-item>
            <el-form-item :label="t('file.saveLocation', 'Save location')">
              <el-input :model-value="currentPath()" disabled />
            </el-form-item>
          </el-form>
          <el-alert
            :title="t('file.archiveTip', 'Uses tar.gz format. Symbolic links and special device files are not followed or packed.')"
            type="info"
            show-icon
            :closable="false"
          />
        </template>
        <template v-else-if="conf.operationDialog.type === 'share'">
          <template v-if="!conf.operationDialog.shareUrl">
            <el-alert
              :title="t('file.shareTip', 'External links only allow downloading this regular file and do not expose the server path.')"
              type="warning"
              show-icon
              :closable="false"
            />
            <el-form label-position="top" class="share-form">
              <el-form-item :label="t('file.shareFile', 'Shared file')">
                <el-input :model-value="conf.operationDialog.row.path" disabled />
              </el-form-item>
              <el-form-item :label="t('file.expiresIn', 'Expires in')">
                <el-input-number
                  v-model="conf.operationDialog.expiryHours"
                  :min="1"
                  :max="168"
                  controls-position="right"
                />
                <span class="form-unit">{{ t('file.hoursMaxDays', 'hours (up to 7 days)') }}</span>
              </el-form-item>
            </el-form>
          </template>
          <div v-else class="share-result">
            <div class="share-result__icon"><el-icon><Share /></el-icon></div>
            <strong>{{ t('file.shareCreateSuccessTitle', 'Share link created') }}</strong>
            <p>{{ t('file.shareCreateSuccessTip', 'The link has been copied and can be used to download during its validity period.') }}</p>
            <el-input v-model="conf.operationDialog.shareUrl" readonly>
              <template #append>
                <el-button @click="conf.operationDialog.copyShareUrl">{{ t('file.copy', 'Copy') }}</el-button>
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
              <el-descriptions-item :label="t('common.name', 'Name')">
                {{ conf.operationDialog.properties.name }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('file.path', 'Path')">
                <span class="break-path">{{ conf.operationDialog.properties.path }}</span>
              </el-descriptions-item>
              <el-descriptions-item :label="t('common.type', 'Type')">
                {{
                  conf.operationDialog.properties.type === 'directory'
                    ? t('file.directory', 'Directory')
                    : conf.operationDialog.properties.type === 'symlink'
                      ? t('file.symlink', 'Symbolic link')
                      : t('file.file', 'File')
                }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('file.columns.identity', 'Permissions / Owner')">
                {{ conf.operationDialog.properties.permissions }} /
                {{ conf.operationDialog.properties.owner }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('common.size', 'Size')">
                {{ formatBytes(conf.operationDialog.properties.size) }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('file.mimeType', 'MIME type')">
                {{ conf.operationDialog.properties.mimeType || '—' }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('file.columns.modTime', 'Modified time')">
                {{ conf.operationDialog.properties.modTime }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </template>
      </div>
      <template #footer>
        <el-button @click="conf.operationDialog.close">
          {{ conf.operationDialog.type === 'properties' || conf.operationDialog.shareUrl ? t('common.close', 'Close') : t('common.cancel', 'Cancel') }}
        </el-button>
        <el-button
          v-if="conf.operationDialog.type !== 'properties' && !conf.operationDialog.shareUrl"
          type="primary"
          @click="conf.operationDialog.confirm"
        >
          {{ conf.operationDialog.type === 'share' ? t('file.createAndCopyShare', 'Create and copy share link') : t('common.confirm', 'Confirm') }}
        </el-button>
      </template>
    </custom-dialog>

    <custom-dialog v-model="conf.copyDialog.show" :title="t('file.copyToCurrentDir', 'Copy to current directory')" width="680px">
      <div class="copy-dialog">
        <el-alert
          :title="t('file.copyOverwriteTip', 'If the target already exists, the backend rejects the copy by default. Enabling overwrite replaces the target file.')"
          type="warning"
          show-icon
          :closable="false"
        />
        <el-form label-position="top" class="copy-dialog__form">
          <el-form-item :label="t('file.sourcePath', 'Source path')">
            <el-input :model-value="conf.clipboard.source?.path" disabled />
          </el-form-item>
          <el-form-item :label="t('file.targetPath', 'Target path')">
            <el-input v-model="conf.copyDialog.targetPath" disabled />
          </el-form-item>
          <el-form-item :label="t('file.overwritePolicy', 'Overwrite policy')">
            <el-switch
              v-model="conf.copyDialog.overwrite"
              :active-text="t('file.overwriteExisting', 'Overwrite existing files')"
              :inactive-text="t('file.noOverwrite', 'Do not overwrite')"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="conf.copyDialog.close">{{ t('common.cancel', 'Cancel') }}</el-button>
        <el-button type="primary" @click="conf.copyDialog.confirm">{{ t('file.startCopy', 'Start copy') }}</el-button>
      </template>
    </custom-dialog>

    <custom-dialog v-model="conf.selectFolder.show" :title="t('file.selectFolder', 'Select folder')">
      <file-panel :path="conf.selectFolder.path || currentPath()" @select-node="conf.selectFolder.select" />
      <template #footer>
        <el-button type="primary" @click="conf.selectFolder.confirm">{{ t('common.confirm', 'Confirm') }}</el-button>
      </template>
    </custom-dialog>

    <custom-dialog v-model="conf.treeDialog.show" :title="t('file.directoryTree', 'Directory tree')" width="720px">
      <file-panel
        :key="conf.treeDialog.key"
        :path="conf.treeDialog.path || currentPath()"
        @select-node="conf.treeDialog.select"
      />
      <template #footer>
        <el-button @click="conf.treeDialog.show = false">{{ t('common.cancel', 'Cancel') }}</el-button>
        <el-button type="primary" :disabled="!conf.treeDialog.isDir" @click="conf.treeDialog.confirm">{{ t('file.openDirectoryAction', 'Open directory') }}</el-button>
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
