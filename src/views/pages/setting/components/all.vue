<script setup lang="ts">
import panelSetting from './panel-setting.vue'
import NetworkSetting from './network-setting.vue'
import PanelUpdate from './panel-update.vue'
import PanelBackup from './panel-backup.vue'
import AccountSecurity from './account-security.vue'
import AppearanceSetting from './appearance-setting.vue'
import { Api } from '@/api/modules'
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import i18n from '@/lang'

let allinfo = ref('')
const getSystemInfo = async () => {
  try {
    const { data: res } = await Api.getSystemInfo()
    allinfo.value = res
    // if (res) {
    //   // 更新settingData的值
    //   conf.settingData.forEach(item => {
    //     console.log(item,'item')
    //     item.value = res[item.prop] ? res[item.prop]  :res.user[item.prop]
    //   })
    // }
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
    <AppearanceSetting />
    <template v-if="allinfo">
      <panel-setting :isCard="false" :allinfo="allinfo" />
      <NetworkSetting />
      <AccountSecurity />
      <PanelBackup />
      <PanelUpdate />
    </template>
    <el-skeleton v-else :rows="5" animated />
  </div>
</template>

<style scoped lang="less">
.all-container {
  padding: 26px 30px;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

@media (max-width: 700px) {
  .all-container {
    padding: 20px 16px;
  }
}
</style>
