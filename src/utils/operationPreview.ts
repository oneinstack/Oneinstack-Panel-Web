import { h } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Api } from '@/api/modules'
import OperationPreviewContent from '@/components/operation-preview-content.vue'
import i18n from '@/lang'

export interface OperationPreview {
  previewId: string
  operation: string
  summary?: string
  review: {
    required: boolean
    riskLevel: 'low' | 'medium' | 'high' | string
    reason?: string
  }
  files?: Array<{
    path: string
    action: string
    changeSummary?: string
    diff?: string
  }>
  actions?: Array<{
    type: string
    name: string
    displayCommand?: string
    service?: string
  }>
  prechecks?: Array<{
    name: string
    status: 'passed' | 'failed' | 'deferred' | string
    message?: string
  }>
  impact?: {
    writeFiles?: boolean
    modifyDatabase?: boolean
    restartService?: boolean
    reloadService?: boolean
    networkRisk?: boolean
  }
  rollback?: {
    supported: boolean
    summary?: string
    unrecoverable?: string[]
  }
  effectiveValues?: Array<{
    key: string
    value?: unknown
    sensitive?: boolean
    source?: string
  }>
  expiresAt?: string
}

export const normalizeOperationPreview = (response: any): OperationPreview => {
  const payload = response?.data ?? response
  const preview = payload?.preview ?? payload
  const plan = preview?.plan ?? {}
  const review = preview?.review ?? {}
  const impact = preview?.impact ?? plan?.impact ?? {}
  const rollback = preview?.rollback ?? plan?.rollback
  const effectiveValues =
    preview?.effectiveValues ??
    preview?.effective_values ??
    plan?.effectiveValues ??
    plan?.effective_values ??
    []

  return {
    ...preview,
    previewId: preview?.previewId ?? preview?.preview_id ?? preview?.id ?? '',
    operation: preview?.operation ?? '',
    summary: preview?.summary ?? plan?.summary ?? review?.summary,
    review: {
      ...review,
      required: Boolean(review?.required),
      riskLevel: review?.riskLevel ?? review?.risk_level ?? 'low',
      reason: review?.reason
    },
    files: preview?.files ?? plan?.files ?? [],
    actions: preview?.actions ?? plan?.actions ?? [],
    prechecks: preview?.prechecks ?? plan?.prechecks ?? [],
    impact: {
      ...impact,
      writeFiles: impact?.writeFiles ?? impact?.write_files,
      modifyDatabase: impact?.modifyDatabase ?? impact?.modify_database,
      restartService: impact?.restartService ?? impact?.restart_service,
      reloadService: impact?.reloadService ?? impact?.reload_service,
      networkRisk: impact?.networkRisk ?? impact?.network_risk
    },
    rollback: rollback
      ? {
          ...rollback,
          supported: Boolean(rollback?.supported),
          unrecoverable: rollback?.unrecoverable ?? rollback?.unrecoverable_changes
        }
      : undefined,
    effectiveValues: normalizeEffectiveValues(effectiveValues),
    expiresAt: preview?.expiresAt ?? preview?.expires_at
  }
}

const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}

const normalizeEffectiveValues = (values: unknown) => {
  if (!Array.isArray(values)) return []
  return values.map((item) => {
    const raw = item && typeof item === 'object' ? item as Record<string, any> : {}
    const key = String(raw.key || '')
    const sensitive = raw.sensitive === true || raw.source === 'server_resolved' ||
      /password|passwd|secret|token|credential|private.?key/i.test(key)
    if (sensitive) {
      return {
        key,
        sensitive: true,
        source: raw.source
      }
    }
    return {
      ...raw,
      key
    }
  })
}

const operationTitleKeys: Record<string, string> = {
  'website.create': 'common.operationPreview.operationTitles.websiteCreate',
  'website.update': 'common.operationPreview.operationTitles.websiteUpdate',
  'website.settings.update': 'common.operationPreview.operationTitles.websiteSettingsUpdate',
  'website.config.update': 'common.operationPreview.operationTitles.websiteConfigUpdate',
  'website.webserver.config.update': 'common.operationPreview.operationTitles.websiteWebServerConfigUpdate',
  'website.toggle': 'common.operationPreview.operationTitles.websiteToggle',
  'software.install': 'common.operationPreview.operationTitles.softwareInstall',
  'software.uninstall': 'common.operationPreview.operationTitles.softwareUninstall',
  'software.service_action': 'common.operationPreview.operationTitles.softwareServiceAction',
  'software.configure': 'common.operationPreview.operationTitles.softwareConfigure',
  'firewall.rule_change': 'common.operationPreview.operationTitles.firewallRuleChange',
  'firewall.port_forward': 'common.operationPreview.operationTitles.firewallPortForward',
  'firewall.toggle': 'common.operationPreview.operationTitles.firewallToggle',
  'fail2ban.policy_change': 'common.operationPreview.operationTitles.fail2banPolicyChange',
  'fail2ban.ban': 'common.operationPreview.operationTitles.fail2banBan',
  'fail2ban.unban': 'common.operationPreview.operationTitles.fail2banUnban',
  'panel.network': 'common.operationPreview.operationTitles.panelNetwork',
  'panel.port_update': 'common.operationPreview.operationTitles.panelPortUpdate'
}

const hasFailedPrecheck = (preview: OperationPreview) =>
  (preview.prechecks || []).some((item) => item.status === 'failed')

export const isOperationCancelled = (error: unknown) =>
  error === 'cancel' ||
  error === 'close' ||
  (typeof error === 'object' && error !== null && (error as any).operationCancelled === true)

const createOperationCancelledError = () => {
  const error = new Error('OPERATION_CANCELLED') as Error & { operationCancelled: true }
  error.operationCancelled = true
  return error
}

const confirmOperationPreview = async (preview: OperationPreview, forceConfirm = false) => {
  if (!forceConfirm && !preview.review?.required) return
  try {
    await ElMessageBox.confirm(
      h(OperationPreviewContent, { preview }),
      operationTitleKeys[preview.operation]
        ? t(operationTitleKeys[preview.operation], 'Operation preview')
        : t('common.operationPreview.title', 'Operation preview'),
      {
        confirmButtonText: hasFailedPrecheck(preview)
          ? t('common.operationPreview.precheckFailed', 'Precheck failed')
          : t('common.operationPreview.confirmExecute', 'Confirm execution'),
        cancelButtonText: t('common.cancel', 'Cancel'),
        showConfirmButton: !hasFailedPrecheck(preview),
        closeOnClickModal: false,
        closeOnPressEscape: false,
        customClass: 'operation-preview-message-box'
      }
    )
  } catch (error) {
    if (isOperationCancelled(error)) throw createOperationCancelledError()
    throw error
  }
}

export const createOperationPreview = async (operation: string, payload: unknown) => {
  const response = await Api.previewOperation({ operation, payload })
  return normalizeOperationPreview(response)
}

export const executeOperationPreview = async (
  preview: OperationPreview,
  options: { confirmPreview?: boolean; forceConfirm?: boolean } = {},
) => {
  if (options.confirmPreview !== false) {
    await confirmOperationPreview(preview, options.forceConfirm)
  }
  return Api.executeOperation(preview.previewId)
}

export const submitOperation = async <T = any>(
  operation: string,
  payload: unknown,
  options: { confirmPreview?: boolean; forceConfirm?: boolean } = {},
) => {
  const preview = await createOperationPreview(operation, payload)
  return await executeOperationPreview(preview, options) as T
}
