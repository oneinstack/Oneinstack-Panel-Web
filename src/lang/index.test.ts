import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from './index'

const cookie = {
  get: vi.fn(),
  set: vi.fn()
}

describe('i18n language switching', () => {
  beforeEach(() => {
    vi.stubGlobal('Cookie', cookie)
    cookie.get.mockReset()
    cookie.set.mockReset()
  })

  it('loads Chinese messages by default and interpolates parameters', async () => {
    await i18n.setLang('zh-CN')

    expect(i18n.t('file.uploadDownload')).toBe('上传/下载')
    expect((i18n.t as any)('file.summary.total', { total: 21 })).toBe('共 21 项')
    expect(i18n.t('database.phpMyAdmin.phpRequired')).toBe('安装 phpMyAdmin 前需要先安装 PHP 运行环境。')
    expect(i18n.t('container.dockerClient')).toBe('Docker 客户端')
  })

  it('switches between English and Chinese without missing module messages', async () => {
    await i18n.setLang('en-US')
    expect(i18n.t('file.uploadDownload')).toBe('Upload / Download')
    expect(i18n.t('container.registries')).toBe('Registries')

    await i18n.setLang('zh-CN')
    expect(i18n.t('file.uploadDownload')).toBe('上传/下载')
    expect(i18n.t('container.registries')).toBe('镜像仓库')
  })
})
