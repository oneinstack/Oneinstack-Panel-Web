<script setup lang="ts">
import CardTabs from '@/components/card-tabs.vue'
import { computed, markRaw, nextTick, onMounted, reactive, ref } from 'vue'
import { Api } from '@/api/modules'
import { useConfigStore } from '@/stores/modules/config'
import Firewall from './components/firewall.vue'
import Fail2ban from './components/fail2ban.vue'
import { getSecurityCapabilities, type SecurityCapabilities } from './access'
import i18n from '@/lang'

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}

const defaultCapabilities = (): SecurityCapabilities => ({
  showSecurityMenu: true,
  canReadSecurity: false,
  canToggleFirewall: false,
  canTogglePing: false,
  canClearFirewallCache: false,
  canInstallFirewall: false,
  canReadPortRule: false,
  canCreatePortRule: false,
  canUpdatePortRule: false,
  canDeletePortRule: false,
  canImportPortRule: false,
  canExportPortRule: false,
  canManageIpRule: false,
  canManagePortForward: false,
  canManageRegionRule: false,
  canManageMaliciousIp: false,
  canReadIntrusion: false,
  canManageIntrusion: false,
  canReadAuditEvidence: true
})

const firewallRef = ref<any>()

const conf = reactive({
  activeIndex: 0,
  fail2banCapabilities: defaultCapabilities(),
  list: markRaw([
    {
      name: t('security.systemFirewall', '系统防火墙'),
      nameKey: 'security.systemFirewall',
      index: 0,
      component: Firewall
    }
    ,
    // {
    //   name: 'SSH管理',
    //   nameKey: 'security.sshManagement',
    //   index: 1
    // },
    // {
    //   name: '安全检测',
    //   nameKey: 'security.safetyDetection',
    //   index: 2
    // },
    // {
    //   name: '违规词检测',
    //   nameKey: 'security.violationWordDetection',
    //   index: 3
    // },
    // {
    //   name: 'PHP网站安全',
    //   nameKey: 'security.phpWebsiteSecurity',
    //   index: 4
    // },
    {
      name: t('security.intrusionPrevention', '入侵防御'),
      nameKey: 'security.intrusionPrevention',
      index: 5,
      component: Fail2ban
    },
    // {
    //   name: '系统加固',
    //   nameKey: 'security.systemHardening',
    //   index: 6
    // }
  ]),
  clickActive: (item: any) => {
    conf.activeIndex = item.index
  }

})

const visibleList = computed(() =>
  conf.list.filter((item: any) =>
    item.index === 0
      ? conf.fail2banCapabilities.canReadSecurity
      : item.index === 5
        ? conf.fail2banCapabilities.canReadIntrusion
        : true,
  )
)

const activeTab = computed(
  () => visibleList.value.find((item: any) => item.index === conf.activeIndex) || visibleList.value[0]
)

const loadAccessMatrix = async () => {
  try {
    const response = await Api.getAccessMatrix()
    useConfigStore().setAccessMatrix(response?.data || {})
  } catch {
    useConfigStore().setUserAccessSnapshot(useConfigStore().userInfo)
  }
  conf.fail2banCapabilities = getSecurityCapabilities()
  if (!visibleList.value.some((item: any) => item.index === conf.activeIndex)) {
    conf.activeIndex = visibleList.value[0]?.index ?? 0
  }
}

onMounted(async () => {
  await loadAccessMatrix()
  await nextTick()
  void firewallRef.value?.refreshAll?.()
})
</script>

<template>
  <div v-if="conf.fail2banCapabilities.showSecurityMenu" class="security-container">
    <card-tabs :list="visibleList" :activeIndex="conf.activeIndex" :clickActive="conf.clickActive" />
    <Firewall
      v-if="activeTab?.index === 0"
      :capabilities="conf.fail2banCapabilities"
      ref="firewallRef"
    />
    <Fail2ban
      v-else-if="activeTab?.index === 5"
      :capabilities="conf.fail2banCapabilities"
    />
  </div>
</template>

<style scoped lang="less">

</style>
