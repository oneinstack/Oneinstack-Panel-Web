<script setup lang="ts">
import { computed, markRaw, onMounted, ref, watch } from 'vue'
import panelSetting from './panel-setting.vue'
import NetworkSetting from './network-setting.vue'
import PanelUpdate from './panel-update.vue'
import PanelBackup from './panel-backup.vue'
import AccountSecurity from './account-security.vue'
import AppearanceSetting from './appearance-setting.vue'
import SettingSectionTabs from './setting-section-tabs.vue'
import { Api } from '@/api/modules'
import { ElMessage } from 'element-plus'
import i18n from '@/lang'
import { useConfigStore } from '@/stores/modules/config'
import { getPanelSettingsCapabilities } from '../access'

const allinfo = ref<any>()
const sconfig = useConfigStore()
const capabilities = computed(getPanelSettingsCapabilities)

const tabItems = markRaw([
  {
    key: 'appearance',
    label: 'Appearance',
    labelKey: 'setting.tabs.appearance',
    component: AppearanceSetting
  },
  {
    key: 'panel',
    label: 'Panel settings',
    labelKey: 'setting.tabs.panel',
    component: panelSetting
  },
  {
    key: 'network',
    label: 'Access settings',
    labelKey: 'setting.tabs.network',
    component: NetworkSetting
  },
  {
    key: 'account-security',
    label: 'Security',
    labelKey: 'setting.tabs.accountSecurity',
    component: AccountSecurity
  },
  {
    key: 'backup',
    label: 'Backup and restore',
    labelKey: 'setting.tabs.backup',
    component: PanelBackup
  },
  {
    key: 'update',
    label: 'Panel update',
    labelKey: 'setting.tabs.update',
    component: PanelUpdate
  }
])

const activeTabKey = ref('appearance')

const visibleTabItems = computed(() => {
  const access = capabilities.value
  const tabVisible: Record<string, boolean> = {
    appearance: access.canReadAppearance || access.canUpdateAppearance,
    panel: access.canReadPanelSettings || access.canUpdatePanelAlias || access.canUpdatePanelUsername || access.canUpdatePanelPassword || access.canUpdatePanelEntry,
    network: access.canReadPanelNetwork || access.canUpdatePanelNetwork,
    'account-security': access.canReadAccountSecurity || access.canSetupTotp || access.canDisableTotp || access.canRegenerateRecoveryCodes || access.canRevokeSession,
    backup: access.canReadPanelBackups || access.canCreatePanelBackup || access.canImportPanelBackup || access.canDownloadPanelBackup || access.canRestorePanelBackup || access.canDeletePanelBackup,
    update: access.canReadPanelUpdate || access.canCheckPanelUpdate || access.canApplyPanelUpdate
  }
  return tabItems.filter(item => tabVisible[item.key])
})

const activeTab = computed(
  () => visibleTabItems.value.find(item => item.key === activeTabKey.value) || visibleTabItems.value[0]
)

const activeComponentProps = computed(() => {
  if (activeTab.value?.key === 'panel') {
    return {
      isCard: false,
      allinfo: allinfo.value
    }
  }
  return {}
})

watch(visibleTabItems, items => {
  if (!items.some(item => item.key === activeTabKey.value)) {
    activeTabKey.value = items[0]?.key || ''
  }
}, { immediate: true })

const getSystemInfo = async () => {
  const access = capabilities.value
  const canLoadPanelData = access.canReadPanelSettings || access.canUpdatePanelAlias || access.canUpdatePanelUsername || access.canUpdatePanelPassword
  if (!canLoadPanelData) return
  try {
    const { data: res } = await Api.getSystemInfo()
    allinfo.value = res
    sconfig.setPanelTitle(res?.title || '')
  } catch (error) {
    ElMessage.error(i18n.t('setting.systemInfoLoadFailed'))
  }
}

onMounted(() => {
  getSystemInfo()
})
</script>

<template>
  <div class="all-container">
    <SettingSectionTabs
      :items="visibleTabItems"
      :active-key="activeTabKey"
      @update:active-key="activeTabKey = $event"
    />

    <div class="all-container__panel">
      <component
        v-if="activeTab"
        :is="activeTab.component"
        :key="activeTab.key"
        v-bind="activeComponentProps"
      />
      <el-empty v-else :description="$t('setting.noAvailableOperations', 'No available operations')" />
    </div>
  </div>
</template>

<style scoped lang="less">
.all-container {
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.all-container__panel {
  padding: 26px 30px;
}

@media (max-width: 700px) {
  .all-container__panel {
    padding: 20px 16px;
  }
}
</style>
