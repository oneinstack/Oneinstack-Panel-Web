import { useConfigStore } from '@/stores/modules/config'

type CertificateAccessNode = {
  key?: string
  enabled?: boolean
  children?: CertificateAccessNode[]
}

const findNode = (nodes: CertificateAccessNode[] = [], key: string): CertificateAccessNode | undefined => {
  for (const node of nodes) {
    if (!node) continue
    if (node.key === key) return node
    const child = findNode(node.children || [], key)
    if (child) return child
  }
  return undefined
}

const toCertificateButtonKey = (key: string) => {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('button.')) return normalized
  if (normalized.startsWith('certificate.')) return `button.${normalized}`
  return `button.certificate.${normalized}`
}

/**
 * Certificate operation permissions are resolved from certificate.children only.
 * Missing operation nodes intentionally remain allowed; only enabled=false denies access.
 */
export const hasCertificateButtonAccess = (key: string) => {
  const config = useConfigStore()
  if (config.isAdministrator()) return true

  const certificate = findNode(config.menuTree as CertificateAccessNode[], 'certificate')
  const children = certificate?.children
  if (!Array.isArray(children) || children.length === 0) return true

  const button = children.find((node) => node?.key === toCertificateButtonKey(key))
  return !button || button.enabled !== false
}

export interface CertificateCapabilities {
  canReadCertificate: boolean
  canViewCertificateDetail: boolean
  canApplyCertificate: boolean
  canUploadCertificate: boolean
  canCreateSelfSigned: boolean
  canRenewCertificate: boolean
  canBindWebsite: boolean
  canDownloadCertificate: boolean
  canDeleteCertificate: boolean
  canReadTask: boolean
  canManageTask: boolean
  canReadDnsAccount: boolean
  canManageDnsAccount: boolean
}

export const getCertificateCapabilities = (): CertificateCapabilities => ({
  canReadCertificate: hasCertificateButtonAccess('cert.read'),
  canViewCertificateDetail: hasCertificateButtonAccess('cert.detail'),
  canApplyCertificate: hasCertificateButtonAccess('cert.apply'),
  canUploadCertificate: hasCertificateButtonAccess('cert.upload'),
  canCreateSelfSigned: hasCertificateButtonAccess('cert.create.self-signed'),
  canRenewCertificate: hasCertificateButtonAccess('cert.renew'),
  canBindWebsite: hasCertificateButtonAccess('cert.bind.website'),
  canDownloadCertificate: hasCertificateButtonAccess('cert.download'),
  canDeleteCertificate: hasCertificateButtonAccess('cert.delete'),
  canReadTask: hasCertificateButtonAccess('task.read'),
  canManageTask: hasCertificateButtonAccess('task.manage'),
  canReadDnsAccount: hasCertificateButtonAccess('dns-account.read'),
  canManageDnsAccount: hasCertificateButtonAccess('dns-account.manage')
})
