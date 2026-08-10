import { describe, expect, it } from 'vitest'
import { resolveHttpErrorMessage } from './http-error'

describe('resolveHttpErrorMessage', () => {
  it('prefers detail when present', () => {
    expect(resolveHttpErrorMessage({
      message: '更新清单校验失败',
      error: {
        message: '更新清单校验失败',
        detail: '请检查请求字段是否完整，并确认字段类型、格式和取值范围符合接口要求。'
      }
    })).toBe('请检查请求字段是否完整，并确认字段类型、格式和取值范围符合接口要求。')
  })

  it('falls back to message when detail is missing', () => {
    expect(resolveHttpErrorMessage({ error: { message: '容器终端仅允许通过 HTTPS/WSS 访问' } })).toBe('容器终端仅允许通过 HTTPS/WSS 访问')
  })
})
