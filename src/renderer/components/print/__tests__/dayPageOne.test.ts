import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ShootDay } from '@shared/schema'
import { createEmptyDocument } from '@/lib/defaults'
import { DayPageOne } from '../DayPageOne'

/** 以 SSR 渲染通告表第一頁（node 環境、不需 DOM），回傳其 HTML 字串 */
const render = (over: Partial<ShootDay> = {}): string => {
  const doc = createEmptyDocument()
  const day: ShootDay = { ...doc.days[0], ...over }
  return renderToStaticMarkup(createElement(DayPageOne, { doc, day, index: 0 }))
}

/**
 * 「本日資訊」的通告備註（generalCallNote）要出現在通告表預覽（第一頁）：
 * 位置固定在重要聯絡人欄位的「排程版本」下一行，並沿用 .meta 字體樣式。
 */
describe('通告表：通告備註', () => {
  it('有填通告備註時接在排程版本下方，並使用 .meta 樣式', () => {
    const html = render({ generalCallNote: '颱風備案：改拍室內', scheduleVersion: 'A 版' })
    const keyPeople = html.match(/<div class="cs-keypeople">[\s\S]*?<\/div>/)?.[0] ?? ''

    expect(keyPeople).toContain('<p class="meta">通告備註：颱風備案：改拍室內</p>')
    expect(keyPeople).toContain('<p class="meta">排程版本：A 版</p>')
    expect(keyPeople).toContain(
      '<p class="meta">排程版本：A 版</p><p class="meta">通告備註：颱風備案：改拍室內</p>',
    )
    expect(html).not.toContain('cs-callnote')
  })

  it('未填或只有空白時不印出通告備註', () => {
    for (const note of ['', '   ', undefined]) {
      const html = render({ generalCallNote: note })

      expect(html).not.toContain('通告備註')
    }
  })

  it('前後空白會先去除再印出', () => {
    const html = render({ generalCallNote: '  記得帶證件  ' })

    expect(html).toContain('通告備註：記得帶證件</p>')
    expect(html).not.toContain('  記得帶證件  ')
  })
})
