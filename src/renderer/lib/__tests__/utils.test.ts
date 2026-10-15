import { describe, expect, it } from 'vitest'
import {
  addDaysIso,
  cx,
  emptyRich,
  formatDateShort,
  formatDateZh,
  formatTimestamp,
  isRichEmpty,
  omitKey,
  richFromText,
  richToPlain,
  uid,
} from '@/lib/utils'

describe('uid', () => {
  it('產生不重複的非空識別碼', () => {
    const ids = new Set(Array.from({ length: 50 }, () => uid()))
    expect(ids.size).toBe(50)
    expect([...ids].every((v) => typeof v === 'string' && v.length > 0)).toBe(true)
  })
})

describe('richToPlain / isRichEmpty / richFromText', () => {
  it('把段落節點接成純文字，並以換行分隔', () => {
    const nodes = [...richFromText('第一段'), ...richFromText('第二段')]
    expect(richToPlain(nodes)).toBe('第一段\n第二段')
  })

  it('richFromText 產生的內容可被還原', () => {
    expect(richToPlain(richFromText('單行備註'))).toBe('單行備註')
  })

  it('空內容（含只有空白）視為空', () => {
    expect(isRichEmpty(emptyRich())).toBe(true)
    expect(isRichEmpty(richFromText('   '))).toBe(true)
    expect(isRichEmpty(richFromText('有內容'))).toBe(false)
  })
})

describe('formatDateZh', () => {
  it('轉為中文日期與星期', () => {
    expect(formatDateZh('2025-03-22')).toBe('2025年3月22日 星期六')
    expect(formatDateZh('2024-02-29')).toBe('2024年2月29日 星期四')
  })

  it('格式不符時原樣回傳', () => {
    expect(formatDateZh('')).toBe('')
    expect(formatDateZh('2025/03/22')).toBe('2025/03/22')
  })
})

describe('addDaysIso', () => {
  it('可跨月與跨年加減天數', () => {
    expect(addDaysIso('2025-03-22', 10)).toBe('2025-04-01')
    expect(addDaysIso('2025-03-01', -1)).toBe('2025-02-28')
    expect(addDaysIso('2025-12-31', 1)).toBe('2026-01-01')
    expect(addDaysIso('2024-02-28', 1)).toBe('2024-02-29')
  })

  it('加 0 天不改變日期', () => {
    expect(addDaysIso('2025-03-22', 0)).toBe('2025-03-22')
  })
})

describe('formatDateShort', () => {
  it('轉為 M/D (週) 格式', () => {
    expect(formatDateShort('2025-03-22')).toBe('3/22 (六)')
  })

  it('空字串顯示未設定日期，非日期字串原樣回傳', () => {
    expect(formatDateShort('')).toBe('未設定日期')
    expect(formatDateShort('待確認')).toBe('待確認')
  })
})

describe('formatTimestamp', () => {
  it('輸出 yyyy.mm.dd - hh:mm:ss 並補零', () => {
    expect(formatTimestamp(new Date(2025, 2, 5, 9, 8, 7))).toBe('2025.03.05 - 09:08:07')
    expect(formatTimestamp(new Date(2024, 11, 31, 23, 59, 59))).toBe('2024.12.31 - 23:59:59')
  })
})

describe('omitKey', () => {
  it('移除指定 key 且不改動原物件', () => {
    const src = { a: 1, b: 2 }
    expect(omitKey(src, 'a')).toEqual({ b: 2 })
    expect(src).toEqual({ a: 1, b: 2 })
  })
})

describe('cx', () => {
  it('過濾 falsy 值後以空白串接', () => {
    expect(cx('a', false, null, undefined, 'b')).toBe('a b')
    expect(cx()).toBe('')
  })
})
