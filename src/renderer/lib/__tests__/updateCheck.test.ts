import { describe, expect, it } from 'vitest'
import { compareVersions, isNewerVersion, localDateKey } from '../updateCheck'

describe('compareVersions', () => {
  it('相同版本回傳 0', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0)
    expect(compareVersions('v1.2.3', '1.2.3')).toBe(0)
  })

  it('數字逐段比較（1.10.0 比 1.9.9 新，不能只用字串比較）', () => {
    expect(compareVersions('1.10.0', '1.9.9')).toBeGreaterThan(0)
    expect(compareVersions('1.9.9', '1.10.0')).toBeLessThan(0)
  })

  it('可接受前導 v', () => {
    expect(compareVersions('v1.3.0', '1.2.3')).toBeGreaterThan(0)
    expect(compareVersions('1.2.3', 'v1.3.0')).toBeLessThan(0)
  })

  it('主版本、次版本、修補版本皆納入比較', () => {
    expect(compareVersions('2.0.0', '1.99.99')).toBeGreaterThan(0)
    expect(compareVersions('1.3.0', '1.2.99')).toBeGreaterThan(0)
    expect(compareVersions('1.2.4', '1.2.3')).toBeGreaterThan(0)
  })
})

describe('isNewerVersion', () => {
  it('只有候選版本較新時才回傳 true', () => {
    expect(isNewerVersion('v1.3.0', '1.2.3')).toBe(true)
    expect(isNewerVersion('v1.2.3', '1.2.3')).toBe(false)
    expect(isNewerVersion('v1.2.2', '1.2.3')).toBe(false)
  })
})

describe('localDateKey', () => {
  it('以本地日期輸出 YYYY-MM-DD（個位數月、日補零）', () => {
    expect(localDateKey(new Date(2024, 0, 5))).toBe('2024-01-05')
    expect(localDateKey(new Date(2024, 11, 31))).toBe('2024-12-31')
  })
})
