import { Api } from '@/api/modules'

export const PANEL_UPDATE_CHECKED_EVENT = 'oneinstack:panel-update-checked'

export interface PanelUpdateCheckResult {
  enabled: boolean
  source?: 'center' | 'manifest'
  instanceId?: string
  currentVersion: string
  latestVersion?: string
  updateAvailable: boolean
  channel: string
  publishedAt?: string
  releaseNotes?: string
  compatible: boolean
  artifactSize?: number
  signingKeyId?: string
  trustRevision?: number
  trustSource?: 'center' | 'static'
  trustedKeyCount: number
  revokedKeyCount: number
  trustUpdatedAt?: string
}

let pendingCheck: Promise<PanelUpdateCheckResult> | undefined

export const publishPanelUpdateCheck = (result?: PanelUpdateCheckResult) => {
  window.dispatchEvent(new CustomEvent(PANEL_UPDATE_CHECKED_EVENT, { detail: result }))
}

export const requestPanelUpdateCheck = () => {
  if (pendingCheck) return pendingCheck

  pendingCheck = Api.checkPanelUpdate({ silentError: true })
    .then(({ data }) => {
      const result = data as PanelUpdateCheckResult
      publishPanelUpdateCheck(result)
      return result
    })
    .catch((error) => {
      publishPanelUpdateCheck()
      throw error
    })
    .finally(() => {
      pendingCheck = undefined
    })

  return pendingCheck
}
