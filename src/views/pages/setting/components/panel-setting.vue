<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import settingForm, { FormItem } from './setting-form.vue'
import { Api } from '@/api/modules'
import { ElMessage, ElMessageBox } from 'element-plus'
import { watchEffect } from 'vue'
import { useConfigStore } from '@/stores/modules/config';
import System from '@/utils/System'
import { isOperationCancelled, submitOperation } from '@/utils/operationPreview'
import i18n from '@/lang'

const sconfig = useConfigStore()



interface Props {
  isCard?: boolean
  allinfo?: any
}

interface Config {
  settingData: FormItem[]
  [key: string]: any
}

interface PanelEntryState {
  loading: boolean
  saving: boolean
  bindAddress: string
  httpPort: string
  httpsEnabled: boolean
  httpsPort: string
  httpsCertificateFile: string
  httpsPrivateKeyFile: string
  trustedProxies: string[]
  panelEntryEnabled: boolean
  panelEntryPath: string
  panelAccessURL: string
  restartRequired: boolean
}

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const props = withDefaults(defineProps<Props>(), {
  isCard: true,
  allinfo: () => ({})
})

const normalizePanelEntryPath = (path?: string | null) => {
  const trimmed = String(path || '').trim()
  if (!trimmed || trimmed === '/') return ''
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return normalized.replace(/\/+$/, '')
}

const getSettingValue = (prop: string) => String(conf.settingData.find(item => item.prop === prop)?.value || '').trim()

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string') return error
  return fallback
}

const setActionLoading = (prop: string, loading: boolean) => {
  const action = conf.settingData.find(item => item.prop === prop)?.action
  if (!action) return
  if (Array.isArray(action)) {
    action.forEach(item => {
      item.loading = loading
      item.disabled = loading
    })
    return
  }
  action.loading = loading
  action.disabled = loading
}

const promptCurrentPassword = async (title: string, message: string, confirmButtonText = t('setting.panel.confirmModify', 'Confirm change')) => {
  const { value } = await ElMessageBox.prompt(message, title, {
    type: 'warning',
    confirmButtonText,
    cancelButtonText: t('setting.panel.cancel', 'Cancel'),
    inputType: 'password',
    inputPlaceholder: t('setting.panel.currentPassword', 'Current panel password'),
    inputValidator: input => Boolean(input) || t('setting.panel.inputCurrentPassword', 'Enter the current panel password')
  })
  return value
}

async function savePanelTitle() {
  const title = getSettingValue('title')
  if (!title) {
    ElMessage.warning(t('setting.panel.inputAlias', 'Enter a panel alias'))
    return
  }
  try {
    await ElMessageBox.confirm(
      t('setting.panel.aliasConfirm', `Change the panel alias to "${title}"?`, { title }),
      t('setting.panel.modifyAlias', 'Change panel alias'),
      {
        type: 'warning',
        confirmButtonText: t('setting.panel.confirmModify', 'Confirm change'),
        cancelButtonText: t('setting.panel.cancel', 'Cancel')
      }
    )
    setActionLoading('title', true)
    await Api.updateSystemTitley({ title })
    document.title = title
    ElMessage.success(t('setting.panel.aliasSuccess', 'Panel alias changed'))
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(getErrorMessage(error, t('setting.panel.aliasFailed', 'Failed to change panel alias')))
  } finally {
    setActionLoading('title', false)
  }
}

async function savePanelUsername() {
  const username = getSettingValue('username')
  if (!username) {
    ElMessage.warning(t('setting.panel.inputAccount', 'Enter a panel account'))
    return
  }
  try {
    const currentPassword = await promptCurrentPassword(
      t('setting.panel.modifyAccount', 'Change panel account'),
      t('setting.panel.accountConfirm', `Change the login account to "${username}"?`, { username })
    )
    setActionLoading('username', true)
    await Api.updateUpdateuser({ username, currentPassword })
    ElMessage.success(t('setting.panel.accountSuccess', 'Panel account changed'))
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(getErrorMessage(error, t('setting.panel.accountFailed', 'Failed to change panel account')))
  } finally {
    setActionLoading('username', false)
  }
}

async function savePanelPassword() {
  const password = getSettingValue('password')
  if (!password || password === '******') {
    ElMessage.warning(t('setting.panel.inputNewPassword', 'Enter a new password first'))
    return
  }
  try {
    const currentPassword = await promptCurrentPassword(
      t('setting.panel.modifyPassword', 'Change panel password'),
      t('setting.panel.passwordConfirm', 'Changing the password signs out all devices immediately. Enter the current panel password to confirm.'),
      t('setting.panel.confirmModifyPassword', 'Confirm password change')
    )
    setActionLoading('password', true)
    await Api.updateResetpassword({
      currentPassword,
      password
    })
    ElMessage.success(t('setting.panel.passwordSuccess', 'Password changed. Sign in again.'))
    sconfig.logout()
    await System.router.replace('/login')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(getErrorMessage(error, t('setting.panel.passwordFailed', 'Failed to change panel password')))
  } finally {
    setActionLoading('password', false)
  }
}

const conf = reactive<Config>({
  settingData: [
    // {
    //   label: '监听IPv6',
    //   prop: '',
    //   value: 1,
    //   type: 'switch',
    //   tip: '监听IPv6地址的访问'
    // },
    // {
    //   label: 'API接口',
    //   prop: '',
    //   value: 1,
    //   type: 'switch',
    //   action: {
    //     text: 'API接口配置',
    //     click: () => {}
    //   },
    //   tip: '提供面板API接口访问的支持（<span style="color: var(--el-color-primary)">堡塔APP</span>需要开启该功能），了解详情'
    // },
    {
      label: t('setting.panel.alias', 'Panel alias'),
      prop: 'title',
      value: '',
      type: 'input',
      action: {
        type: 'primary',
        text: t('setting.panel.save', 'Save'),
        click: savePanelTitle
      },
      tip: t('setting.panel.aliasTip', 'Set a display name for the panel and page title')
    },
    // {
    //   label: '左侧菜单标题',
    //   prop: '',
    //   value: '',
    //   type: 'input',
    //   action: {
    //     type: 'primary',
    //     text: '保存',
    //     click: () => {}
    //   },
    //   tip: '给左侧菜单标题取个别的名称'
    // },
    // {
    //   label: '超时时间',
    //   prop: '',
    //   value: '24小时',
    //   type: 'input',
    //   disabled: true,
    //   action: {
    //     type: 'primary',
    //     text: '设置',
    //     click: () => {}
    //   },
    //   tip: '如果用户超过设置时间，未操作面板，面板将自动退出登录'
    // },
    // {
    //   label: '默认建站目录',
    //   prop: '',
    //   value: '/www/wwwroot',
    //   type: 'file',
    //   action: {
    //     type: 'primary',
    //     text: '保存',
    //     click: () => {}
    //   },
    //   tip: '创建的站点，默认将保存到该目录下'
    // },
    // {
    //   label: '默认备份目录',
    //   prop: '',
    //   value: '/www/backup',
    //   type: 'file',
    //   action: {
    //     type: 'primary',
    //     text: '保存',
    //     click: () => {}
    //   },
    //   tip: '网站和站点默认的备份目录'
    // },
    // {
    //   label: '服务器IP',
    //   prop: '',
    //   value: '192.168.31.58',
    //   type: 'input',
    //   action: {
    //     type: 'primary',
    //     text: '保存',
    //     click: () => {}
    //   },
    //   tip: '默认为外网IP,若您在本地虚拟机测试，请填写虚拟机内网IP'
    // },
    // {
    //   label: '服务器时间',
    //   prop: '',
    //   value: '2024-12-04 10:48:35 CST +0800',
    //   type: 'input',
    //   action: {
    //     type: 'primary',
    //     text: '同步',
    //     click: () => {}
    //   },
    //   tip: '同步当前服务器时间'
    // },
    {
      label: t('setting.panel.account', 'Panel account'),
      prop: 'username', 
      value: '',
      type: 'input',
      disabled: false,
      action: {
        type: 'primary',
        text: t('setting.panel.save', 'Save'),
        click: savePanelUsername
      },
      tip: t('setting.panel.accountTip', 'Set the account used to sign in to the panel')
    },
    {
      label: t('setting.panel.password', 'Panel password'),
      prop: 'password',
      value: '',
      type: 'password',
      disabled: false,
      action: {
        type: 'primary',
        text: t('setting.panel.save', 'Save'),
        click: savePanelPassword
      },
      tip: t('setting.panel.passwordTip', 'Set the password used to sign in to the panel')
    },
    // {
    //   label: '绑定宝塔账号',
    //   prop: '',
    //   value: '139****2746',
    //   type: 'password',
    //   disabled: true,
    //   action: [
    //     {
    //       type: 'primary',
    //       text: '设置',
    //       click: () => {}
    //     },
    //     {
    //       text: '解绑',
    //       click: () => {}
    //     }
    //   ],
    //   tip: '面板大多数功能依赖云端服务(证书申请，产品购买，软件列表等)，该功能仅用于云端服务，不涉及敏感操作'
    // },
    // {
    //   label: '面板菜单栏隐藏',
    //   prop: '',
    //   value: '无配置',
    //   type: 'input',
    //   disabled: true,
    //   action: [
    //     {
    //       type: 'primary',
    //       text: '设置',
    //       click: () => {}
    //     }
    //   ],
    //   tip: '隐藏左侧菜单栏目'
    // },
    // {
    //   label: '面板云端请求方式',
    //   prop: '',
    //   value: 'Python',
    //   type: 'input',
    //   disabled: true,
    //   action: [
    //     {
    //       type: 'primary',
    //       text: '设置',
    //       click: () => {}
    //     }
    //   ],
    //   tip: '面板请求云端时，使用的请求方式，默认支持python、curl、php，请根据实际情况切换'
    // },
    // {
    //   label: '面板云端请求线路',
    //   prop: '',
    //   value: 'IPv4',
    //   type: 'input',
    //   disabled: true,
    //   action: [
    //     {
    //       type: 'primary',
    //       text: '设置',
    //       click: () => {}
    //     }
    //   ],
    //   tip: '面板请求云端时，使用的请求线路，默认支持auto、ipv4、ipv6，请根据实际情况切换'
    // },
    // {
    //   label: '面板云端通讯节点配置',
    //   prop: '',
    //   value: '自动选择',
    //   type: 'input',
    //   disabled: true,
    //   action: [
    //     {
    //       type: 'primary',
    //       text: '设置',
    //       click: () => {}
    //     }
    //   ],
    //   tip: '请勿随意调整节点配置，仅获取云端数据出现未响应或错误时，可尝试切换该节点'
    // }
  ]
})

const panelEntry = reactive<PanelEntryState>({
  loading: false,
  saving: false,
  bindAddress: '0.0.0.0',
  httpPort: '8089',
  httpsEnabled: false,
  httpsPort: '8443',
  httpsCertificateFile: '',
  httpsPrivateKeyFile: '',
  trustedProxies: [],
  panelEntryEnabled: false,
  panelEntryPath: '',
  panelAccessURL: '',
  restartRequired: false
})

const panelEntryAccessLabel = computed(() => panelEntry.panelEntryEnabled ? t('setting.panel.enabled', 'Enabled') : t('setting.panel.disabled', 'Not enabled'))
const currentPanelAccessURL = computed(() => {
  if (!panelEntry.panelEntryEnabled) return ''
  const entryPath = panelEntry.panelEntryPath || ''
  if (!entryPath) return ''
  const normalizedPath = entryPath.startsWith('/') ? entryPath : `/${entryPath}`
  return `${window.location.origin}${normalizedPath}`
})
const panelEntryPathText = computed(() => panelEntry.panelEntryEnabled ? (panelEntry.panelEntryPath || t('setting.panel.backendAutoGenerated', 'Generated by backend')) : t('setting.panel.entryDisabledPath', 'Secure entry is not enabled'))
const panelEntryStatusText = computed(() => {
  if (!panelEntry.panelEntryEnabled) return t('setting.panel.rootPathAccess', 'Currently using root path access')
  return panelEntry.restartRequired ? t('setting.panel.restartRequired', 'Restart required') : t('setting.panel.effective', 'Effective')
})
const panelEntryAccessText = computed(() => currentPanelAccessURL.value || window.location.origin)

const applyPanelEntry = (data?: Record<string, any>) => {
  if (!data) return
  panelEntry.bindAddress = data.bindAddress || '0.0.0.0'
  panelEntry.httpPort = data.httpPort || '8089'
  panelEntry.httpsEnabled = Boolean(data.httpsEnabled)
  panelEntry.httpsPort = data.httpsPort || '8443'
  panelEntry.httpsCertificateFile = data.httpsCertificateFile || ''
  panelEntry.httpsPrivateKeyFile = data.httpsPrivateKeyFile || ''
  panelEntry.trustedProxies = data.trustedProxies || []
  panelEntry.panelEntryEnabled = Boolean(data.panelEntryEnabled)
  panelEntry.panelEntryPath = data.panelEntryPath || ''
  panelEntry.panelAccessURL = data.panelAccessURL || data.panelAccessUrl || ''
  panelEntry.restartRequired = Boolean(data.restartRequired)
}

const loadPanelEntry = async () => {
  panelEntry.loading = true
  try {
    const { data } = await Api.getPanelNetwork()
    applyPanelEntry(data)
  } catch {
    ElMessage.error(t('setting.panel.loadEntryFailed', 'Failed to load secure entry configuration'))
  } finally {
    panelEntry.loading = false
  }
}

const buildPanelRouteURL = (accessURL: string) => {
  const targetAccessURL = accessURL || currentPanelAccessURL.value
  if (!targetAccessURL) return ''
  const normalized = targetAccessURL.replace(/\/$/, '')
  return `${normalized}/#/setting`
}

const reloadPanelPage = (enabled: boolean, accessURL: string, entryPath: string) => {
  if (!enabled) {
    window.location.assign(`${window.location.origin}/#/setting`)
    return
  }

  const normalizedPath = normalizePanelEntryPath(entryPath)
  const resolvedAccessURL = accessURL || (normalizedPath ? `${window.location.origin}${normalizedPath}` : '')
  const target = buildPanelRouteURL(resolvedAccessURL)
  if (!target) {
    window.location.reload()
    return
  }

  window.location.assign(target)
}

const writeClipboardText = async (text: string) => {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'readonly')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!copied) {
    throw new Error('copy failed')
  }
}

const savePanelEntry = async (rotatePanelEntry = false) => {
  const panelEntryPath = panelEntry.panelEntryPath.trim()
  if (panelEntry.panelEntryEnabled && panelEntryPath && !/^\/[^/?#\s]+$/.test(panelEntryPath)) {
    ElMessage.warning(t('setting.panel.invalidEntryPath', 'Secure entry path must be /<random-string>'))
    return
  }
  const targetEnabled = Boolean(panelEntry.panelEntryEnabled)
  const requestPanelEntryPath = panelEntry.panelEntryEnabled && !rotatePanelEntry ? panelEntryPath : ''
  panelEntry.saving = true
  try {
    const { data } = await submitOperation('panel.network', {
      bindAddress: panelEntry.bindAddress,
      httpPort: panelEntry.httpPort,
      httpsEnabled: panelEntry.httpsEnabled,
      httpsPort: panelEntry.httpsPort,
      httpsCertificateFile: panelEntry.httpsCertificateFile,
      httpsPrivateKeyFile: panelEntry.httpsPrivateKeyFile,
      trustedProxies: panelEntry.trustedProxies,
      panelEntryEnabled: panelEntry.panelEntryEnabled,
      panelEntryPath: requestPanelEntryPath,
      rotatePanelEntry
    })
    applyPanelEntry(data)
    ElMessage.success(rotatePanelEntry ? t('setting.panel.entryRotated', 'Secure entry rotated') : t('setting.panel.entrySaved', 'Secure entry configuration saved'))
    const resolvedEntryPath = normalizePanelEntryPath(data?.panelEntryPath || requestPanelEntryPath)
    const panelAccessURL = data?.panelAccessURL || data?.panelAccessUrl || (targetEnabled && resolvedEntryPath ? `${window.location.origin}${resolvedEntryPath}` : '')
    sconfig.setPanelEntryAccess({
      enabled: targetEnabled,
      path: targetEnabled ? resolvedEntryPath : '',
    })

    if (rotatePanelEntry) {
      reloadPanelPage(targetEnabled, panelAccessURL, resolvedEntryPath)
      return
    }

    reloadPanelPage(targetEnabled, panelAccessURL, resolvedEntryPath)
  } catch (error) {
    if (isOperationCancelled(error)) return
    ElMessage.error(rotatePanelEntry ? t('setting.panel.rotateFailed', 'Failed to rotate secure entry') : t('setting.panel.saveEntryFailed', 'Failed to save secure entry configuration'))
  } finally {
    panelEntry.saving = false
  }
}

const copyPanelAccessURL = async () => {
  const accessURL = currentPanelAccessURL.value
  if (!accessURL) {
    ElMessage.warning(t('setting.panel.noAccessAddress', 'No access address to copy'))
    return
  }
  try {
    await writeClipboardText(accessURL)
    ElMessage.success(t('setting.panel.accessCopied', 'Access address copied'))
  } catch {
    ElMessage.error(t('setting.panel.copyFailed', 'Copy failed. Check browser clipboard permission.'))
  }
}

const getSystemInfo = async () => {
  const res = props.allinfo  // 使用 props 中的数据
  if (!res) return
  conf.settingData.forEach(item => {
    if (res) {  // 检查 res.data 是否存在
      item.value = res[item.prop] || res.user?.[item.prop] || ''
      if (item.prop === 'password') {
        // const passwordlen = res[item.prop] || res.user?.[item.prop].length || 6
        // 如果 prop 是 password，将值设置为 '******'
        item.value = '******'
      }
    }
  })
  // conf.settingData.password =''
}
watchEffect(() => {
  getSystemInfo()
})

onMounted(() => {
  void loadPanelEntry()
})
</script>

<template>
  <div class="basic-card" :class="{ isCard }">
    <div class="basic-card__header">
      <div class="basic-card__title">{{ t('setting.panel.title', 'Panel settings') }}</div>
    </div>
    <div class="basic-card__body">
      <setting-form :data="conf.settingData" />
    </div>

    <div class="panel-entry-card" v-loading="panelEntry.loading">
      <div class="panel-entry-card__header">
        <div>
          <div class="panel-entry-card__title">
            {{ t('setting.panel.entryTitle', 'Panel secure entry') }}
            <el-tag class="risk-tag" size="small" type="danger">{{ t('setting.panel.highRisk', 'High risk') }}</el-tag>
          </div>
          <p class="panel-entry-card__desc">{{ t('setting.panel.entryDescription', 'When enabled, the panel is accessed through a random path to reduce scanning and brute-force probing risk.') }}</p>
        </div>
        <div class="panel-entry-card__status" :class="{ active: panelEntry.panelEntryEnabled }">
          {{ panelEntryAccessLabel }}
        </div>
      </div>

      <div class="panel-entry-overview">
        <div class="panel-entry-overview__item">
          <span>{{ t('setting.panel.entryPath', 'Current entry path') }}</span>
          <strong>{{ panelEntryPathText }}</strong>
        </div>
        <div class="panel-entry-overview__item">
          <span>{{ t('setting.panel.effectiveStatus', 'Effective status') }}</span>
          <strong>{{ panelEntryStatusText }}</strong>
        </div>
        <div class="panel-entry-overview__item panel-entry-overview__item--wide">
          <span>{{ t('setting.panel.currentAccessAddress', 'Current access address') }}</span>
          <strong>{{ panelEntryAccessText }}</strong>
        </div>
      </div>

      <div class="panel-entry-form">
        <div class="panel-entry-form__row">
          <label>
            {{ t('setting.panel.enableEntry', 'Enable secure entry') }}
            <el-tag class="risk-tag" size="small" type="danger">{{ t('setting.panel.highRisk', 'High risk') }}</el-tag>
          </label>
          <div class="panel-entry-form__control panel-entry-form__control--inline">
            <el-switch v-model="panelEntry.panelEntryEnabled" />
            <span class="panel-entry-form__hint">{{ t('setting.panel.entrySwitchHint', 'When off, root path access remains available; when on, root path returns 404.') }}</span>
          </div>
        </div>

        <div class="panel-entry-form__row">
          <label>{{ t('setting.panel.customEntryPath', 'Custom entry path') }}</label>
          <div class="panel-entry-form__control">
            <el-input
              v-model="panelEntry.panelEntryPath"
              :disabled="!panelEntry.panelEntryEnabled"
              :placeholder="t('setting.panel.entryPlaceholder', 'Leave empty for backend generation, e.g. /AbCd123456')"
            />
            <span class="panel-entry-form__hint">{{ t('setting.panel.entryFormatHint', 'Format is `/<slug>`. Leave empty to generate automatically. Rotating the entry ignores this value.') }}</span>
          </div>
        </div>
      </div>

      <div class="panel-entry-actions">
        <div class="panel-entry-actions__risk">
          <el-tag size="small" type="danger">{{ t('setting.panel.highRisk', 'High risk') }}</el-tag>
          <span>{{ t('setting.panel.entryRiskTip', 'Changing the entry path affects the panel access address. Save the new address before leaving.') }}</span>
        </div>
        <el-button type="primary" :loading="panelEntry.saving" @click="savePanelEntry(false)">{{ t('setting.panel.saveConfig', 'Save configuration') }}</el-button>
        <el-button :disabled="!currentPanelAccessURL" @click="copyPanelAccessURL">{{ t('setting.panel.copyAccessAddress', 'Copy access address') }}</el-button>
        <el-button
          type="primary"
          plain
          :disabled="!panelEntry.panelEntryEnabled"
          :loading="panelEntry.saving"
          @click="savePanelEntry(true)"
        >
          {{ t('setting.panel.rotateEntry', 'Rotate secure entry') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.basic-card {
  width: 100%;
  border: none !important;
  border-radius: none !important;
  background: transparent !important;
  box-shadow: none !important;

  &.isCard {
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    background: var(--surface-card);
    padding: 26px 30px;
    box-shadow: var(--shadow-xs);
  }

  &__title {
    display: flex;
    align-items: center;
    position: relative;
    font-weight: 650;
    font-size: 16px;
    color: var(--text-primary);

    &::before {
      content: '';
      background: var(--el-color-primary);
      width: 3px;
      height: 17px;
      margin-right: 9px;
      border-radius: 99px;
    }
  }

  &__header {
    padding: 0px 0 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    // border-bottom: 1px solid var(--border-subtle);
  }

  &__body {
    // padding: 8px 0;
    padding: 22px;
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    background: var(--surface-subtle);
  }
}

.panel-entry-card {
  margin-top: 22px;
  padding: 24px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-subtle);

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }

  &__title {
     display: flex;
    align-items: center;
    position: relative;
    font-weight: 650;
    font-size: 16px;
    color: var(--text-primary);
    margin-bottom: 10px;

    &::before {
      content: '';
      background: var(--el-color-primary);
      width: 3px;
      height: 17px;
      margin-right: 9px;
      border-radius: 99px;
    }
  }

  &__desc {
    margin: 0;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.7;
  }

  &__status {
    flex-shrink: 0;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--surface-muted);
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 700;

    &.active {
      background: rgba(34, 197, 94, 0.12);
      color: #16a34a;
    }
  }
}

.risk-tag {
  margin-left: 8px;
  vertical-align: 1px;
}

.panel-entry-overview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;

  &__item {
    padding: 16px 18px;
    border-radius: 12px;
    background: var(--surface-card);
    box-shadow: 0 0 0 1px var(--border-subtle) inset;

    span {
      display: block;
      margin-bottom: 8px;
      color: var(--text-tertiary);
      font-size: 12px;
    }

    strong {
      display: block;
      color: var(--text-primary);
      font-size: 14px;
      line-height: 1.7;
      word-break: break-all;
    }
  }

  &__item--wide {
    grid-column: 1 / -1;
  }
}

.panel-entry-form {
  display: grid;
  gap: 18px;

  &__row {
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr);
    gap: 18px;
    align-items: start;

    label {
      padding-top: 11px;
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 650;
    }
  }

  &__control {
    min-width: 0;
  }

  &__control--inline {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__hint {
    display: block;
    margin-top: 8px;
    color: var(--text-tertiary);
    font-size: 12px;
    line-height: 1.7;
  }
}

.panel-entry-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 22px;

  &__risk {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 220px;
    margin-right: auto;
    color: var(--text-tertiary);
    font-size: 12px;
    line-height: 1.6;
  }
}

@media (max-width: 900px) {
  .panel-entry-overview {
    grid-template-columns: 1fr;

    &__item--wide {
      grid-column: auto;
    }
  }

  .panel-entry-form__row {
    grid-template-columns: 1fr;
    gap: 10px;

    label {
      padding-top: 0;
    }
  }
}

@media (max-width: 640px) {
  .basic-card {
    &.isCard {
      padding: 20px 16px;
    }

    &__body {
      padding: 16px;
    }
  }

  .panel-entry-card {
    padding: 16px;

    &__header {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .panel-entry-actions {
    :deep(.el-button) {
      width: 100%;
      margin-left: 0;
    }
  }
}
</style>
