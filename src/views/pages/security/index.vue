<script setup lang="ts">
import CardTabs from '@/components/card-tabs.vue'
import { computed, markRaw, nextTick, onMounted, reactive, ref } from 'vue'
import { Api } from '@/api/modules'
import Firewall from './components/firewall.vue'
import Fail2ban from './components/fail2ban.vue'
import i18n from '@/lang'

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}

interface Fail2banCapabilities {
  showSecurityMenu: boolean
  canReadSecurity: boolean
  canWriteSecurity: boolean
  canChangeFirewallRules: boolean
  canChangePortForward: boolean
  canToggleFirewall: boolean
  canTogglePing: boolean
  showFail2banTab: boolean
  canChangePolicy: boolean
  canBan: boolean
  canUnban: boolean
  canInstall: boolean
  canReadAuditEvidence: boolean
}

const defaultCapabilities = (): Fail2banCapabilities => ({
  showSecurityMenu: true,
  canReadSecurity: false,
  canWriteSecurity: false,
  canChangeFirewallRules: false,
  canChangePortForward: false,
  canToggleFirewall: false,
  canTogglePing: false,
  showFail2banTab: false,
  canChangePolicy: false,
  canBan: false,
  canUnban: false,
  canInstall: false,
  canReadAuditEvidence: false
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
  conf.list.filter((item: any) => item.index !== 5 || conf.fail2banCapabilities.showFail2banTab)
)

const activeTab = computed(
  () => visibleList.value.find((item: any) => item.index === conf.activeIndex) || visibleList.value[0]
)

const loadAccessMatrix = async () => {
  try {
    const response = await Api.getAccessMatrix()
    const matrix = response?.data || {}
    conf.fail2banCapabilities = {
      showSecurityMenu: Boolean(matrix?.menu?.security),
      canReadSecurity: Boolean(matrix?.scopes?.security?.read),
      canWriteSecurity: Boolean(matrix?.scopes?.security?.write),
      canChangeFirewallRules: Boolean(matrix?.actions?.['firewall.rule_change']),
      canChangePortForward: Boolean(matrix?.actions?.['firewall.port_forward']),
      canToggleFirewall: Boolean(matrix?.actions?.['firewall.toggle']),
      canTogglePing: Boolean(matrix?.actions?.['firewall.ping']),
      showFail2banTab: Boolean(matrix?.scopes?.security?.read),
      canChangePolicy: Boolean(matrix?.actions?.['fail2ban.policy_change']),
      canBan: Boolean(matrix?.actions?.['fail2ban.ban']),
      canUnban: Boolean(matrix?.actions?.['fail2ban.unban']),
      canInstall: Boolean(matrix?.actions?.['software.install']),
      canReadAuditEvidence: Boolean(matrix?.scopes?.audit?.read)
    }
    if (!conf.fail2banCapabilities.showFail2banTab && conf.activeIndex === 5) {
      conf.activeIndex = 0
    }
  } catch {
    conf.fail2banCapabilities = defaultCapabilities()
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
