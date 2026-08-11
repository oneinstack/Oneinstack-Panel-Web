import { h } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Api } from '@/api/modules'
import OperationPreviewContent from '@/components/operation-preview-content.vue'
import i18n from '@/lang'

export interface OperationPreview {
  previewId: string
  operation: string
  review: {
    required: boolean
    riskLevel: 'low' | 'medium' | 'high' | string
    reason?: string
  }
  files?: Array<{
    path: string
    action: string
    changeSummary?: string
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
  expiresAt?: string
}

const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}

const operationTitleKeys: Record<string, string> = {
  'website.create': 'common.operationPreview.operationTitles.websiteCreate',
  'website.update': 'common.operationPreview.operationTitles.websiteUpdate',
  'website.toggle': 'common.operationPreview.operationTitles.websiteToggle',
  'software.install': 'common.operationPreview.operationTitles.softwareInstall',
  'software.uninstall': 'common.operationPreview.operationTitles.softwareUninstall',
  'software.service_action': 'common.operationPreview.operationTitles.softwareServiceAction',
  'software.configure': 'common.operationPreview.operationTitles.softwareConfigure',
  'firewall.rule_change': 'common.operationPreview.operationTitles.firewallRuleChange',
  'firewall.port_forward': 'common.operationPreview.operationTitles.firewallPortForward',
  'firewall.toggle': 'common.operationPreview.operationTitles.firewallToggle',
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

const confirmOperationPreview = async (preview: OperationPreview) => {
  if (!preview.review?.required) return
  try {
    await ElMessageBox.confirm(
      h(OperationPreviewContent, { preview }),
      operationTitleKeys[preview.operation]
        ? t(operationTitleKeys[preview.operation], 'Operation preview')
        : t('common.operationPreview.title', 'Operation preview'),
      {
        type: preview.review.riskLevel === 'high' ? 'warning' : 'info',
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

export const submitOperation = async <T = any>(operation: string, payload: unknown) => {
  const { data } = await Api.previewOperation({ operation, payload })
  const preview = data as OperationPreview
  await confirmOperationPreview(preview)
  return await Api.executeOperation(preview.previewId) as T
}
