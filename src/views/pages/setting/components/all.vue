<script setup lang="ts">
import { computed, markRaw, onMounted, ref } from 'vue'
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

const allinfo = ref<any>()

const tabItems = markRaw([
  {
    key: 'appearance',
    label: '界面设置',
    labelKey: 'setting.tabs.appearance',
    component: AppearanceSetting
  },
  {
    key: 'panel',
    label: '面板设置',
    labelKey: 'setting.tabs.panel',
    component: panelSetting
  },
  {
    key: 'network',
    label: '访问方式',
    labelKey: 'setting.tabs.network',
    component: NetworkSetting
  },
  {
    key: 'account-security',
    label: '安全设置',
    labelKey: 'setting.tabs.accountSecurity',
    component: AccountSecurity
  },
  {
    key: 'backup',
    label: '备份还原',
    labelKey: 'setting.tabs.backup',
    component: PanelBackup
  },
  {
    key: 'update',
    label: '面板更新',
    labelKey: 'setting.tabs.update',
    component: PanelUpdate
  }
])

const activeTabKey = ref('appearance')

const activeTab = computed(
  () => tabItems.find(item => item.key === activeTabKey.value) || tabItems[0]
)

const activeComponentProps = computed(() => {
  if (activeTab.value.key === 'panel') {
    return {
      isCard: false,
      allinfo: allinfo.value
    }
  }
  return {}
})

const getSystemInfo = async () => {
  try {
    const { data: res } = await Api.getSystemInfo()
    allinfo.value = res
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
      :items="tabItems"
      :active-key="activeTabKey"
      @update:active-key="activeTabKey = $event"
    />

    <div class="all-container__panel">
      <component
        :is="activeTab.component"
        :key="activeTab.key"
        v-if="activeTab.key !== 'panel' || allinfo"
        v-bind="activeComponentProps"
      />
      <el-skeleton v-if="activeTab.key === 'panel' && !allinfo" :rows="5" animated />
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
