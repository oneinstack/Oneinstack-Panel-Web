import { h } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Api } from '@/api/Api'
import OperationPreviewContent from '@/components/operation-preview-content.vue'

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

const operationTitles: Record<string, string> = {
  'website.create': '创建网站操作预览',
  'website.update': '修改网站操作预览',
  'website.toggle': '切换网站状态操作预览',
  'software.install': '安装软件操作预览',
  'software.uninstall': '卸载软件操作预览',
  'software.service_action': '服务操作预览',
  'software.configure': '应用配置操作预览',
  'firewall.rule_change': '防火墙规则操作预览',
  'firewall.port_forward': '端口转发操作预览',
  'firewall.toggle': '防火墙开关操作预览',
  'panel.network': '面板访问配置操作预览',
  'panel.port_update': '面板端口操作预览'
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
      operationTitles[preview.operation] || '操作预览',
      {
        type: preview.review.riskLevel === 'high' ? 'warning' : 'info',
        confirmButtonText: hasFailedPrecheck(preview) ? '预检未通过' : '确认执行',
        cancelButtonText: '取消',
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
