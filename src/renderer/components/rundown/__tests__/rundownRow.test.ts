import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { describe, expect, it } from 'vitest'
import type { BreakItem, RundownItem, SceneItem } from '@shared/schema'
import { emptyRich } from '@/lib/utils'
import { RundownRow } from '../RundownRow'

const scene = (over: Partial<SceneItem> = {}): SceneItem => ({
  id: 's1',
  kind: 'scene',
  time: '08:00',
  sceneNumber: '1',
  shotNumber: '1A',
  cameraMovement: '',
  intExt: 'INT',
  dayNight: 'D',
  setName: '',
  location: '',
  description: emptyRich(),
  castIds: [],
  extrasNote: '',
  storyboardAssetIds: [],
  ...over,
})

const brk = (over: Partial<BreakItem> = {}): BreakItem => ({
  id: 'b1',
  kind: 'break',
  time: '12:00',
  label: '午餐',
  durationMin: 60,
  ...over,
})

/** 以 SSR 渲染單一列（node 環境、不需 DOM），回傳其 HTML 字串 */
const renderRow = (item: RundownItem): string =>
  renderToStaticMarkup(
    createElement(DndContext, {
      children: createElement(SortableContext, {
        items: [item.id],
        strategy: verticalListSortingStrategy,
        children: createElement(RundownRow, { item }),
      }),
    }),
  )

/**
 * 拖曳要順的關鍵，是每一列必須把「位移節點」與「動畫節點」拆成兩層，這裡把結構固定下來：
 *   外層 .rundown-item  dnd-kit 的 setNodeRef 目標，只負責 transform 位移。
 *   內層 .rundown-row   framer-motion 的動畫元素，只負責進／退場的高度與透明度。
 * 若兩者合併成同一元素，framer-motion 的 layout 投影會覆寫 transform，拖曳時就會抖動。
 * （此測試只能驗證圖層分工，實際滑順度仍需在應用程式中手動拖曳確認。）
 */
describe('RundownRow 的拖曳圖層', () => {
  const cases: Array<[string, RundownItem, string]> = [
    ['場次', scene(), 'rundown-row scene'],
    ['休息', brk(), 'rundown-row break'],
  ]

  it.each(cases)('%s列：dnd-kit 的位移節點在外、framer-motion 的動畫卡片在內', (_name, item, cls) => {
    const html = renderRow(item)

    const node = html.indexOf('class="rundown-item"')
    const card = html.indexOf(`class="${cls}"`)

    expect(node).toBeGreaterThanOrEqual(0)
    expect(card).toBeGreaterThan(node)
  })

  it.each(cases)('%s列：framer-motion 的動畫卡片只做高度與透明度，不碰 transform', (_name, item, cls) => {
    const html = renderRow(item)
    const cardStyle = html.match(new RegExp(`<div class="${cls}" style="([^"]*)"`))?.[1] ?? ''

    // 動畫卡片必須在位移節點裡面，不能自己就是最外層（否則就會同時被 dnd-kit 寫 transform）
    expect(html).not.toMatch(new RegExp(`^<div class="${cls}"`))
    // 進場動畫：高度與透明度由 framer-motion 負責
    expect(cardStyle).toMatch(/opacity:\s*0/)
    expect(cardStyle).toMatch(/height:\s*0/)
    // 位移必須留給 dnd-kit，動畫卡片不得出現 transform
    expect(cardStyle).not.toContain('transform')
  })

  it.each(cases)('%s列：dnd-kit 的位移節點本身不帶動畫樣式', (_name, item) => {
    const html = renderRow(item)

    // 閒置時 dnd-kit 不會給 transform，因此外層不該有任何 inline style
    expect(html).toMatch(/^<div class="rundown-item"(?!\s+style=)[^>]*>/)
    // 無障礙屬性與拖曳把手都掛在真正的按鈕上
    expect(html).toContain('class="drag-handle"')
    expect(html).toContain('aria-roledescription="sortable"')
    expect(html).toContain('type="button"')
  })
})
