<script setup lang="ts">
import CardTabs from '@/components/card-tabs.vue'
import { computed, markRaw, onMounted, reactive } from 'vue'
import { Api } from '@/api/modules'
import Firewall from './components/firewall.vue'
import Fail2ban from './components/fail2ban.vue'

interface Fail2banCapabilities {
  showSecurityMenu: boolean
  showFail2banTab: boolean
  canChangePolicy: boolean
  canBan: boolean
  canUnban: boolean
  canInstall: boolean
  canReadAuditEvidence: boolean
}

const defaultCapabilities = (): Fail2banCapabilities => ({
  showSecurityMenu: true,
  showFail2banTab: false,
  canChangePolicy: false,
  canBan: false,
  canUnban: false,
  canInstall: false,
  canReadAuditEvidence: false
})

const conf = reactive({
  activeIndex: 0,
  fail2banCapabilities: defaultCapabilities(),
  list: markRaw([
    {
      name: '系统防火墙',
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
      name: '入侵防御',
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

const activeTab = computed(
  () => conf.list.find((item: any) => item.index === conf.activeIndex) || conf.list[0]
)

const loadAccessMatrix = async () => {
  try {
    const response = await Api.getAccessMatrix()
    const matrix = response?.data || {}
    conf.fail2banCapabilities = {
      showSecurityMenu: Boolean(matrix?.menu?.security),
      showFail2banTab: Boolean(matrix?.scopes?.security?.read),
      canChangePolicy: Boolean(matrix?.actions?.['fail2ban.policy_change']),
      canBan: Boolean(matrix?.actions?.['fail2ban.ban']),
      canUnban: Boolean(matrix?.actions?.['fail2ban.unban']),
      canInstall: Boolean(matrix?.actions?.['software.install']),
      canReadAuditEvidence: Boolean(matrix?.scopes?.audit?.read)
    }
  } catch {
    conf.fail2banCapabilities = defaultCapabilities()
  }
}

onMounted(() => {
  void loadAccessMatrix()
})
</script>

<template>
  <div v-if="conf.fail2banCapabilities.showSecurityMenu" class="security-container">
    <card-tabs :list="conf.list" :activeIndex="conf.activeIndex" :clickActive="conf.clickActive" />
    <component
      :is="activeTab?.component"
      v-bind="activeTab?.index === 5 ? { capabilities: conf.fail2banCapabilities } : {}"
    />
  </div>
</template>

<style scoped lang="less">

</style>
