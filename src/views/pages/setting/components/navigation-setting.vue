<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import i18n from '@/lang'
import { useConfigStore } from '@/stores/modules/config'

interface NavigationOption {
  path: string
  labelKey: string
}

const sconfig = useConfigStore()

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const navigationOptions: NavigationOption[] = [
  { path: '/home', labelKey: 'layout.menu.dashboard' },
  { path: '/website', labelKey: 'layout.menu.website' },
  { path: '/database', labelKey: 'layout.menu.database' },
  { path: '/software', labelKey: 'layout.menu.software' },
  { path: '/container', labelKey: 'layout.menu.container' },
  { path: '/file', labelKey: 'layout.menu.file' },
  { path: '/terminal', labelKey: 'layout.menu.terminal' },
  { path: '/task', labelKey: 'layout.menu.cron' },
  { path: '/monitor', labelKey: 'layout.menu.monitoring' },
  { path: '/bastion', labelKey: 'layout.menu.bastion' },
  { path: '/runtime-log', labelKey: 'layout.menu.runtimeLog' },
  { path: '/security', labelKey: 'layout.menu.security' },
  { path: '/certificate', labelKey: 'layout.menu.certificate' },
  { path: '/approval-center', labelKey: 'layout.menu.approval' },
  { path: '/log', labelKey: 'layout.menu.audit' },
  { path: '/config-snapshots', labelKey: 'layout.menu.configSnapshots' },
  { path: '/system-management', labelKey: 'layout.menu.systemManagement' },
  { path: '/user-management', labelKey: 'layout.menu.userManagement' }
]

const hiddenCount = computed(() => sconfig.hiddenMenuPaths.length)

const isVisible = (path: string) => !sconfig.isMenuHidden(path)

const toggleVisibility = (path: string, visible: boolean) => {
  sconfig.setMenuHidden(path, !visible)
  ElMessage.success(
    visible
      ? t('setting.navigation.shown', 'Navigation entry shown')
      : t('setting.navigation.hidden', 'Navigation entry hidden')
  )
}

const resetVisibility = () => {
  if (!hiddenCount.value) return
  sconfig.clearHiddenMenus()
  ElMessage.success(t('setting.navigation.resetSuccess', 'Navigation entries restored'))
}
</script>

<template>
  <section class="navigation-setting">
    <header class="navigation-setting__header">
      <div>
        <h2>{{ t('setting.navigation.title', 'Navigation display') }}</h2>
        <p>{{ t('setting.navigation.description', 'Choose which entries appear in the left navigation for this browser.') }}</p>
      </div>
      <el-button :disabled="!hiddenCount" @click="resetVisibility">
        {{ t('setting.navigation.reset', 'Restore all') }}
      </el-button>
    </header>

    <el-alert
      :title="t('setting.navigation.tip', 'Hiding an entry only changes the left navigation. It does not remove the route or change permissions.')"
      type="info"
      :closable="false"
      show-icon
    />

    <div class="navigation-setting__summary">
      <strong>{{ t('setting.navigation.summary', '{count} entries hidden', { count: hiddenCount }) }}</strong>
      <span>{{ t('setting.navigation.localOnly', 'Saved in this browser') }}</span>
    </div>

    <div class="navigation-setting__grid">
      <div v-for="item in navigationOptions" :key="item.path" class="navigation-option">
        <div class="navigation-option__copy">
          <strong>{{ t(item.labelKey) }}</strong>
          <span>{{ item.path }}</span>
        </div>
        <el-switch
          :model-value="isVisible(item.path)"
          :aria-label="t(item.labelKey)"
          @update:model-value="toggleVisibility(item.path, Boolean($event))"
        />
      </div>
    </div>
  </section>
</template>

<style scoped lang="less">
.navigation-setting {
  display: grid;
  gap: 22px;
}

.navigation-setting__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;

  h2 {
    margin: 0 0 8px;
    color: var(--text-primary);
    font-size: 18px;
  }

  p {
    max-width: 720px;
    margin: 0;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.7;
  }
}

.navigation-setting__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 13px;

  strong {
    color: var(--text-primary);
  }
}

.navigation-setting__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.navigation-option {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-subtle);
}

.navigation-option__copy {
  min-width: 0;
  display: grid;
  gap: 5px;

  strong {
    overflow: hidden;
    color: var(--text-primary);
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    overflow: hidden;
    color: var(--text-tertiary);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 700px) {
  .navigation-setting__header,
  .navigation-setting__summary {
    align-items: stretch;
    flex-direction: column;
  }

  .navigation-setting__grid {
    grid-template-columns: 1fr;
  }
}
</style>
