import { describe, expect, it } from 'vitest'
import {
  addDaysIso,
  cx,
  emptyRich,
  filledSceneDeptNotes,
  floatNearCursor,
  formatDateShort,
  formatDateZh,
  formatTimestamp,
  isRichEmpty,
  omitKey,
  richFromText,
  richToPlain,
  sceneRemarkOn,
  toggleSceneDeptNote,
  toggleSceneRemark,
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

describe('toggleSceneDeptNote', () => {
  it('勾選＝加入空字串欄位，再切一次＝移除該欄位', () => {
    const on = toggleSceneDeptNote({}, 'art')
    expect(on).toEqual({ art: '' })
    expect(toggleSceneDeptNote(on, 'art')).toEqual({})
  })

  it('回傳新物件，不改動原本的內容', () => {
    const src = { props: '紅色椅子' }
    const next = toggleSceneDeptNote(src, 'wardrobe')
    expect(next).toEqual({ props: '紅色椅子', wardrobe: '' })
    expect(src).toEqual({ props: '紅色椅子' })
  })

  it('取消勾選會一併清除已輸入的文字（不保留草稿）', () => {
    const on = { hair: '長髮後梳' }
    expect(toggleSceneDeptNote(toggleSceneDeptNote(on, 'hair'), 'hair')).toEqual({ hair: '' })
  })

  it('不影響其他部門的勾選狀態', () => {
    const on = { art: '桌椅換新', props: '' }
    expect(toggleSceneDeptNote(on, 'props')).toEqual({ art: '桌椅換新' })
    expect(toggleSceneDeptNote(on, 'hair')).toEqual({ art: '桌椅換新', props: '', hair: '' })
  })
})

describe('filledSceneDeptNotes', () => {
  it('只取已勾選且有填內容的項目，並依美術／道具／服裝／化妝／髮型排序', () => {
    const notes = { hair: '假髮 A', makeup: '底妝 B', art: '桌椅換新', props: '   ' }
    expect(filledSceneDeptNotes(notes)).toEqual([
      { key: 'art', label: '美術說明', text: '桌椅換新' },
      { key: 'makeup', label: '化妝說明', text: '底妝 B' },
      { key: 'hair', label: '髮型說明', text: '假髮 A' },
    ])
  })

  it('未勾選（undefined）、空物件、只有空白內容時都回傳空陣列', () => {
    expect(filledSceneDeptNotes(undefined)).toEqual([])
    expect(filledSceneDeptNotes({})).toEqual([])
    expect(filledSceneDeptNotes({ props: '\n  ' })).toEqual([])
  })

  it('文字前後的空白會被去除', () => {
    expect(filledSceneDeptNotes({ wardrobe: '  學生制服  ' })).toEqual([
      { key: 'wardrobe', label: '服裝說明', text: '學生制服' },
    ])
  })
})

describe('sceneRemarkOn', () => {
  it('勾選旗標為 true 時即為已勾選（即使還沒輸入任何文字）', () => {
    expect(sceneRemarkOn({ remark: '', remarkOn: true })).toBe(true)
  })

  it('沒有旗標但已有文字時仍視為已勾選（舊檔相容）', () => {
    expect(sceneRemarkOn({ remark: '記得帶證件' })).toBe(true)
  })

  it('沒有旗標、文字也只有空白時為未勾選', () => {
    expect(sceneRemarkOn({ remark: '' })).toBe(false)
    expect(sceneRemarkOn({ remark: '   ', remarkOn: false })).toBe(false)
  })
})

describe('toggleSceneRemark', () => {
  it('勾選＝打開文字框並保留既有文字', () => {
    expect(toggleSceneRemark({ remark: '', remarkOn: false })).toEqual({ remarkOn: true, remark: '' })
  })

  it('取消勾選＝關閉文字框並清空文字（不保留草稿）', () => {
    expect(toggleSceneRemark({ remark: '記得帶證件', remarkOn: true })).toEqual({ remarkOn: false, remark: '' })
  })

  it('舊檔只剩文字、沒有旗標時，切換一次即視為取消勾選並清空', () => {
    expect(toggleSceneRemark({ remark: '記得帶證件' })).toEqual({ remarkOn: false, remark: '' })
  })
})

describe('floatNearCursor', () => {
  const viewport = { width: 1200, height: 800 }
  const size = { width: 200, height: 150 }

  it('游標右下方空間足夠時放在右下方（間距 18px）', () => {
    expect(floatNearCursor({ x: 100, y: 100 }, size, viewport)).toEqual({ x: 118, y: 118 })
  })

  it('右側空間不足時翻到游標左側', () => {
    expect(floatNearCursor({ x: 1150, y: 100 }, size, viewport)).toEqual({ x: 932, y: 118 })
  })

  it('下側空間不足時翻到游標上方', () => {
    expect(floatNearCursor({ x: 100, y: 700 }, size, viewport)).toEqual({ x: 118, y: 532 })
  })

  it('游標貼近右下角時同時翻到左上', () => {
    expect(floatNearCursor({ x: 1150, y: 700 }, size, viewport)).toEqual({ x: 932, y: 532 })
  })

  it('視窗左上角的游標不會讓預覽超出邊界', () => {
    expect(floatNearCursor({ x: 0, y: 0 }, size, viewport)).toEqual({ x: 18, y: 18 })
  })

  it('預覽比視窗還大時固定在 padding 處，不會超出邊界', () => {
    expect(
      floatNearCursor({ x: 150, y: 100 }, { width: 320, height: 320 }, { width: 300, height: 200 }),
    ).toEqual({ x: 12, y: 12 })
  })

  it('可自訂間距與邊界留白', () => {
    expect(floatNearCursor({ x: 100, y: 100 }, size, viewport, 0, 0)).toEqual({ x: 100, y: 100 })
  })
})
