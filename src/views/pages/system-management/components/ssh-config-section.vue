<script setup lang="ts">
import { InfoFilled, Refresh, WarningFilled } from '@element-plus/icons-vue'
import type { SystemSshConfig } from '@/api/modules'

interface Props {
  sshError: string
  sshLoading: boolean
  sshConfig: SystemSshConfig | null
  localizedSshError: (message?: string | null) => string
  onRefresh: () => void
  onOpenDrawer: () => void
}

defineProps<Props>()
</script>

<template>
  <article class="system-card">
    <div class="section-heading">
      <div>
        <h2>{{ $t('systemManagement.sshQuickConfig') }}</h2>
        <p>{{ $t('systemManagement.sshDescription') }}</p>
      </div>
      <div class="section-actions">
        <el-button :icon="Refresh" @click="onRefresh">{{ $t('systemManagement.refreshSsh') }}</el-button>
        <el-button type="primary" plain @click="onOpenDrawer">{{ $t('systemManagement.viewConfig') }}</el-button>
      </div>
    </div>

    <el-alert
      v-if="sshError || sshConfig?.error || sshConfig?.supported === false"
      :type="sshConfig?.supported === false ? 'warning' : 'error'"
      :closable="false"
      show-icon
    >
      <template #title>
        {{ localizedSshError(sshError || sshConfig?.error) || $t('systemManagement.sshUnsupportedProbe') }}
      </template>
    </el-alert>

    <div v-loading="sshLoading" class="ssh-overview">
      <div class="ssh-item">
        <span>{{ $t('systemManagement.service') }}</span>
        <strong>{{ sshConfig?.service || '--' }}</strong>
      </div>
      <div class="ssh-item">
        <span>{{ $t('systemManagement.configFile') }}</span>
        <strong>{{ sshConfig?.configPath || '--' }}</strong>
      </div>
      <div class="ssh-item">
        <span>{{ $t('systemManagement.listenPort') }}</span>
        <strong>{{ sshConfig?.port || '--' }}</strong>
        <em>{{ $t('systemManagement.riskItem') }}</em>
      </div>
      <div class="ssh-item">
        <span>{{ $t('systemManagement.passwordLogin') }}</span>
        <strong>{{ sshConfig?.passwordAuthentication || '--' }}</strong>
        <em>{{ $t('systemManagement.riskItem') }}</em>
      </div>
      <div class="ssh-item">
        <span>{{ $t('systemManagement.rootLogin') }}</span>
        <strong>{{ sshConfig?.permitRootLogin || '--' }}</strong>
        <em>{{ $t('systemManagement.riskItem') }}</em>
      </div>
      <div class="ssh-item">
        <span>{{ $t('systemManagement.listenAddress') }}</span>
        <strong>{{ sshConfig?.listenAddress || '--' }}</strong>
      </div>
    </div>

    <div class="risk-list">
      <div class="risk-item">
        <el-icon><InfoFilled /></el-icon>
        <span>{{ $t('systemManagement.sshReadOnlyHint') }}</span>
      </div>
      <div class="risk-item">
        <el-icon><WarningFilled /></el-icon>
        <span>{{ $t('systemManagement.sshProbeHint') }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped lang="less">
.system-card {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: var(--surface-raised);
  box-shadow: var(--shadow-card);
}

.section-heading,
.section-actions,
.risk-item {
  display: flex;
  align-items: center;
}

.section-heading {
  justify-content: space-between;
  gap: 16px;

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 18px;
  }

  p {
    margin: 8px 0 0;
    color: var(--text-secondary);
    line-height: 1.7;
  }
}

.section-actions {
  gap: 10px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.ssh-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.ssh-item {
  min-height: 88px;
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-base);

  span {
    display: block;
    color: var(--text-secondary);
    font-size: 13px;
  }

  strong {
    display: block;
    margin-top: 10px;
    color: var(--text-primary);
    line-height: 1.55;
    overflow-wrap: anywhere;
  }

  em {
    display: inline-flex;
    margin-top: 8px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
    font-size: 12px;
    font-style: normal;
    line-height: 1.6;
  }
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.risk-item {
  gap: 10px;
  color: var(--text-secondary);
  line-height: 1.7;
}

@media (max-width: 960px) {
  .ssh-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .ssh-overview {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
