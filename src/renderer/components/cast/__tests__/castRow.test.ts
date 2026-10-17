import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { describe, expect, it } from 'vitest'
import type { CastMember } from '@shared/schema'
import { CastRow } from '../CastRow'

const member = (over: Partial<CastMember> = {}): CastMember => ({
  id: 'c1',
  number: 3,
  characterName: '子希',
  actorName: '洪祥恩',
  ...over,
})

/** 以 SSR 渲染單一列（node 環境、不需 DOM），回傳其 HTML 字串 */
const renderRow = (m: CastMember): string =>
  renderToStaticMarkup(
    createElement(DndContext, {
      children: createElement(SortableContext, {
        items: [m.id],
        strategy: verticalListSortingStrategy,
        children: createElement(CastRow, { member: m }),
      }),
    }),
  )

/**
 * 拖曳要順的關鍵，是每一列必須把「位移節點」與「動畫節點」拆成兩層，這裡把結構固定下來：
 *   外層 .cast-item  dnd-kit 的 setNodeRef 目標，只負責 transform 位移（相鄰列讓位＝排擠效果）。
 *   內層 .cast-row   framer-motion 的動畫元素，只負責進／退場的高度與透明度。
 * 若兩者合併成同一元素，framer-motion 的 layout 投影會覆寫 transform，拖曳時就會抖動。
 * （此測試只能驗證圖層分工，實際滑順度仍需在應用程式中手動拖曳確認。）
 */
describe('CastRow 的拖曳圖層', () => {
  it('dnd-kit 的位移節點在外、framer-motion 的動畫卡片在內', () => {
    const html = renderRow(member())

    const node = html.indexOf('class="cast-item"')
    const row = html.indexOf('class="cast-row"')

    expect(node).toBeGreaterThanOrEqual(0)
    expect(row).toBeGreaterThan(node)
  })

  it('動畫卡片只做高度與透明度，不碰 transform', () => {
    const html = renderRow(member())
    const rowStyle = html.match(/<div class="cast-row" style="([^"]*)"/)?.[1] ?? ''

    // 動畫卡片必須在位移節點裡面，不能自己就是最外層（否則就會同時被 dnd-kit 寫 transform）
    expect(html).not.toMatch(/^<div class="cast-row"/)
    // 進場動畫：高度與透明度由 framer-motion 負責
    expect(rowStyle).toMatch(/opacity:\s*0/)
    expect(rowStyle).toMatch(/height:\s*0/)
    // 位移必須留給 dnd-kit，動畫卡片不得出現 transform
    expect(rowStyle).not.toContain('transform')
  })

  it('位移節點本身不帶動畫樣式，並掛上拖曳把手與無障礙屬性', () => {
    const html = renderRow(member())

    // 閒置時 dnd-kit 不會給 transform，因此外層不該有任何 inline style
    expect(html).toMatch(/^<div class="cast-item"(?!\s+style=)[^>]*>/)
    // 無障礙屬性與拖曳把手都掛在真正的按鈕上
    expect(html).toContain('class="drag-handle"')
    expect(html).toContain('aria-label="拖曳排序"')
    expect(html).toContain('aria-roledescription="sortable"')
    expect(html).toContain('type="button"')
  })
})

/**
 * 編號欄位：拖曳排序只換位置、不動編號，因此編號沿用原本的徽章外觀，
 * 但內容改成可直接輸入的欄位，需要調整時自己點進去改。
 */
describe('CastRow 的編號欄位', () => {
  const badgeOf = (html: string) =>
    html.match(/<label class="badge badge-edit"[\s\S]*?<\/label>/)?.[0] ?? ''

  it('沿用原本的徽章外觀，內容改成可直接輸入的編號欄位', () => {
    const badge = badgeOf(renderRow(member({ number: 3 })))

    expect(badge).toContain('title="編號（可點擊修改）"')
    expect(badge).toContain('aria-label="編號"')
    // SSR 會保留 React 的駝峰屬性名，瀏覽器實際渲染成 inputmode="numeric"
    expect(badge).toContain('inputMode="numeric"')
    expect(badge).toContain('value="3"')
  })

  it('顯示的是 store 裡的編號（不會被列順序或拖拉改寫）', () => {
    expect(badgeOf(renderRow(member({ number: 7 })))).toContain('value="7"')
  })

  it('角色名稱、演員姓名、電話、Email 與刪除鈕都還在同一列', () => {
    const html = renderRow(member())

    for (const label of ['角色名稱', '演員姓名', '電話', 'Email']) {
      expect(html).toContain(`<span class="field-label">${label}</span>`)
    }
    expect(html).toContain('class="icon-btn danger"')
  })
})
