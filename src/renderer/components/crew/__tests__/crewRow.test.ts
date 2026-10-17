import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { describe, expect, it } from 'vitest'
import type { CrewCall, CrewMember } from '@shared/schema'
import { CrewRow } from '../CrewRow'

const member = (over: Partial<CrewMember> = {}): CrewMember => ({
  id: 'm1',
  departmentId: 'd1',
  position: '導演',
  name: '曾培杰',
  phone: '091719029',
  ...over,
})

const call = (over: Partial<CrewCall> = {}): CrewCall => ({ working: true, callTime: '09:30', ...over })

/** 以 SSR 渲染單一列（node 環境、不需 DOM），回傳其 HTML 字串 */
const renderRow = (m: CrewMember, c: CrewCall): string =>
  renderToStaticMarkup(
    createElement(DndContext, {
      children: createElement(SortableContext, {
        items: [m.id],
        strategy: verticalListSortingStrategy,
        children: createElement(CrewRow, { member: m, call: c, dayCall: '09:30' }),
      }),
    }),
  )

/**
 * 拖曳要順的關鍵，是每一列必須把「位移節點」與「動畫節點」拆成兩層，這裡把結構固定下來：
 *   外層 .crew-item  dnd-kit 的 setNodeRef 目標，只負責 transform 位移（相鄰列讓位＝排擠效果）。
 *   內層 .crew-row   framer-motion 的動畫元素，只負責進／退場的高度與透明度。
 * 若兩者合併成同一元素，framer-motion 的 layout 投影會覆寫 transform，拖曳時就會抖動。
 * （此測試只能驗證圖層分工，實際滑順度仍需在應用程式中手動拖曳確認。）
 */
describe('CrewRow 的拖曳圖層', () => {
  it('dnd-kit 的位移節點在外、framer-motion 的動畫卡片在內', () => {
    const html = renderRow(member(), call())

    const node = html.indexOf('class="crew-item"')
    const row = html.indexOf('class="crew-row')

    expect(node).toBeGreaterThanOrEqual(0)
    expect(row).toBeGreaterThan(node)
  })

  it('動畫卡片只做高度與透明度，不碰 transform', () => {
    const html = renderRow(member(), call())
    const style = html.match(/<div class="crew-row[^"]*" style="([^"]*)"/)?.[1] ?? ''

    // 動畫卡片必須在位移節點裡面，不能自己就是最外層（否則就會同時被 dnd-kit 寫 transform）
    expect(html).not.toMatch(/^<div class="crew-row/)
    // 進場動畫：高度與透明度由 framer-motion 負責；位移必須留給 dnd-kit，動畫卡片不得出現 transform
    expect(style).toMatch(/opacity:\s*0/)
    expect(style).toMatch(/height:\s*0/)
    expect(style).not.toContain('transform')
  })

  it('位移節點本身不帶動畫樣式，並掛上拖曳把手與無障礙屬性', () => {
    const html = renderRow(member(), call())

    // 閒置時 dnd-kit 不會給 transform，因此外層不該有任何 inline style
    expect(html).toMatch(/^<div class="crew-item"(?!\s+style=)[^>]*>/)
    // 無障礙屬性與拖曳把手都掛在真正的按鈕上
    expect(html).toContain('class="drag-handle"')
    expect(html).toContain('aria-label="拖曳排序"')
    expect(html).toContain('aria-roledescription="sortable"')
    expect(html).toContain('type="button"')
  })
})

/**
 * 列的其餘行為沿用原本的規則：不出勤的列整列淡化，並由 .crew-row.row-inline.off
 * 把欄位文字轉為灰色（CSS 無法在此驗證，這裡只確認 off 這個 class 有正確掛上），
 * 勾選框與通告時間仍綁在「目前這一天」的 crewCalls 上。
 */
describe('CrewRow 的本日出勤', () => {
  it('出勤時列不淡化，勾選框為已勾選', () => {
    const html = renderRow(member(), call())

    expect(html).toContain('class="crew-row row-inline"')
    expect(html).toMatch(/<input type="checkbox" checked=""/)
  })

  it('不出勤時列帶 off（維持原本的淡化效果），勾選框不勾選', () => {
    const html = renderRow(member(), call({ working: false }))

    expect(html).toContain('class="crew-row row-inline off"')
    expect(html).not.toMatch(/<input type="checkbox" checked=""/)
  })

  it('通告欄位標籤會帶入當天的預設通告時間', () => {
    expect(renderRow(member(), call())).toContain(
      '<span class="field-label">通告（預設 09:30）</span>',
    )
  })

  it('職位、姓名、電話與刪除鈕都還在同一列', () => {
    const html = renderRow(member(), call())

    for (const placeholder of ['職位', '姓名', '電話']) {
      expect(html).toContain(`placeholder="${placeholder}"`)
    }
    expect(html).toContain('value="導演"')
    expect(html).toContain('class="icon-btn danger"')
    expect(html).toContain('aria-label="刪除"')
  })
})
