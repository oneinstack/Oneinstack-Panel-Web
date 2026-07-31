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
type FavoriteItem = { path: string; name: string; isDir: boolean }

const imageExtensionPattern = /\.(avif|bmp|gif|ico|jpe?g|png|webp)$/i
const currentPath = () => conf.path.join('/').replace(/\/\//g, '/')
const parentPath = (path: string) => {
  const clean = path.replace(/\/+$/, '')
  const index = clean.lastIndexOf('/')
  return index <= 0 ? '/' : clean.slice(0, index)
}

const conf = reactive({
  path: ['/'],
  searchVisible: false,
  operationsVisible: false,
  editorVisible: false,
  editorPath: '',
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
        const { data } = await Api.createImagePreviewTicket({ path: row.path })
        conf.imagePreview.url = `${window.location.origin}${data.url}`
      } catch {
        conf.imagePreview.loading = false
        conf.imagePreview.error = true
      }
    },
    close: () => {
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
  favorites: [] as FavoriteItem[],
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
      conf.editorPath = row.path
      conf.editorVisible = true
      return
    }
    conf.path.push(row.name)
    conf.getFileList()
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
    await Api.downloadFile({
      path: row.path,
      filename: row.name
    })
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
  },
  clearClipboard: () => {
    conf.clipboard.mode = ''
    conf.clipboard.source = null
  },
  pasteClipboard: async () => {
    if (!conf.clipboard.source || !conf.clipboard.mode) return
    const params = {
      source: conf.clipboard.source.path,
      targetDir: currentPath(),
      targetName: conf.clipboard.source.name
    }
    if (conf.clipboard.mode === 'copy') {
      await Api.copyFile(params)
    } else {
      await Api.moveFile(params)
      conf.clearClipboard()
    }
    ElMessage.success('粘贴完成')
    conf.refresh()
  },
  loadFavorites: () => {
    try {
      const saved = JSON.parse(localStorage.getItem('oneinstack-file-favorites') || '[]')
      conf.favorites = Array.isArray(saved) ? saved.slice(0, 100) : []
    } catch {
      conf.favorites = []
    }
  },
  isFavorite: (path: string) => conf.favorites.some((item) => item.path === path),
  toggleFavorite: (row: any) => {
    const index = conf.favorites.findIndex((item) => item.path === row.path)
    if (index >= 0) {
      conf.favorites.splice(index, 1)
      ElMessage.success('已取消收藏')
    } else {
      conf.favorites.unshift({ path: row.path, name: row.name, isDir: row.isDir })
      conf.favorites = conf.favorites.slice(0, 100)
      ElMessage.success('已添加到收藏夹')
    }
    localStorage.setItem('oneinstack-file-favorites', JSON.stringify(conf.favorites))
  },
  openFavorite: (item: FavoriteItem) => {
    if (item.isDir) {
      conf.handleNavigate(item.path)
      return
    }
    conf.handleNavigate(parentPath(item.path))
    conf.editorPath = item.path
    conf.editorVisible = true
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
  selectFolder: {
    show: false,
    path: '',
    open: () => {
      conf.selectFolder.show = true
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
      conf.editorPath = initialFile
      conf.editorVisible = true
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
      <el-space :size="14" class="btn-group">
        <el-dropdown>
          <el-button type="primary">
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
        <el-tag v-if="conf.capacity" type="info" effect="plain">
          可写 {{ formatBytes(conf.capacity.writableBytes) }}
        </el-tag>
        <el-tag type="success" effect="plain">管理根目录 {{ conf.rootPath }}</el-tag>
        <el-button
          v-if="conf.clipboard.source"
          type="success"
          plain
          @click="conf.pasteClipboard"
        >
          粘贴到当前目录
          <span class="clipboard-name">{{ conf.clipboard.source.name }}</span>
        </el-button>
        <el-dropdown>
          <el-button plain>
            收藏夹
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu class="favorite-menu">
              <el-dropdown-item v-if="!conf.favorites.length" disabled>暂无收藏</el-dropdown-item>
              <el-dropdown-item
                v-for="item in conf.favorites"
                :key="item.path"
                @click="conf.openFavorite(item)"
              >
                <el-icon><Star /></el-icon>
                <span class="favorite-name">{{ item.name }}</span>
                <small>{{ item.path }}</small>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown>
          <el-button type="primary">
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
        <!-- <el-button type="primary">终端</el-button>
        <el-button type="primary">/（根目录）29.47GB</el-button> -->
      </el-space>
      <div class="demo-form-inline">
        <el-button type="primary" plain @click="conf.operationsVisible = true">操作记录</el-button>
        <el-button type="primary" plain @click="emit('open-trash')">
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

    <custom-dialog v-model="conf.selectFolder.show" title="选择文件夹">
      <file-panel @select="(path) => (conf.selectFolder.path = path)" />
      <template #footer>
        <el-button type="primary" @click="conf.selectFolder.confirm">确定</el-button>
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

.clipboard-name {
  max-width: 120px;
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.75;
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
}

:global(.file-action-menu .el-dropdown-menu__item) {
  gap: 10px;
}

:global(.file-action-menu .danger-menu-item) {
  color: var(--el-color-danger);
}
</style>
