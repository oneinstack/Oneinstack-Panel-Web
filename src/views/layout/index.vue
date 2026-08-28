<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import ThemeSwitch from './components/theme-switch.vue'
import LanguageSwitch from './components/language-switch.vue'
import { useAppStore } from '@/stores/modules/app';
import { Bell, Expand, Fold } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { useConfigStore } from '@/stores/modules/config';
import { Api } from '@/api/modules'
import { useSoftwareTaskStore, type SoftwareTask } from '@/stores/modules/softwareTask';
import InstallTaskDrawer from '@/views/pages/software/components/InstallTaskDrawer.vue'
import i18n from '@/lang'
import { hasTerminalAccess } from '@/utils/access'
import approvalCenterIcon from '../../../public/static/menu/approval-center.svg?raw'
import approvalCenterActiveIcon from '../../../public/static/menu/approval-center-active.svg?raw'
import auditLogIcon from '../../../public/static/menu/audit-log.svg?raw'
import auditLogActiveIcon from '../../../public/static/menu/audit-log-active.svg?raw'
import bastionIcon from '../../../public/static/menu/bastion.svg?raw'
import bastionActiveIcon from '../../../public/static/menu/bastion-active.svg?raw'
import certificateIcon from '../../../public/static/menu/certificate.svg?raw'
import certificateActiveIcon from '../../../public/static/menu/certificate-active.svg?raw'
import configSnapshotsIcon from '../../../public/static/menu/config-snapshots.svg?raw'
import configSnapshotsActiveIcon from '../../../public/static/menu/config-snapshots-active.svg?raw'
import containerManagementIcon from '../../../public/static/menu/container-management.svg?raw'
import containerManagementActiveIcon from '../../../public/static/menu/container-management-active.svg?raw'
import dashboardIcon from '../../../public/static/menu/dashboard.svg?raw'
import dashboardActiveIcon from '../../../public/static/menu/dashboard-active.svg?raw'
import databaseIcon from '../../../public/static/menu/database.svg?raw'
import databaseActiveIcon from '../../../public/static/menu/database-active.svg?raw'
import fileIcon from '../../../public/static/menu/file.svg?raw'
import fileActiveIcon from '../../../public/static/menu/file-active.svg?raw'
import monitoringIcon from '../../../public/static/menu/monitoring.svg?raw'
import monitoringActiveIcon from '../../../public/static/menu/monitoring-active.svg?raw'
import operationsIcon from '../../../public/static/menu/operations.svg?raw'
import operationsActiveIcon from '../../../public/static/menu/operations-active.svg?raw'
import panelSettingsIcon from '../../../public/static/menu/panel-settings.svg?raw'
import panelSettingsActiveIcon from '../../../public/static/menu/panel-settings-active.svg?raw'
import runtimeLogIcon from '../../../public/static/menu/runtime-log.svg?raw'
import runtimeLogActiveIcon from '../../../public/static/menu/runtime-log-active.svg?raw'
import scheduledTasksIcon from '../../../public/static/menu/scheduled-tasks.svg?raw'
import scheduledTasksActiveIcon from '../../../public/static/menu/scheduled-tasks-active.svg?raw'
import securityIcon from '../../../public/static/menu/security.svg?raw'
import securityActiveIcon from '../../../public/static/menu/security-active.svg?raw'
import securityAuditIcon from '../../../public/static/menu/security-audit.svg?raw'
import securityAuditActiveIcon from '../../../public/static/menu/security-audit-active.svg?raw'
import softwareStoreIcon from '../../../public/static/menu/software-store.svg?raw'
import softwareStoreActiveIcon from '../../../public/static/menu/software-store-active.svg?raw'
import systemManagementIcon from '../../../public/static/menu/system-management.svg?raw'
import systemManagementActiveIcon from '../../../public/static/menu/system-management-active.svg?raw'
import systemSettingsIcon from '../../../public/static/menu/system-settings.svg?raw'
import systemSettingsActiveIcon from '../../../public/static/menu/system-settings-active.svg?raw'
import terminalIcon from '../../../public/static/menu/terminal.svg?raw'
import terminalActiveIcon from '../../../public/static/menu/terminal-active.svg?raw'
import userManagementIcon from '../../../public/static/menu/user-management.svg?raw'
import userManagementActiveIcon from '../../../public/static/menu/user-management-active.svg?raw'
import websiteIcon from '../../../public/static/menu/website.svg?raw'
import websiteActiveIcon from '../../../public/static/menu/website-active.svg?raw'
import { scheduleInteractionRecovery } from '@/utils/theme'

const sapp = useAppStore()
const sconfig = useConfigStore()
const softwareTaskStore = useSoftwareTaskStore()


interface ItemColor {
  light: string[]
  dark: string[]
}

interface NavItem {
  name: string
  path: string
  icon: string
  activeIcon: string
  activeColor: ItemColor
  localeKey?: string
  children?: NavItem[]
  event?: () => void
  adminOnly?: boolean
  matrixKeys?: string[]
  actionKeys?: string[]
}

const route = useRoute()
const router = useRouter()
const isMobileNavigation = ref(false)
const mobileNavigationOpen = ref(false)
const navigationCollapsed = computed(() => isMobileNavigation.value ? !mobileNavigationOpen.value : conf.isCollapse)
let mobileNavigationMedia: MediaQueryList | undefined

const syncMobileNavigation = (event?: MediaQueryListEvent) => {
  const matches = event?.matches ?? mobileNavigationMedia?.matches ?? false
  isMobileNavigation.value = matches
  mobileNavigationOpen.value = false
}

const navActiveColor: ItemColor = {
  light: ['#eab170', '#8B8B8B'],
  dark: ['#eab170', '#ffffff']
}

const conf = reactive({
  isCollapse: false,
  searchValue: '',
  defaultColor: {
    light: ['#8B8B8B', '#8B8B8B'],
    dark: ['#8B8B8B', '#8B8B8B']
  },
  navList: [
    {
      name: 'Home',
      path: '/home',
      icon: dashboardIcon,
      activeIcon: dashboardActiveIcon,
      matrixKeys: ['dashboard'],
      activeColor: navActiveColor
    },
    {
      name: 'Websites', path: '/website', icon: websiteIcon, activeIcon: websiteActiveIcon, matrixKeys: ['website'], activeColor: navActiveColor
    },
    {
      name: 'Databases', path: '/database', icon: databaseIcon, activeIcon: databaseActiveIcon, matrixKeys: ['database'], activeColor: navActiveColor
    },
    {
      name: 'Software store', path: '/software', icon: softwareStoreIcon, activeIcon: softwareStoreActiveIcon, matrixKeys: ['software'], activeColor: navActiveColor
    },
    {
      name: 'Containers', path: '/container', icon: containerManagementIcon, activeIcon: containerManagementActiveIcon, matrixKeys: ['container'], activeColor: navActiveColor
    },
    {
      name: 'Files', path: '/file', icon: fileIcon, activeIcon: fileActiveIcon, matrixKeys: ['file'], activeColor: navActiveColor
    },
    {
      name: 'Secure terminal', path: '/terminal', icon: terminalIcon, activeIcon: terminalActiveIcon, matrixKeys: ['terminal'], actionKeys: ['terminal.access'], activeColor: navActiveColor
    },
    {
      name: 'Scheduled tasks', path: '/task', icon: scheduledTasksIcon, activeIcon: scheduledTasksActiveIcon, matrixKeys: ['cron'], activeColor: navActiveColor
    },
    {
      name: 'Operations',
      path: 'group:operations',
      icon: operationsIcon,
      activeIcon: operationsActiveIcon,
      localeKey: 'operations',
      activeColor: navActiveColor,
      children: [
        { name: 'Monitoring', path: '/monitor', icon: monitoringIcon, activeIcon: monitoringActiveIcon, adminOnly: true, matrixKeys: ['monitoring'], activeColor: navActiveColor },
        { name: 'Bastion', path: '/bastion', icon: bastionIcon, activeIcon: bastionActiveIcon, matrixKeys: ['bastion'], activeColor: navActiveColor },
        { name: 'Runtime logs', path: '/runtime-log', icon: runtimeLogIcon, activeIcon: runtimeLogActiveIcon, adminOnly: true, matrixKeys: ['runtimeLog'], activeColor: navActiveColor }
      ]
    },
    {
      name: 'Security and audit',
      path: 'group:security',
      icon: securityAuditIcon,
      activeIcon: securityAuditActiveIcon,
      localeKey: 'securityAudit',
      activeColor: navActiveColor,
      children: [
        { name: 'Security', path: '/security', icon: securityIcon, activeIcon: securityActiveIcon, matrixKeys: ['security'], activeColor: navActiveColor },
        { name: 'Certificates', path: '/certificate', icon: certificateIcon, activeIcon: certificateActiveIcon, matrixKeys: ['certificate'], actionKeys: ['certificate.read'], activeColor: navActiveColor },
        { name: 'Approval center', path: '/approval-center', icon: approvalCenterIcon, activeIcon: approvalCenterActiveIcon, matrixKeys: ['approval'], activeColor: navActiveColor },
        { name: 'Audit logs', path: '/log', icon: auditLogIcon, activeIcon: auditLogActiveIcon, adminOnly: true, matrixKeys: ['audit'], activeColor: navActiveColor },
        { name: 'Config snapshots', path: '/config-snapshots', icon: configSnapshotsIcon, activeIcon: configSnapshotsActiveIcon, adminOnly: true, matrixKeys: ['configSnapshots'], actionKeys: ['config.snapshot.read'], activeColor: navActiveColor }
      ]
    },
    {
      name: 'System settings',
      path: 'group:system',
      icon: systemSettingsIcon,
      activeIcon: systemSettingsActiveIcon,
      localeKey: 'systemPanel',
      activeColor: navActiveColor,
      children: [
        { name: 'System management', path: '/system-management', icon: systemManagementIcon, activeIcon: systemManagementActiveIcon, actionKeys: ['system.settings.read'], activeColor: navActiveColor },
        { name: 'User management', path: '/user-management', icon: userManagementIcon, activeIcon: userManagementActiveIcon, matrixKeys: ['userManagement'], activeColor: navActiveColor },
        { name: 'Panel settings', path: '/setting', icon: panelSettingsIcon, activeIcon: panelSettingsActiveIcon, matrixKeys: ['panelSettings'], activeColor: navActiveColor }
      ]
    }
  ] as NavItem[]
})
const isPrivilegedUser = computed(() =>
  Boolean(sconfig.userInfo?.user?.isAdmin || sconfig.userInfo?.user?.isSuperAdmin)
)
const hasMenuPermission = (item: NavItem) => {
  if (isPrivilegedUser.value) return true
  if (item.path === '/terminal') return hasTerminalAccess()
  if (item.matrixKeys?.some((key) => sconfig.hasMenuAccess(key))) return true
  if (item.actionKeys?.some((key) => sconfig.hasActionAccess(key))) return true
  return !item.matrixKeys?.length && !item.actionKeys?.length
}
const filterVisibleNavItems = (items: NavItem[]): NavItem[] => items.flatMap((item) => {
  if (item.children?.length) {
    const children = filterVisibleNavItems(item.children)
    return children.length ? [{ ...item, children }] : []
  }
  if (item.adminOnly && !item.matrixKeys?.length && !isPrivilegedUser.value) return []
  return hasMenuPermission(item) ? [item] : []
})
const visibleNavList = computed(() => filterVisibleNavItems(conf.navList))
const navigableNavItems = computed(() =>
  visibleNavList.value.flatMap((item) => item.children?.length ? item.children : [item])
)
const currentNav = computed(() => {
  const matched = navigableNavItems.value
    .filter((item) => item.path.startsWith('/') && route.path.startsWith(item.path))
    .sort((left, right) => right.path.length - left.path.length)[0]
  return matched ?? navigableNavItems.value[0]
})
const activeMenuIndex = computed(() => currentNav.value?.path || '')
const menuRenderSeed = ref(0)
const menuRenderKey = computed(() => `${activeMenuIndex.value}:${menuRenderSeed.value}`)
const isNavItemActive = (item: NavItem): boolean =>
  item.children?.some(isNavItemActive) || (item.path.startsWith('/') && route.path.startsWith(item.path))
const hoveredMenuKey = ref('')
const getMenuItemKey = (item: NavItem) => item.path || item.name
const isMenuItemHovered = (item: NavItem) => hoveredMenuKey.value === getMenuItemKey(item)
const setHoveredMenuItem = (item?: NavItem) => {
  hoveredMenuKey.value = item ? getMenuItemKey(item) : ''
}
const activeMenuIconColor = 'rgb(var(--primary-color))'
const withThemeAccent = (svg: string) => svg
  .replace(/#F7911C/ig, activeMenuIconColor)
  .replace(/#f59d0c/ig, activeMenuIconColor)
  .replace(/#f97316/ig, activeMenuIconColor)
  .replace(/#fb923c/ig, activeMenuIconColor)
  .replace(/#eab170/ig, activeMenuIconColor)
  .replace(/#121212/ig, sapp.theme === 'dark' ? '#ffffff' : '#111111')
  .replace(/#111111/ig, sapp.theme === 'dark' ? '#ffffff' : '#111111')
const getMenuItemIcon = (item: NavItem) =>
  isNavItemActive(item) || isMenuItemHovered(item)
    ? withThemeAccent(item.activeIcon)
    : item.icon
const activeGroupIndexes = computed(() =>
  visibleNavList.value.filter((item) => item.children?.length && isNavItemActive(item)).map((item) => item.path)
)
const navigateNavItem = async (item: NavItem) => {
  if (item.path && route.path !== item.path) {
    const currentPath = route.path
    await router.push(item.path).catch(() => undefined)
    if (route.path === currentPath) {
      menuRenderSeed.value += 1
    }
  }
  mobileNavigationOpen.value = false
  item.event?.()
}
const menuPathLocaleKey: Record<string, string> = {
  '/home': 'dashboard',
  '/website': 'website',
  '/database': 'database',
  '/monitor': 'monitoring',
  '/bastion': 'bastion',
  '/container': 'container',
  '/security': 'security',
  '/certificate': 'certificate',
  '/file': 'file',
  '/log': 'audit',
  '/runtime-log': 'runtimeLog',
  '/terminal': 'terminal',
  '/task': 'cron',
  '/software': 'software',
  '/setting': 'panelSettings',
  '/config-snapshots': 'configSnapshots',
  '/system-management': 'systemManagement',
  '/user-management': 'userManagement',
  '/approval-center': 'approval'
}
const translateWithFallback = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}
const getMenuLocaleKey = (item?: NavItem) => {
  if (!item) return ''
  if (item.localeKey) return item.localeKey
  if (!item.path) return item.matrixKeys?.[0] || 'logout'
  return menuPathLocaleKey[item.path] || item.matrixKeys?.[0] || ''
}
const getMenuName = (item?: NavItem) => {
  const key = getMenuLocaleKey(item)
  return key ? translateWithFallback(`layout.menu.${key}`, item?.name || key) : item?.name || ''
}
const currentNavTitle = computed(() => getMenuName(currentNav.value))
const pageDescription = computed(() => {
  const key = getMenuLocaleKey(currentNav.value)
  return key
    ? translateWithFallback(`layout.description.${key}`, translateWithFallback('layout.description.fallback', 'OneinStack server control center'))
    : translateWithFallback('layout.description.fallback', 'OneinStack server control center')
})
const displayName = computed(
  () => sconfig.userInfo?.user?.username || sconfig.userInfo?.username || translateWithFallback('layout.administrator', 'Administrator')
)
const displayInitial = computed(() => displayName.value.slice(0, 1).toUpperCase())
const taskPopoverVisible = ref(false)
const globalTaskDrawer = reactive({
  show: false,
  taskId: ''
})
const taskStatuses = new Map<string, string>()
const activeSoftwareTasks = computed(() =>
  Object.values(softwareTaskStore.tasks)
    .filter((task) => !softwareTaskStore.isTerminal(task.status))
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
)
const operationNameFallbacks: Record<string, string> = {
  install: 'Install',
  upgrade: 'Upgrade',
  uninstall: 'Uninstall',
  start: 'Start',
  stop: 'Stop',
  restart: 'Restart',
  reload: 'Reload',
  configure: 'Publish configuration'
}
const getOperationName = (operation: string) =>
  translateWithFallback(`layout.operation.${operation}`, operationNameFallbacks[operation] || translateWithFallback('layout.task', 'Task'))
const taskStatusName = (task: SoftwareTask) => {
  return translateWithFallback(`layout.taskStatus.${task.status}`, task.message || task.status)
}
const openGlobalTask = (task: SoftwareTask) => {
  taskPopoverVisible.value = false
  globalTaskDrawer.taskId = task.id
  globalTaskDrawer.show = true
}

watch(
  () => Object.values(softwareTaskStore.tasks).map((task) => `${task.id}:${task.status}`).sort(),
  () => {
    Object.values(softwareTaskStore.tasks).forEach((task) => {
      const previousStatus = taskStatuses.get(task.id)
      taskStatuses.set(task.id, task.status)
      if (
        !previousStatus ||
        softwareTaskStore.isTerminal(previousStatus) ||
        !softwareTaskStore.isTerminal(task.status)
      ) return

      const succeeded = task.status === 'succeeded'
      const operation = getOperationName(task.operation)
      ElNotification({
        title: succeeded
          ? translateWithFallback('layout.taskSuccess', `${operation} succeeded`, { operation })
          : translateWithFallback('layout.taskIncomplete', `${operation} did not complete`, { operation }),
        message: succeeded
          ? translateWithFallback('layout.taskCompleteMessage', `${task.component} has completed. Page state was refreshed automatically.`, { component: task.component })
          : `${task.component}: ${task.errorMessage || task.message || translateWithFallback('layout.taskDetailHint', 'Open the task for details')}`,
        type: succeeded ? 'success' : 'error',
        duration: succeeded ? 5000 : 0,
        position: 'top-right',
        onClick: () => openGlobalTask(task)
      })
    })
  },
  { immediate: true }
)

onMounted(() => {
  mobileNavigationMedia = window.matchMedia('(max-width: 768px)')
  syncMobileNavigation()
  mobileNavigationMedia.addEventListener('change', syncMobileNavigation)
  scheduleInteractionRecovery()
  void softwareTaskStore.loadActive().catch(() => undefined)
  void Api.getAccessMatrix()
    .then((response) => {
      sconfig.setAccessMatrix(response?.data || {})
    })
    .catch(() => {
      sconfig.setAccessMatrix({})
    })
})

onBeforeUnmount(() => {
  mobileNavigationMedia?.removeEventListener('change', syncMobileNavigation)
})

watch(
  () => route.path,
  () => {
    scheduleInteractionRecovery()
    mobileNavigationOpen.value = false
  },
  { immediate: true }
)

const Beturn = () => {
  ElMessageBox.confirm(translateWithFallback('layout.logoutConfirm', 'Sign out of the panel?'), translateWithFallback('layout.logoutTitle', 'Sign out'), {
          confirmButtonText: translateWithFallback('common.confirm', 'Confirm'),
          cancelButtonText: translateWithFallback('common.cancel', 'Cancel'),
          type: 'warning'
        })
          .then(async (res) => {
            if (res === 'confirm') {
              try {
                await Api.logout()
              } finally {
                sconfig.logout(true)
              }
              ElMessage({
                type: 'success',
                message: translateWithFallback('layout.logoutSuccess', 'Signed out')
              })
            }
          })
          .catch(() => {})
}
const BindButton = () => {
  // 手机菜单独立开关，避免改变桌面侧栏的折叠偏好。
  if (isMobileNavigation.value) mobileNavigationOpen.value = !mobileNavigationOpen.value
  else conf.isCollapse = !conf.isCollapse
}
</script>

<template>
  <el-container class="layout-container">
    <el-header class="layout-container__header">
      <div class="layout-container__header-left" :class="{ collapsed: conf.isCollapse }">
        <div class="brand-mark">
          <img class="logo" src="/static/images/logo.jpeg" alt="OneinStack" />
        </div>
        <div class="brand-copy">
          <img class="logo-text" :src="`/static/images/logo-text-${sapp.theme}.png`" alt="OneinStack Panel" />
          <span>{{ $t('layout.brandSubtitle') }}</span>
        </div>
      </div>
      <button
        class="sidebar-trigger"
        type="button"
        :aria-label="navigationCollapsed ? $t('layout.expandNavigation') : $t('layout.collapseNavigation')"
        :aria-expanded="!navigationCollapsed"
        @click="BindButton"
      >
        <el-icon :size="18">
          <Expand v-if="navigationCollapsed" />
          <Fold v-else />
        </el-icon>
      </button>
      <div class="page-context">
        <div class="page-title">{{ currentNavTitle }}</div>
        <div class="page-description">{{ pageDescription }}</div>
      </div>
      <div class="layout-container__header-right">
        <el-popover
          v-model:visible="taskPopoverVisible"
          placement="bottom-end"
          :width="390"
          trigger="click"
          popper-class="global-task-popover"
        >
          <template #reference>
            <button
              class="task-center-trigger"
              type="button"
              :aria-label="$t('layout.runningTaskAria', { count: activeSoftwareTasks.length })"
            >
              <el-icon :size="17"><Bell /></el-icon>
              <span class="task-center-label">{{ $t('layout.task') }}</span>
              <span class="task-count" :class="{ active: activeSoftwareTasks.length > 0 }">
                {{ activeSoftwareTasks.length }}
              </span>
            </button>
          </template>
          <div class="global-task-panel">
            <div class="global-task-panel__header">
              <div>
                <strong>{{ $t('layout.runningTasks') }}</strong>
                <span>{{ $t('layout.runningTaskHint') }}</span>
              </div>
              <el-tag size="small" :type="activeSoftwareTasks.length ? 'primary' : 'info'">
                {{ $t('layout.taskCount', { count: activeSoftwareTasks.length }) }}
              </el-tag>
            </div>
            <div v-if="!activeSoftwareTasks.length" class="global-task-empty">
              <el-icon :size="22"><Bell /></el-icon>
              <span>{{ $t('layout.noRunningTasks') }}</span>
            </div>
            <button
              v-for="task in activeSoftwareTasks"
              :key="task.id"
              type="button"
              class="global-task-item"
              @click="openGlobalTask(task)"
            >
              <div class="global-task-item__top">
                <strong>{{ task.component }}</strong>
                <span>{{ task.progress }}%</span>
              </div>
              <div class="global-task-item__meta">
                {{ getOperationName(task.operation) }} · {{ taskStatusName(task) }}
              </div>
              <el-progress
                :percentage="task.progress || 0"
                :stroke-width="5"
                :show-text="false"
              />
            </button>
          </div>
        </el-popover>
        <div class="server-status">
          <span class="status-dot"></span>
          <span>{{ $t('layout.serverHealthy') }}</span>
        </div>
        <language-switch />
        <theme-switch />
        <el-dropdown placement="bottom-end" popper-class="header-dropdown-popper header-dropdown-popper--user">
          <div class="user-menu">
            <div class="avatar">{{ displayInitial }}</div>
            <div class="user-copy">
              <strong>{{ displayName }}</strong>
              <span>{{ sconfig.userInfo?.user?.isAdmin ? $t('layout.superAdmin') : $t('layout.panelUser') }}</span>
            </div>
            <span class="chevron">⌄</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="Beturn">{{ $t('layout.safeLogout') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container class="layout-container__body">
      <aside
        class="layout-container__body-left"
        :class="{ collapsed: navigationCollapsed }"
        :inert="isMobileNavigation && !mobileNavigationOpen"
        @keydown.esc="mobileNavigationOpen = false"
      >
        <div class="navigation-label" v-show="isMobileNavigation || !conf.isCollapse">{{ $t('layout.navigation') }}</div>
        <el-scrollbar class="nav-scrollbar">
          <el-menu
            :collapse="!isMobileNavigation && conf.isCollapse"
            :key="menuRenderKey"
            :default-active="activeMenuIndex"
            :default-openeds="activeGroupIndexes"
            :unique-opened="true"
          >
            <template v-for="item in visibleNavList" :key="item.path || item.name">
              <el-sub-menu
                v-if="item.children?.length"
                :index="item.path"
                :popper-offset="-110"
                @mouseenter="setHoveredMenuItem(item)"
                @mouseleave="setHoveredMenuItem()"
              >
                <template #title>
                  <span class="menu-icon" :aria-label="getMenuName(item)" v-html="getMenuItemIcon(item)"></span>
                  <span class="menu-item-name">{{ getMenuName(item) }}</span>
                  <span class="menu-expand-arrow" aria-hidden="true"></span>
                </template>
                <el-menu-item
                  v-for="child in item.children"
                  :key="child.path"
                  :index="child.path"
                  @mouseenter="setHoveredMenuItem(child)"
                  @mouseleave="setHoveredMenuItem(item)"
                  @click="navigateNavItem(child)"
                >
                  <span class="menu-icon" :aria-label="getMenuName(child)" v-html="getMenuItemIcon(child)"></span>
                  <span class="menu-item-name">{{ getMenuName(child) }}</span>
                </el-menu-item>
              </el-sub-menu>
              <el-menu-item
                v-else
                :index="item.path || `action:${item.name}`"
                @mouseenter="setHoveredMenuItem(item)"
                @mouseleave="setHoveredMenuItem()"
                @click="navigateNavItem(item)"
              >
                <span class="menu-icon" :aria-label="getMenuName(item)" v-html="getMenuItemIcon(item)"></span>
                <span class="menu-item-name">{{ getMenuName(item) }}</span>
              </el-menu-item>
            </template>
          </el-menu>
        </el-scrollbar>
      </aside>
      <button
        v-if="isMobileNavigation && mobileNavigationOpen"
        class="mobile-navigation-backdrop"
        type="button"
        :aria-label="$t('common.close')"
        @click="mobileNavigationOpen = false"
      />
      <el-main class="layout-container__body-main">
        <div class="route-stage">
          <router-view />
        </div>
      </el-main>
    </el-container>
  </el-container>
  <InstallTaskDrawer
    v-model="globalTaskDrawer.show"
    :task-id="globalTaskDrawer.taskId"
  />
</template>

<style scoped lang="less">
.layout-container {
  height: 100vh;
  color: var(--text-primary);
  background: var(--surface-page);

  &__header {
    z-index: 10;
    flex: 0 0 72px;
    height: 72px;
    padding: 0 22px 0 18px;
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 1px solid var(--border-subtle);
    background: color-mix(in srgb, var(--surface-card) 94%, transparent);
    backdrop-filter: blur(14px);

    &-left {
      width: 214px;
      display: flex;
      align-items: center;
      gap: 11px;
      transition: width 0.25s ease;

      &.collapsed {
        width: 58px;

        .brand-copy {
          width: 0;
          opacity: 0;
        }
      }
    }

    &-right {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 14px;
    }
  }

  .brand-mark {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid rgba(var(--primary-color), 0.2);
    border-radius: 12px;
    background: #fff7ed;
    box-shadow: 0 6px 16px rgba(var(--primary-color), 0.12);

    .logo {
      width: 38px;
      height: 38px;
      object-fit: cover;
      border-radius: 10px;
    }
  }

  .brand-copy {
    min-width: 0;
    width: 154px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: hidden;
    opacity: 1;
    transition: all 0.2s ease;

    .logo-text {
      width: 148px;
      height: auto;
      object-fit: contain;
      object-position: left;
    }

    span {
      color: var(--text-placeholder);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.16em;
    }
  }

  .sidebar-trigger {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    color: var(--text-tertiary);
    background: var(--surface-subtle);
    transition: all 0.18s ease;

    &:hover {
      border-color: rgba(var(--primary-color), 0.35);
      color: rgb(var(--primary-color));
      background: rgba(var(--primary-color), 0.07);
    }
  }

  .page-context {
    min-width: 0;
    margin-left: 2px;

    .page-title {
      color: var(--text-primary);
      font-size: 16px;
      font-weight: 680;
      line-height: 1.4;
    }

    .page-description {
      margin-top: 2px;
      color: var(--text-tertiary);
      font-size: 12px;
      white-space: nowrap;
    }
  }

  .server-status {
    height: 34px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    gap: 7px;
    border: 1px solid rgba(var(--success-color), 0.18);
    border-radius: 999px;
    color: rgb(var(--success-color));
    background: rgba(var(--success-color), 0.07);
    font-size: 12px;
    font-weight: 600;

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: rgb(var(--success-color));
      box-shadow: 0 0 0 4px rgba(var(--success-color), 0.12);
    }
  }

  .task-center-trigger {
    min-width: 82px;
    height: 38px;
    padding: 0 8px 0 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border: 1px solid var(--border-subtle);
    border-radius: 11px;
    color: var(--text-secondary);
    background: var(--surface-subtle);
    font-size: 12px;
    font-weight: 650;
    cursor: pointer;
    transition: all 0.18s ease;

    &:hover {
      border-color: rgba(var(--primary-color), 0.35);
      color: rgb(var(--primary-color));
      background: rgba(var(--primary-color), 0.07);
    }
  }

  .task-count {
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 7px;
    color: var(--text-tertiary);
    background: var(--surface-muted);
    font-size: 11px;
    line-height: 1;

    &.active {
      color: #fff;
      background: rgb(var(--primary-color));
      box-shadow: 0 4px 10px rgba(var(--primary-color), 0.25);
    }
  }

  .user-menu {
    min-width: 156px;
    height: 46px;
    padding: 5px 8px 5px 6px;
    display: flex;
    align-items: center;
    gap: 9px;
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    background: var(--surface-subtle);
    cursor: pointer;
    transition: border-color 0.18s ease;

    &:hover {
      border-color: var(--border-strong);
    }

    .avatar {
      width: 34px;
      height: 34px;
      flex: 0 0 34px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      color: #fff;
      background: linear-gradient(145deg, var(--primary-color-light), var(--primary-gradient-end));
      font-size: 14px;
      font-weight: 750;
      box-shadow: 0 5px 12px rgba(var(--primary-color), 0.22);
    }

    .user-copy {
      min-width: 0;
      display: flex;
      flex: 1;
      flex-direction: column;

      strong {
        overflow: hidden;
        color: var(--text-primary);
        font-size: 12px;
        font-weight: 650;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      span {
        margin-top: 1px;
        color: var(--text-placeholder);
        font-size: 10px;
      }
    }

    .chevron {
      color: var(--text-placeholder);
      font-size: 14px;
    }
  }

  &__body {
    min-height: 0;
    position: relative;

    &-left {
      width: 232px;
      flex: 0 0 232px;
      padding: 18px 12px 14px;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border-subtle);
      background: var(--surface-card);
      transition:
        width 0.25s ease,
        flex-basis 0.25s ease;

      &.collapsed {
        width: 78px;
        flex-basis: 78px;
        padding-inline: 10px;
      }
    }

    &-main {
      min-width: 0;
      height: 100%;
      padding: 22px 24px 28px;
      overflow: hidden;
      background:
        radial-gradient(circle at 100% 0, rgba(var(--primary-color), 0.045), transparent 26rem),
        var(--surface-page);
    }
  }

  .navigation-label {
    padding: 0 12px 10px;
    color: var(--text-placeholder);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.13em;
  }

  .nav-scrollbar {
    min-height: 0;
    flex: 1;
  }

  .el-menu {
    width: 100%;
    border-right: 0;
    background: transparent;

    .menu-icon {
      width: 22px;
      height: 22px;
      flex: 0 0 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .menu-icon :deep(svg) {
      width: 22px;
      height: 22px;
      display: block;
    }

    .menu-item-name {
      margin-left: 12px;
      color: var(--menu-item-name-color);
      font-size: 14px;
      font-weight: 550;
      transition: color 0.18s ease;
    }

    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      width: 100%;
      height: 46px;
      margin-bottom: 4px;
      padding: 0 13px !important;
      border-radius: 11px;
      color: var(--text-secondary);
      transition: all 0.18s ease;

      &:hover {
        color: var(--text-primary);
        background: var(--surface-subtle);
      }

      &.is-active {
        color: rgb(var(--primary-color));
        background: linear-gradient(90deg, rgba(var(--primary-color), 0.13), rgba(var(--primary-color), 0.06));
        box-shadow: inset 3px 0 0 rgb(var(--primary-color));

        .menu-item-name {
          color: rgb(var(--primary-color));
          font-weight: 650;
        }
      }
    }

    :deep(.el-sub-menu__title) {
      padding-right: 42px !important;

      .menu-item-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .el-sub-menu__icon-arrow {
        display: none !important;
      }
    }

    .menu-expand-arrow {
      position: absolute;
      top: 50%;
      right: 15px;
      width: 7px;
      height: 7px;
      border-right: 1.5px solid currentColor;
      border-bottom: 1.5px solid currentColor;
      pointer-events: none;
      transform: translateY(-70%) rotate(45deg);
      transition: transform 0.2s ease;
    }

    :deep(.el-sub-menu.is-opened > .el-sub-menu__title) .menu-expand-arrow {
      transform: translateY(-30%) rotate(225deg);
    }

    :deep(.el-sub-menu > .el-menu) {
      width: calc(100% - 18px);
      margin: 2px 0 8px 18px;
      padding: 4px 0 3px 10px;
      border-left: 1px solid var(--border-subtle);
      background: transparent !important;
    }

    :deep(.el-sub-menu > .el-menu > .el-menu-item) {
      width: calc(100% - 4px);
      height: 42px;
      margin-bottom: 2px;
      padding: 0 10px !important;
      border-radius: 9px;
    }

    &.el-menu--collapse {
      :deep(.el-menu-item),
      :deep(.el-sub-menu__title) {
        justify-content: center;
        padding: 0 !important;
      }
    }
  }

  .route-stage {
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .mobile-navigation-backdrop {
    display: none;
  }
}

@media (max-width: 1100px) {
  .layout-container {
    .page-description,
    .server-status {
      display: none;
    }

    &__header-right {
      gap: 8px;
    }
  }
}

@media (max-width: 768px) {
  .layout-container {
    &__header {
      height: 64px;
      flex-basis: 64px;
      padding: 0 12px;
      gap: 9px;

      &-left {
        width: 46px !important;

        .brand-copy {
          display: none;
        }
      }
    }

    .brand-mark {
      width: 38px;
      height: 38px;
      flex-basis: 38px;
    }

    .page-context {
      min-width: 0;
      flex: 1;

      .page-title {
        overflow: hidden;
        font-size: 14px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .user-menu {
      min-width: 42px;
      width: 42px;
      padding: 4px;

      .user-copy,
      .chevron {
        display: none;
      }
    }

    :deep(.theme-switch) {
      display: none;
    }

    .task-center-trigger {
      min-width: 42px;
      width: 42px;
      padding: 0;

      .task-center-label {
        display: none;
      }

      .task-count {
        position: absolute;
        min-width: 17px;
        height: 17px;
        padding: 0 4px;
        margin: -25px -28px 0 0;
        border-radius: 6px;
        font-size: 9px;
      }
    }

    &__body-left,
    &__body-left.collapsed {
      position: fixed;
      z-index: 32;
      top: 64px;
      bottom: 0;
      left: 0;
      width: min(84vw, 304px);
      max-width: 304px;
      padding: 16px 12px calc(16px + env(safe-area-inset-bottom, 0px));
      border-right: 1px solid var(--border-subtle);
      box-shadow: 18px 0 42px rgba(15, 23, 42, 0.2);
      transform: translateX(0);
      transition: transform 0.22s ease;

      &.collapsed {
        width: min(84vw, 304px);
        transform: translateX(-105%);
      }

      .el-menu {
        :deep(.el-menu-item),
        :deep(.el-sub-menu__title) {
          justify-content: flex-start;
          padding: 0 13px !important;
        }
      }
    }

    &__body-main {
      width: 100%;
      padding: 14px 12px calc(18px + env(safe-area-inset-bottom, 0px));
    }

    .mobile-navigation-backdrop {
      position: fixed;
      z-index: 31;
      inset: 64px 0 0;
      display: block;
      border: 0;
      background: rgba(15, 23, 42, 0.46);
      backdrop-filter: blur(2px);
    }
  }
}

@media (max-width: 560px) {
  .layout-container {
    &__header-right {
      gap: 6px;
    }

    .task-center-trigger {
      display: none;
    }
  }
}

@media (max-width: 420px) {
  .layout-container {
    &__header {
      padding-inline: 10px;
      gap: 7px;
    }

    .page-context {
      display: none;
    }
  }
}
</style>

<style lang="less">
.global-task-popover.el-popper {
  padding: 0 !important;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 15px;
  background: var(--surface-raised);
  box-shadow: var(--shadow-lg);
}

.global-task-panel {
  color: var(--text-primary);

  &__header {
    min-height: 70px;
    padding: 15px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 1px solid var(--border-subtle);
    background:
      radial-gradient(circle at 100% 0, rgba(var(--primary-color), 0.09), transparent 62%),
      var(--surface-raised);

    > div {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    strong {
      font-size: 14px;
      font-weight: 700;
    }

    span {
      color: var(--text-tertiary);
      font-size: 11px;
    }
  }
}

.global-task-empty {
  min-height: 116px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 9px;
  color: var(--text-placeholder);
  font-size: 12px;
}

.global-task-item {
  width: 100%;
  padding: 14px 16px;
  display: block;
  border: 0;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.18s ease;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: var(--surface-subtle);
  }

  &__top {
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    strong {
      overflow: hidden;
      font-size: 13px;
      font-weight: 680;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: rgb(var(--primary-color));
      font-size: 12px;
      font-weight: 700;
    }
  }

  &__meta {
    margin-bottom: 9px;
    overflow: hidden;
    color: var(--text-tertiary);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
