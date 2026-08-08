import { describe, expect, it } from 'vitest'
import { resolveHttpErrorMessage } from './http-error'

describe('resolveHttpErrorMessage', () => {
  it('prefers the actionable API message over a generic detail', () => {
    expect(resolveHttpErrorMessage({
      message: '用户名格式不正确',
      error: {
        message: '用户名格式不正确',
        detail: '未提供底层错误详情，请根据 code 和 message 检查请求参数、权限配置及相关服务状态。'
      }
    })).toBe('用户名格式不正确')
  })

  it('keeps concrete details as a fallback for legacy responses', () => {
    expect(resolveHttpErrorMessage({ error: { detail: '连接数据库失败' } })).toBe('连接数据库失败')
  })
})
