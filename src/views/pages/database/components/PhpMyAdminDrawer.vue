<script setup lang="ts">
import { CircleCheck, DataAnalysis, Download, Link, Lock, Warning } from '@element-plus/icons-vue'
import { computed } from 'vue'
import CustomDrawer from '@/components/custom-drawer.vue'
import i18n from '@/lang'

interface Props {
  loading?: boolean
  installing?: boolean
  installed?: boolean
  taskId?: string
  software?: any
  phpRuntime?: any
  webServer?: any
  versions?: string[]
  recommendedVersion?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  installing: false,
  installed: false,
  taskId: '',
  software: undefined,
  phpRuntime: undefined,
  webServer: undefined,
  versions: () => [],
  recommendedVersion: '',
  description: ''
})

const emit = defineEmits<{
  (event: 'install'): void
  (event: 'open'): void
  (event: 'view-task', taskId: string): void
  (event: 'go-detail'): void
}>()

const visible = defineModel<boolean>({ default: false })
const selectedVersion = defineModel<string>('selectedVersion', { default: '' })
const activeTab = defineModel<string>('activeTab', { default: 'service' })

const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}

const status = computed(() => {
  if (props.taskId) return 'installing'
  return props.installed ? 'installed' : 'not-installed'
})

const statusLabel = computed(() => {
  if (props.taskId) return t('database.phpMyAdmin.installing', '安装中')
  return props.installed
    ? t('database.phpMyAdmin.installed', '已安装')
    : t('database.phpMyAdmin.notInstalled', '未安装')
})
</script>

<template>
  <custom-drawer
    v-model:visible="visible"
    :title="t('database.phpMyAdmin.drawerTitle', 'phpMyAdmin 管理')"
    size="620px"
    body-mode="compact"
    :show-confirm="false"
    :cancel-text="t('common.close', '关闭')"
  >
    <div v-loading="loading" class="phpmyadmin-drawer">
      <section class="phpmyadmin-overview">
        <div class="phpmyadmin-overview__icon">
          <el-icon><DataAnalysis /></el-icon>
        </div>
        <div class="phpmyadmin-overview__content">
          <div class="phpmyadmin-overview__heading">
            <strong>phpMyAdmin</strong>
            <span class="phpmyadmin-status" :class="`phpmyadmin-status--${status}`">
              {{ statusLabel }}
            </span>
          </div>
          <p>{{ description }}</p>
        </div>
      </section>

      <el-tabs v-model="activeTab" class="phpmyadmin-tabs">
        <el-tab-pane :label="t('database.phpMyAdmin.serviceTab', '服务')" name="service">
          <div class="phpmyadmin-section">
            <div class="phpmyadmin-section__heading">
              <h3>{{ t('database.phpMyAdmin.serviceTitle', '服务状态') }}</h3>
              <p>{{ t('database.phpMyAdmin.serviceDescription', '查看安装状态并访问 phpMyAdmin 管理界面。') }}</p>
            </div>
            <div class="phpmyadmin-detail-list">
              <div class="phpmyadmin-detail-row">
                <span>{{ t('database.phpMyAdmin.currentVersion', '当前版本') }}</span>
                <strong>{{ software?.install_version || '--' }}</strong>
              </div>
              <div class="phpmyadmin-detail-row">
                <span>{{ t('database.phpMyAdmin.accessMode', '访问方式') }}</span>
                <strong>{{ t('database.phpMyAdmin.panelProtected', '面板认证保护') }}</strong>
              </div>
              <div class="phpmyadmin-detail-row">
                <span>{{ t('database.phpMyAdmin.accessPath', '访问路径') }}</span>
                <code>{{ installed ? '/phpMyAdmin/index.php' : '--' }}</code>
              </div>
            </div>
            <el-alert
              v-if="!installed"
              :title="t('database.phpMyAdmin.installHint', '安装完成后即可从面板安全访问 phpMyAdmin。')"
              type="info"
              :closable="false"
              show-icon
            />
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('database.phpMyAdmin.phpVersionTab', 'PHP 版本')" name="version">
          <div class="phpmyadmin-section">
            <div class="phpmyadmin-section__heading">
              <h3>{{ t('database.phpMyAdmin.runtimeCompatibility', '运行环境与版本') }}</h3>
              <p>{{ t('database.phpMyAdmin.runtimeCompatibilityDescription', '安装时会使用与当前 PHP 环境兼容的版本。') }}</p>
            </div>
            <div class="phpmyadmin-requirements">
              <div class="phpmyadmin-requirement" :class="{ ready: phpRuntime?.installed }">
                <el-icon><component :is="phpRuntime?.installed ? CircleCheck : Warning" /></el-icon>
                <div>
                  <span>PHP</span>
                  <strong>{{ phpRuntime?.install_version || t('database.phpMyAdmin.notInstalled', '未安装') }}</strong>
                </div>
              </div>
              <div class="phpmyadmin-requirement" :class="{ ready: !!webServer }">
                <el-icon><component :is="webServer ? CircleCheck : Warning" /></el-icon>
                <div>
                  <span>{{ t('database.phpMyAdmin.webServer', 'Web 服务器') }}</span>
                  <strong>{{ webServer?.name || webServer?.key || t('database.phpMyAdmin.notInstalled', '未安装') }}</strong>
                </div>
              </div>
            </div>
            <div class="phpmyadmin-version-field">
              <label>{{ t('database.phpMyAdmin.targetVersion', 'phpMyAdmin 版本') }}</label>
              <el-select
                v-model="selectedVersion"
                :disabled="installed || versions.length === 0"
                :placeholder="t('database.phpMyAdmin.selectVersion', '请选择版本')"
              >
                <el-option
                  v-for="version in versions"
                  :key="version"
                  :label="version === recommendedVersion ? `${version} (${t('database.phpMyAdmin.recommended', '推荐')})` : version"
                  :value="version"
                />
              </el-select>
              <span>{{ t('database.phpMyAdmin.versionSelectionHint', '已安装时版本由软件商城统一维护。') }}</span>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('database.phpMyAdmin.securityTab', '安全设置')" name="security">
          <div class="phpmyadmin-section">
            <div class="phpmyadmin-security">
              <div class="phpmyadmin-security__icon"><el-icon><Lock /></el-icon></div>
              <div>
                <h3>{{ t('database.phpMyAdmin.panelAccessTitle', '通过面板安全访问') }}</h3>
                <p>{{ t('database.phpMyAdmin.panelAccessDescription', 'phpMyAdmin 入口由面板认证保护，不单独开放公共访问开关。') }}</p>
              </div>
            </div>
            <ul class="phpmyadmin-security-notes">
              <li>{{ t('database.phpMyAdmin.securityNoteLogin', '访问前需要先登录管理面板。') }}</li>
              <li>{{ t('database.phpMyAdmin.securityNotePublic', '不建议将 phpMyAdmin 直接暴露到公网。') }}</li>
              <li>{{ t('database.phpMyAdmin.securityNoteDatabase', '可从数据库列表直接进入对应数据库。') }}</li>
            </ul>
            <el-button link type="primary" @click="emit('go-detail')">
              {{ t('database.phpMyAdmin.versionDetail', '版本与详情') }}
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer="{ close }">
      <el-button @click="close">{{ t('common.close', '关闭') }}</el-button>
      <el-button v-if="taskId" type="primary" @click="emit('view-task', taskId)">
        {{ t('database.phpMyAdmin.viewProgress', '查看安装进度') }}
      </el-button>
      <el-button v-else-if="installed" type="primary" :icon="Link" @click="emit('open')">
        {{ t('database.phpMyAdmin.open', '打开 phpMyAdmin') }}
      </el-button>
      <el-button v-else type="primary" :icon="Download" :loading="installing" @click="emit('install')">
        {{ t('database.phpMyAdmin.installNow', '立即安装') }}
      </el-button>
    </template>
  </custom-drawer>
</template>

<style scoped lang="less">
.phpmyadmin-drawer {
  min-height: 420px;
}

.phpmyadmin-overview {
  padding: 2px 0 24px;
  display: flex;
  align-items: center;
  gap: 16px;

  &__icon {
    width: 52px;
    height: 52px;
    flex: 0 0 52px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    color: rgb(var(--primary-color));
    background: color-mix(in srgb, rgb(var(--primary-color)) 10%, var(--surface-card));

    .el-icon {
      font-size: 25px;
    }
  }

  &__content {
    min-width: 0;

    p {
      margin: 7px 0 0;
      color: var(--text-tertiary);
      font-size: 13px;
      line-height: 1.55;
    }
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: 10px;

    strong {
      color: var(--text-primary);
      font-size: 19px;
      font-weight: 700;
    }
  }
}

.phpmyadmin-status {
  min-height: 26px;
  padding: 2px 9px;
  display: inline-flex;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--text-placeholder) 32%, transparent);
  border-radius: 999px;
  color: var(--text-tertiary);
  background: color-mix(in srgb, var(--text-placeholder) 8%, transparent);
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;

  &--installed {
    border-color: color-mix(in srgb, rgb(var(--success-color)) 42%, transparent);
    color: rgb(var(--success-color));
    background: color-mix(in srgb, rgb(var(--success-color)) 8%, transparent);
  }

  &--installing {
    border-color: color-mix(in srgb, rgb(var(--warning-color)) 42%, transparent);
    color: rgb(var(--warning-color));
    background: color-mix(in srgb, rgb(var(--warning-color)) 8%, transparent);
  }
}

.phpmyadmin-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 22px;
  }

  :deep(.el-tabs__item) {
    height: 42px;
    padding-inline: 18px;
    font-weight: 600;
  }
}

.phpmyadmin-section {
  display: flex;
  flex-direction: column;
  gap: 20px;

  &__heading {
    h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: 15px;
      font-weight: 700;
    }

    p {
      margin: 6px 0 0;
      color: var(--text-tertiary);
      font-size: 13px;
      line-height: 1.55;
    }
  }
}

.phpmyadmin-detail-list {
  border-top: 1px solid var(--border-subtle);
}

.phpmyadmin-detail-row {
  min-height: 48px;
  padding: 11px 2px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border-bottom: 1px solid var(--border-subtle);

  > span {
    color: var(--text-tertiary);
    font-size: 13px;
  }

  strong,
  code {
    max-width: 68%;
    overflow-wrap: anywhere;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
    text-align: right;
  }

  code {
    padding: 3px 7px;
    border-radius: 5px;
    background: var(--surface-page);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-weight: 500;
  }
}

.phpmyadmin-requirements {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.phpmyadmin-requirement {
  min-height: 72px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 11px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: rgb(var(--warning-color));
  background: var(--surface-card);

  &.ready {
    color: rgb(var(--success-color));
  }

  .el-icon {
    flex: 0 0 auto;
    font-size: 19px;
  }

  div {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    overflow: hidden;
    color: var(--text-primary);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.phpmyadmin-version-field {
  display: flex;
  flex-direction: column;
  gap: 9px;

  label {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
  }

  > span {
    color: var(--text-tertiary);
    font-size: 12px;
    line-height: 1.5;
  }
}

.phpmyadmin-security {
  padding: 18px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  border: 1px solid color-mix(in srgb, rgb(var(--success-color)) 24%, var(--border-subtle));
  border-radius: 8px;
  background: color-mix(in srgb, rgb(var(--success-color)) 6%, var(--surface-card));

  &__icon {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    display: grid;
    place-items: center;
    border-radius: 7px;
    color: rgb(var(--success-color));
    background: color-mix(in srgb, rgb(var(--success-color)) 12%, transparent);
  }

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 14px;
  }

  p {
    margin: 6px 0 0;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.6;
  }
}

.phpmyadmin-security-notes {
  margin: 0;
  padding-left: 20px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 2;
}

@media (max-width: 640px) {
  .phpmyadmin-requirements {
    grid-template-columns: 1fr;
  }
}
</style>
