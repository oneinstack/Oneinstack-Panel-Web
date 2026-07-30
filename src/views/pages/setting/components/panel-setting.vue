<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import settingForm, { FormItem } from './setting-form.vue'
import { Api } from '@/api/Api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { watchEffect } from 'vue'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'



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

const props = withDefaults(defineProps<Props>(), {
  isCard: true,
  allinfo: () => ({})
})

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
      label: '面板别名',
      prop: 'title',
      value: '',
      type: 'input',
      action: {
        type: 'primary',
        text: '保存',
        click: async () => {
          try {
            const title = conf.settingData.find(item => item.prop === 'title')?.value
            
            const { data } = await Api.updateSystemTitley({ title :title})
            if(data) {
              document.title = title+''
              ElMessage.success('修改成功')
            }
          } catch(error) {
            ElMessage.error('修改失败')
          }
        }
      },
      tip: '给面板取个别的名称，用于网页标题'
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
      label: '面板账号',
      prop: 'username', 
      value: '',
      type: 'input',
      disabled: false,
      action: {
        type: 'primary',
        text: '保存',
        click: async() => {
          try {
            const username = conf.settingData.find(item => item.prop === 'username')?.value
            const { data } = await Api.updateUpdateuser({ username :username})
            if(data) {
              ElMessage.success('修改成功')
            }
          } catch(error) {
            ElMessage.error('修改失败')
          }
        }
      },
      tip: '设置面板账号，用于登录面板'
    },
    {
      label: '面板密码',
      prop: 'password',
      value: '',
      type: 'password',
      disabled: false,
      action: {
        type: 'primary',
        text: '保存',
        click: async() => {
          try {
            const password = conf.settingData.find(item => item.prop === 'password')?.value
            if (!password || password === '******') {
              ElMessage.warning('请先输入一个新密码')
              return
            }
            const { value: currentPassword } = await ElMessageBox.prompt(
              '修改密码会让所有设备立即退出，请输入当前密码确认。',
              '修改面板密码',
              {
                confirmButtonText: '确认修改',
                cancelButtonText: '取消',
                inputType: 'password',
                inputPlaceholder: '当前密码',
                inputValidator: value => Boolean(value) || '请输入当前密码'
              }
            )
            const { data } = await Api.updateResetpassword({
              currentPassword,
              password
            })
            if(data) {
              ElMessage.success('密码修改成功，请重新登录')
              sconfig.logout()
              await System.router.replace('/login')
            }
          } catch(error) {
            if (error !== 'cancel' && error !== 'close') ElMessage.error('修改失败')
          }
        }
      },
      tip: '设置面板密码，用于登录面板'
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

const panelEntryAccessLabel = computed(() => panelEntry.panelEntryEnabled ? '已启用' : '未启用')
const currentRoutePath = computed(() => System.getRouterPath() || '/setting')
const currentPanelAccessURL = computed(() => {
  if (!panelEntry.panelEntryEnabled) return ''
  const entryPath = panelEntry.panelEntryPath || ''
  if (!entryPath) return ''
  const normalizedPath = entryPath.startsWith('/') ? entryPath : `/${entryPath}`
  return `${window.location.origin}${normalizedPath}`
})

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
    ElMessage.error('获取安全入口配置失败')
  } finally {
    panelEntry.loading = false
  }
}

const buildPanelRouteURL = (accessURL: string) => {
  const targetAccessURL = accessURL || currentPanelAccessURL.value
  if (!targetAccessURL) return ''
  const normalized = targetAccessURL.replace(/\/$/, '')
  const routePath = currentRoutePath.value.startsWith('/') ? currentRoutePath.value : `/${currentRoutePath.value}`
  return `${normalized}/#${routePath}`
}

const maybeRedirectToPanelEntry = async (accessURL: string, message: string) => {
  const target = buildPanelRouteURL(accessURL)
  if (!target) return
  try {
    await ElMessageBox.confirm(message, '访问地址已更新', {
      type: 'warning',
      confirmButtonText: '立即跳转',
      cancelButtonText: '稍后处理'
    })
    window.location.assign(target)
  } catch {
    ElMessage.info('请记得使用新的访问地址进入面板')
  }
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
    ElMessage.warning('安全入口路径格式应为 /<随机串>')
    return
  }
  const requestPanelEntryPath = panelEntry.panelEntryEnabled && !rotatePanelEntry ? panelEntryPath : ''
  const actionLabel = rotatePanelEntry
    ? '轮换后旧入口会立即失效，是否继续？'
    : panelEntry.panelEntryEnabled
      ? '启用后根路径将无法访问面板，是否继续保存？'
      : '关闭后面板将恢复根路径访问，是否继续保存？'

  try {
    await ElMessageBox.confirm(actionLabel, rotatePanelEntry ? '轮换安全入口' : '保存安全入口配置', {
      type: 'warning',
      confirmButtonText: rotatePanelEntry ? '确认轮换' : '确认保存',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  panelEntry.saving = true
  try {
    const { data } = await Api.updatePanelNetwork({
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
    ElMessage.success(rotatePanelEntry ? '安全入口已轮换' : '安全入口配置已保存')
    const panelAccessURL = data?.panelAccessURL || data?.panelAccessUrl || ''

    if (rotatePanelEntry) {
      await maybeRedirectToPanelEntry(panelAccessURL, '新的安全入口已经生效，建议立即跳转到新地址继续操作。')
      return
    }

    if (panelEntry.panelEntryEnabled) {
      await maybeRedirectToPanelEntry(panelAccessURL, '安全入口已经启用，建议立即跳转到新的访问地址。')
    }
  } catch {
    ElMessage.error(rotatePanelEntry ? '轮换安全入口失败' : '保存安全入口配置失败')
  } finally {
    panelEntry.saving = false
  }
}

const copyPanelAccessURL = async () => {
  const accessURL = currentPanelAccessURL.value
  if (!accessURL) {
    ElMessage.warning('暂无可复制的访问地址')
    return
  }
  try {
    await writeClipboardText(accessURL)
    ElMessage.success('访问地址已复制')
  } catch {
    ElMessage.error('复制失败，请检查浏览器剪贴板权限')
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
      <div class="basic-card__title">面板设置</div>
    </div>
    <div class="basic-card__body">
      <setting-form :data="conf.settingData" />
    </div>

    <div class="panel-entry-card" v-loading="panelEntry.loading">
      <div class="panel-entry-card__header">
        <div>
          <div class="panel-entry-card__title">面板安全入口</div>
          <p class="panel-entry-card__desc">启用后面板将通过随机路径访问，可有效降低被扫描和暴力探测的风险。</p>
        </div>
        <div class="panel-entry-card__status" :class="{ active: panelEntry.panelEntryEnabled }">
          {{ panelEntryAccessLabel }}
        </div>
      </div>

      <div class="panel-entry-overview">
        <div class="panel-entry-overview__item">
          <span>当前入口路径</span>
          <strong>{{ panelEntry.panelEntryPath || '自动生成 / 未启用' }}</strong>
        </div>
        <div class="panel-entry-overview__item">
          <span>生效状态</span>
          <strong>{{ panelEntry.restartRequired ? '需要重启生效' : '已生效' }}</strong>
        </div>
        <div class="panel-entry-overview__item panel-entry-overview__item--wide">
          <span>当前访问地址</span>
          <strong>{{ currentPanelAccessURL || '未生成' }}</strong>
        </div>
      </div>

      <div class="panel-entry-form">
        <div class="panel-entry-form__row">
          <label>启用安全入口</label>
          <div class="panel-entry-form__control panel-entry-form__control--inline">
            <el-switch v-model="panelEntry.panelEntryEnabled" />
            <span class="panel-entry-form__hint">关闭时保持根路径访问；开启后根路径会返回 404。</span>
          </div>
        </div>

        <div class="panel-entry-form__row">
          <label>自定义入口路径</label>
          <div class="panel-entry-form__control">
            <el-input
              v-model="panelEntry.panelEntryPath"
              :disabled="!panelEntry.panelEntryEnabled"
              placeholder="留空则由后端自动生成，例如 /AbCd123456"
            />
            <span class="panel-entry-form__hint">格式固定为 `/&lt;slug&gt;`，留空即可自动生成。轮换入口时会忽略这里的值。</span>
          </div>
        </div>
      </div>

      <div class="panel-entry-actions">
        <el-button type="primary" :loading="panelEntry.saving" @click="savePanelEntry(false)">保存配置</el-button>
        <el-button :disabled="!currentPanelAccessURL" @click="copyPanelAccessURL">复制访问地址</el-button>
        <el-button
          type="warning"
          plain
          :disabled="!panelEntry.panelEntryEnabled"
          :loading="panelEntry.saving"
          @click="savePanelEntry(true)"
        >
          轮换安全入口
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
    padding: 8px 0 18px;
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
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 22px;
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
