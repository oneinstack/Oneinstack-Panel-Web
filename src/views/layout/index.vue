<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
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
  activeColor: ItemColor
  children?: NavItem[]
  localeKey?: string
  event?: () => void
  adminOnly?: boolean
  matrixKeys?: string[]
  actionKeys?: string[]
}

const route = useRoute()
const router = useRouter()

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
      icon: 'home',
      matrixKeys: ['dashboard'],
      activeColor: {
        light: ['#eab170', '#8B8B8B'],
        dark: ['#eab170', '#ffffff']
      }
    },
    {
      name: 'Websites',
      path: '/website',
      icon: 'website',
      matrixKeys: ['website'],
      activeColor: {
        light: ['#8B8B8B', '#eab170'],
        dark: ['#ffffff', '#eab170']
      }
    },
    {
      name: 'Databases',
      path: '/database',
      icon: 'database',
      matrixKeys: ['database'],
      activeColor: {
        light: ['#eab170', '#8B8B8B'],
        dark: ['#eab170', '#ffffff']
      }
    },
    {
      name: 'Containers',
      path: '/container',
      icon: 'software',
      matrixKeys: ['container'],
      activeColor: {
        light: ['#8B8B8B', '#eab170'],
        dark: ['#ffffff', '#eab170']
      }
    },
    {
      name: 'Security',
      path: '/security',
      icon: 'security',
      matrixKeys: ['security'],
      activeColor: {
        light: ['#eab170', '#8B8B8B'],
        dark: ['#eab170', '#ffffff']
      }
    },
    {
      name: 'Files',
      path: '/file',
      icon: 'file',
      matrixKeys: ['file'],
      activeColor: {
        light: ['#eab170', '#8B8B8B'],
        dark: ['#eab170', '#ffffff']
      }
    },
    {
      name: 'Software store',
      path: '/software',
      icon: 'software',
      matrixKeys: ['software'],
      activeColor: {
        light: ['#8B8B8B', '#eab170'],
        dark: ['#ffffff', '#eab170']
      }
    },
    {
      name: 'Approval center',
      path: '/approval-center',
      icon: 'log',
      matrixKeys: ['approval'],
      activeColor: {
        light: ['#8B8B8B', '#eab170'],
        dark: ['#ffffff', '#eab170']
      }
    },
    {
      name: 'Operations',
      path: '',
      icon: 'monitor',
      localeKey: 'operations',
      activeColor: {
        light: ['#8B8B8B', '#eab170'],
        dark: ['#ffffff', '#eab170']
      },
      children: [
        {
          name: 'Monitoring',
          path: '/monitor',
          icon: 'monitor',
          adminOnly: true,
          matrixKeys: ['monitoring'],
          activeColor: {
            light: ['#eab170', '#8B8B8B'],
            dark: ['#eab170', '#ffffff']
          }
        },
        {
          name: 'Bastion',
          path: '/bastion',
          icon: 'security',
          matrixKeys: ['bastion'],
          activeColor: {
            light: ['#eab170', '#8B8B8B'],
            dark: ['#eab170', '#ffffff']
          }
        },
        {
          name: 'Audit logs',
          path: '/log',
          icon: 'log',
          adminOnly: true,
          matrixKeys: ['audit'],
          activeColor: {
            light: ['#eab170', '#8B8B8B'],
            dark: ['#eab170', '#ffffff']
          }
        },
        {
          name: 'Runtime logs',
          path: '/runtime-log',
          icon: 'log',
          adminOnly: true,
          matrixKeys: ['runtimeLog'],
          activeColor: {
            light: ['#8B8B8B', '#eab170'],
            dark: ['#ffffff', '#eab170']
          }
        },
        {
          name: 'Secure terminal',
          path: '/terminal',
          icon: 'terminal',
          matrixKeys: ['terminal'],
          actionKeys: ['terminal.access'],
          activeColor: {
            light: ['#8B8B8B', '#eab170'],
            dark: ['#ffffff', '#eab170']
          }
        },
        {
          name: 'Scheduled tasks',
          path: '/task',
          icon: 'task',
          matrixKeys: ['cron'],
          activeColor: {
            light: ['#8B8B8B', '#eab170'],
            dark: ['#ffffff', '#eab170']
          }
        }
      ]
    },
    {
      name: 'System',
      path: '',
      icon: 'setting',
      localeKey: 'system',
      activeColor: {
        light: ['#8B8B8B', '#eab170'],
        dark: ['#ffffff', '#eab170']
      },
      children: [
        {
          name: 'Panel settings',
          path: '/setting',
          icon: 'setting',
          matrixKeys: ['panelSettings'],
          activeColor: {
            light: ['#8B8B8B', '#eab170'],
            dark: ['#ffffff', '#eab170']
          }
        },
        {
          name: 'Config snapshots',
          path: '/config-snapshots',
          icon: 'log',
          adminOnly: true,
          matrixKeys: ['configSnapshots'],
          actionKeys: ['config.snapshot.read'],
          activeColor: {
            light: ['#8B8B8B', '#eab170'],
            dark: ['#ffffff', '#eab170']
          }
        },
        {
          name: 'System management',
          path: '/system-management',
          icon: 'setting',
          actionKeys: ['system.settings.read'],
          activeColor: {
            light: ['#8B8B8B', '#eab170'],
            dark: ['#ffffff', '#eab170']
          }
        },
        {
          name: 'User management',
          path: '/user-management',
          icon: 'user-management',
          matrixKeys: ['userManagement'],
          activeColor: {
            light: ['#8B8B8B', '#eab170'],
            dark: ['#ffffff', '#eab170']
          }
        }
      ]
    },
    {
      name: 'Logout',
      path: '',
      icon: 'exit',
      matrixKeys: ['logout'],
      activeColor: {
        light: ['#8B8B8B', '#eab170'],
        dark: ['#ffffff', '#eab170']
      },
      event: async () => {
        Beturn()
      }
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
const menuIndex = (item: NavItem) => item.path || `group:${item.localeKey || item.name}`
const visibleNavList = computed(() =>
  conf.navList.reduce<NavItem[]>((result, item) => {
    if (item.children?.length) {
      const children = item.children.filter((child) => {
        if (child.adminOnly && !isPrivilegedUser.value) return false
        return hasMenuPermission(child)
      })

      if (children.length) {
        result.push({
          ...item,
          children
        })
      }
      return result
    }

    if (item.adminOnly && !item.matrixKeys?.length && !isPrivilegedUser.value) {
      return result
    }
    if (hasMenuPermission(item)) {
      result.push(item)
    }
    return result
  }, [])
)
const currentNav = computed(() => {
  for (const item of visibleNavList.value) {
    if (item.children?.length) {
      const matchedChild = item.children.find((child) => child.path && route.path.startsWith(child.path))
      if (matchedChild) return matchedChild
    }
    if (item.path && route.path.startsWith(item.path)) return item
  }

  const firstGroupChild = visibleNavList.value.find((item) => item.children?.length)?.children?.[0]
  return firstGroupChild ?? visibleNavList.value[0]
})
const activeMenuIndex = computed(() => currentNav.value?.path || '')
const openedMenuIndexes = computed(() =>
  visibleNavList.value
    .filter((item) => item.children?.some((child) => child.path && route.path.startsWith(child.path)))
    .map((item) => menuIndex(item))
)
const navigateNavItem = (item: NavItem) => {
  if (item.path && route.path !== item.path) {
    router.push(item.path)
  }
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
  void softwareTaskStore.loadActive().catch(() => undefined)
  void Api.getAccessMatrix()
    .then((response) => {
      sconfig.setAccessMatrix(response?.data || {})
    })
    .catch(() => {
      sconfig.setAccessMatrix({})
    })
})

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
  conf.isCollapse = !conf.isCollapse
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
        :aria-label="conf.isCollapse ? $t('layout.expandNavigation') : $t('layout.collapseNavigation')"
        @click="BindButton"
      >
        <el-icon :size="18">
          <Expand v-if="conf.isCollapse" />
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
        <el-dropdown placement="bottom-end">
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
      <aside class="layout-container__body-left" :class="{ collapsed: conf.isCollapse }">
        <div class="navigation-label" v-show="!conf.isCollapse">{{ $t('layout.navigation') }}</div>
        <el-scrollbar class="nav-scrollbar">
          <el-menu :collapse="conf.isCollapse" :default-active="activeMenuIndex" :default-openeds="openedMenuIndexes">
            <template v-for="item in visibleNavList" :key="menuIndex(item)">
              <el-sub-menu v-if="item.children" :index="menuIndex(item)" :popper-offset="-110">
                <template #title>
                  <div class="submenu-title">
                    <v-s-icon
                      class="submenu-title__icon"
                      :name="item.icon"
                      :color="
                        item.children?.some((child) => child.path && route.path.startsWith(child.path))
                          ? item.activeColor[sapp.theme]
                          : conf.defaultColor[sapp.theme]
                      "
                      size="22"
                    />
                    <span class="menu-item-name submenu-title__text">{{ getMenuName(item) }}</span>
                  </div>
                </template>
                <el-menu-item
                  v-for="child in item.children"
                  :key="child.path"
                  :index="child.path"
                  @click="navigateNavItem(child)"
                >
                  <v-s-icon
                    :name="child.icon"
                    :color="
                      child.path && route.path.includes(child.path)
                        ? child.activeColor[sapp.theme]
                        : conf.defaultColor[sapp.theme]
                    "
                    size="22"
                  />
                  <span class="menu-item-name">{{ getMenuName(child) }}</span>
                </el-menu-item>
              </el-sub-menu>
              <el-menu-item v-else :index="item.path || `action:${item.name}`" @click="navigateNavItem(item)">
                <v-s-icon
                  :name="item.icon"
                  :color="
                    item.path && route.path.includes(item.path)
                      ? item.activeColor[sapp.theme]
                      : conf.defaultColor[sapp.theme]
                  "
                  size="22"
                />
                <span class="menu-item-name">{{ getMenuName(item) }}</span>
              </el-menu-item>
            </template>
          </el-menu>
        </el-scrollbar>
      </aside>
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

    .submenu-title {
      width: 100%;
      min-width: 0;
      display: grid;
      grid-template-columns: 22px minmax(0, 1fr);
      align-items: center;
      column-gap: 12px;
      overflow: hidden;

      &__icon {
        width: 22px;
        height: 22px;
      }

      &__text {
        width: 100%;
        min-width: 0;
        margin-left: 0;
      }
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
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 10px;
      overflow: hidden;

      .menu-item-name {
        width: 100%;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .el-sub-menu__icon-arrow {
        position: static !important;
        top: auto !important;
        right: auto !important;
        margin: 0 !important;
        justify-self: end;
        flex-shrink: 0;
        transform-origin: center;
        color: var(--text-placeholder);
      }
    }

    :deep(.el-sub-menu .el-menu-item) {
      padding-left: 48px !important;

      .menu-item-name {
        font-size: 13px;
        font-weight: 520;
      }
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

@media (max-width: 760px) {
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
      .page-title {
        font-size: 14px;
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
      width: 68px;
      flex-basis: 68px;
      padding-inline: 8px;

      .navigation-label,
      .menu-item-name {
        display: none;
      }

      .el-menu {
        :deep(.el-menu-item),
        :deep(.el-sub-menu__title) {
          justify-content: center;
          padding: 0 !important;
        }
      }
    }

    &__body-main {
      padding: 16px 14px 22px;
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
