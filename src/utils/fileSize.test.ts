import { describe, expect, it } from 'vitest'
import { formatBytes } from './fileSize'

describe('formatBytes', () => {
  it('formats bytes using bounded binary units', () => {
    expect(formatBytes(1)).toBe('1 B')
    expect(formatBytes(1024)).toBe('1.00 KB')
    expect(formatBytes(5 * 1024 ** 3)).toBe('5.00 GB')
    expect(formatBytes(2 * 1024 ** 5)).toBe('2048.00 TB')
  })

  it('normalizes invalid and empty values', () => {
    expect(formatBytes()).toBe('0 B')
    expect(formatBytes(-1)).toBe('0 B')
    expect(formatBytes(Number.NaN)).toBe('0 B')
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('0 B')
  })
})
