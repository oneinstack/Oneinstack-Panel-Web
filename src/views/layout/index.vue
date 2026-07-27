<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import ThemeSwitch from './components/theme-switch.vue'
import sapp from '@/sstore/sapp'
import { Bell, Expand, Fold } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import sconfig from '@/sstore/sconfig'
import { Api } from '@/api/Api'
import softwareTaskStore, { type SoftwareTask } from '@/sstore/softwareTask'
import InstallTaskDrawer from '@/views/pages/software/components/InstallTaskDrawer.vue'


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
  event?: () => void
  adminOnly?: boolean
}

const route = useRoute()

const conf = reactive({
  isCollapse: false,
  searchValue: '',
  defaultColor: {
    light: ['#8B8B8B', '#8B8B8B'],
    dark: ['#8B8B8B', '#8B8B8B']
  },
  navList: [
    {
      name: '首页',
      path: '/home',
      icon: 'home',
      activeColor: {
        light: ['#eab170', '#8B8B8B'],
        dark: ['#eab170', '#ffffff']
      }
    },
    {
      name: '网站',
      path: '/website',
      icon: 'website',
      activeColor: {
        light: ['#8B8B8B', '#eab170'],
        dark: ['#ffffff', '#eab170']
      }
    },
    {
      name: '数据库',
      path: '/database',
      icon: 'database',
      activeColor: {
        light: ['#eab170', '#8B8B8B'],
        dark: ['#eab170', '#ffffff']
      }
    },
    {
      name: '监控告警',
      path: '/monitor',
      icon: 'monitor',
      adminOnly: true,
      activeColor: {
        light: ['#eab170', '#8B8B8B'],
        dark: ['#eab170', '#ffffff']
      }
    },
    {
      name: '安全',
      path: '/security',
      icon: 'security',
      activeColor: {
        light: ['#eab170', '#8B8B8B'],
        dark: ['#eab170', '#ffffff']
      }
    },
    {
      name: '文件',
      path: '/file',
      icon: 'file',
      activeColor: {
        light: ['#eab170', '#8B8B8B'],
        dark: ['#eab170', '#ffffff']
      }
    },
    {
      name: '审计日志',
      path: '/log',
      icon: 'log',
      adminOnly: true,
      activeColor: {
        light: ['#eab170', '#8B8B8B'],
        dark: ['#eab170', '#ffffff']
      }
    },
    {
      name: '运行日志',
      path: '/runtime-log',
      icon: 'log',
      adminOnly: true,
      activeColor: {
        light: ['#8B8B8B', '#eab170'],
        dark: ['#ffffff', '#eab170']
      }
    },
    // {
    //   name: '终端',
    //   path: '/terminal',
    //   icon: 'terminal',
    //   activeColor: {
    //     light: ['#8B8B8B', '#eab170'],
    //     dark: ['#ffffff', '#eab170']
    //   }
    // },
    {
      name: '计划任务',
      path: '/task',
      icon: 'task',
      activeColor: {
        light: ['#8B8B8B', '#eab170'],
        dark: ['#ffffff', '#eab170']
      }
    },
    {
      name: '软件商店',
      path: '/software',
      icon: 'software',
      activeColor: {
        light: ['#8B8B8B', '#eab170'],
        dark: ['#ffffff', '#eab170']
      }
    },
    {
      name: '面板设置',
      path: '/setting',
      icon: 'setting',
      activeColor: {
        light: ['#8B8B8B', '#eab170'],
        dark: ['#ffffff', '#eab170']
      }
    },
    {
      name: '退出',
      path: '',
      icon: 'exit',
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
const visibleNavList = computed(() =>
  conf.navList.filter(item => !item.adminOnly || sconfig.userInfo?.user?.isAdmin)
)
const currentNav = computed(() => {
  const matched = visibleNavList.value.find(item => item.path && route.path.startsWith(item.path))
  return matched ?? visibleNavList.value[0]
})
const pageDescriptions: Record<string, string> = {
  '/home': '查看服务器资源与服务运行状态',
  '/website': '管理站点、域名、证书与运行环境',
  '/database': '管理数据库实例、账号与远程连接',
  '/monitor': '跟踪资源指标、告警规则与通知事件',
  '/security': '管理防火墙、登录防护与系统安全',
  '/file': '浏览、上传和维护服务器文件',
  '/log': '追踪关键操作与安全审计记录',
  '/runtime-log': '查看面板与服务运行日志',
  '/task': '编排周期任务与自动化脚本',
  '/software': '安装、升级和维护服务器软件',
  '/setting': '配置面板、安全策略与用户账户'
}
const pageDescription = computed(() => pageDescriptions[currentNav.value?.path] || 'OneinStack 服务器管理中心')
const displayName = computed(
  () => sconfig.userInfo?.user?.username || sconfig.userInfo?.username || '管理员'
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
const operationNames: Record<string, string> = {
  install: '安装',
  upgrade: '升级',
  uninstall: '卸载',
  start: '启动',
  stop: '停止',
  restart: '重启',
  reload: '平滑重载',
  configure: '配置发布'
}
const taskStatusName = (task: SoftwareTask) => {
  const labels: Record<string, string> = {
    queued: '排队中',
    resolving: '正在获取脚本',
    prechecking: '正在检查环境',
    installing: '正在安装',
    upgrading: '正在升级',
    uninstalling: '正在卸载',
    starting: '正在启动',
    stopping: '正在停止',
    restarting: '正在重启',
    reloading: '正在重载',
    configuring: '正在发布配置',
    verifying: '正在验证',
    finalizing: '正在保存状态',
    canceling: '正在取消',
    rolling_back: '正在回滚'
  }
  return labels[task.status] || task.message || task.status
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
      const operation = operationNames[task.operation] || '任务'
      ElNotification({
        title: succeeded ? `${operation}成功` : `${operation}未完成`,
        message: succeeded
          ? `${task.component} 已处理完成，页面状态已自动更新`
          : `${task.component}：${task.errorMessage || task.message || '请打开任务查看详情'}`,
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
})

const Beturn = () => {
  ElMessageBox.confirm('退出面板登录，是否继续？', '退出登录', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
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
                message: '退出成功'
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
          <span>SERVER CONTROL</span>
        </div>
      </div>
      <button class="sidebar-trigger" type="button" :aria-label="conf.isCollapse ? '展开导航' : '收起导航'" @click="BindButton">
        <el-icon :size="18">
          <Expand v-if="conf.isCollapse" />
          <Fold v-else />
        </el-icon>
      </button>
      <div class="page-context">
        <div class="page-title">{{ currentNav?.name }}</div>
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
              :aria-label="`当前运行任务 ${activeSoftwareTasks.length} 个`"
            >
              <el-icon :size="17"><Bell /></el-icon>
              <span class="task-center-label">任务</span>
              <span class="task-count" :class="{ active: activeSoftwareTasks.length > 0 }">
                {{ activeSoftwareTasks.length }}
              </span>
            </button>
          </template>
          <div class="global-task-panel">
            <div class="global-task-panel__header">
              <div>
                <strong>当前运行任务</strong>
                <span>安装和维护任务会在后台持续执行</span>
              </div>
              <el-tag size="small" :type="activeSoftwareTasks.length ? 'primary' : 'info'">
                {{ activeSoftwareTasks.length }} 个
              </el-tag>
            </div>
            <div v-if="!activeSoftwareTasks.length" class="global-task-empty">
              <el-icon :size="22"><Bell /></el-icon>
              <span>当前没有运行中的任务</span>
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
                {{ operationNames[task.operation] || '任务' }} · {{ taskStatusName(task) }}
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
          <span>服务正常</span>
        </div>
        <theme-switch />
        <el-dropdown placement="bottom-end">
          <div class="user-menu">
            <div class="avatar">{{ displayInitial }}</div>
            <div class="user-copy">
              <strong>{{ displayName }}</strong>
              <span>{{ sconfig.userInfo?.user?.isAdmin ? '超级管理员' : '面板用户' }}</span>
            </div>
            <span class="chevron">⌄</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="Beturn">安全退出</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container class="layout-container__body">
      <aside class="layout-container__body-left" :class="{ collapsed: conf.isCollapse }">
        <div class="navigation-label" v-show="!conf.isCollapse">管理中心</div>
        <el-scrollbar class="nav-scrollbar">
          <el-menu :collapse="conf.isCollapse" :default-active="route.path.match(/\/\w*/)?.[0]" router>
            <template v-for="item in visibleNavList" :key="item.path || item.name">
              <el-sub-menu v-if="item.children" :index="item.path" :popper-offset="-110">
                <template #title>
                  <v-s-icon
                    :name="item.icon"
                    :color="
                      item.path && route.path.includes(item.path)
                        ? item.activeColor[sapp.theme]
                        : conf.defaultColor[sapp.theme]
                    "
                    size="22"
                  />
                  <span class="menu-item-name">{{ item.name }}</span>
                </template>
                <el-menu-item
                  v-for="child in item.children"
                  :key="child.path"
                  :index="child.path"
                  @click="child.event?.()"
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
                  <span class="menu-item-name">{{ child.name }}</span>
                </el-menu-item>
              </el-sub-menu>
              <el-menu-item v-else :index="item.path || route.path" @click="item.event?.()">
                <v-s-icon
                  :name="item.icon"
                  :color="
                    item.path && route.path.includes(item.path)
                      ? item.activeColor[sapp.theme]
                      : conf.defaultColor[sapp.theme]
                  "
                  size="22"
                />
                <span class="menu-item-name">{{ item.name }}</span>
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
      background: linear-gradient(145deg, #fb923c, #ea580c);
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
